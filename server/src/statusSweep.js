import { prisma } from "./db.js";
import { nextInvoiceNumber } from "./numbering.js";
import { ymd } from "./dates.js";
import { runDueSchedules } from "./routes/schedules.js";
import { runWithTenant } from "./tenantContext.js";

// Auto status + billing engine
// Lifecycle (suspended = admin manual, ei engine touch kore na):
//   expiry date porjonto             -> "active" (due 0) / "due" (manual due)
//   expiry periye gelo (billing day) -> notun bill boshe (invoice + due), status "due", line ON (grace)
//   grace (settings.dueAfterDays) cholakalin -> "due", line ON
//   grace sesh, taka ekhono baki     -> "expired", line OFF (settings.autoDisconnect on hole)
//
// Mane: DUE start hoy EXPIRY DATE theke, ar due holei line kate na —
// grace period (default 5 din) line ON thake, grace sesh holei line OFF.

const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

async function loadSettings() {
  const rows = await prisma.setting.findMany();
  const s = {};
  for (const row of rows) {
    try { s[row.key] = JSON.parse(row.value); } catch { s[row.key] = row.value; }
  }
  return {
    graceDays: Number(s.dueAfterDays ?? 5) || 0,
    autoOff: (s.autoDisconnect ?? "Enabled") !== "Disabled",
  };
}

export async function runStatusSweep() {
  // Multi-tenant: protita tenant-er sweep tar nijer context-e cholbe, jate shob
  // query/invoice auto oi tenant-e scope hoy (onno ISP-er data mix hobe na).
  const tenants = await prisma.tenant.findMany({ select: { id: true } });
  let changed = 0, billed = 0;
  for (const t of tenants) {
    const r = await runWithTenant({ tenantId: t.id }, () => sweepOneTenant());
    changed += r.changed; billed += r.billed;
  }
  return { changed, billed };
}

// Ekta tenant-er (current context) jonno status + billing sweep
async function sweepOneTenant() {
  const today = new Date();
  const todayStr = ymd(today);
  const { graceDays, autoOff } = await loadSettings();

  const clients = await prisma.client.findMany({
    where: { deletedAt: null, leftAt: null, status: { not: "suspended" } },
    include: { package: true },
  });

  let changed = 0;
  let billed = 0;

  for (const c of clients) {
    if (!c.expiry) continue; // expiry chara billing cycle bera kora jay na

    const expStr = ymd(c.expiry);
    const data = {};
    let next = c.status;
    let due = c.due || 0;

    if (todayStr <= expStr) {
      // Package ekhono valid.
      // Manual "active" (due thakleo) sweep palabe na — due clear hole 0 hoy,
      // ar expiry/billing event e sweep abar due/expired kore nibe.
      // Baki sob fresh-e: due baki thakle "due", due 0 hole "active".
      next = c.status === "active" ? "active" : due > 0 ? "due" : "active";
    } else {
      // Expiry periye gese -> ei cycle er bill ekbar boshai (double-bill guard)
      const alreadyBilled = await prisma.invoice.findFirst({
        where: { clientId: c.id, issuedAt: { gte: new Date(`${expStr}T00:00:00`) } },
        select: { id: true },
      });
      const price = c.package?.price || 0;
      if (!alreadyBilled && price > 0) {
        // shared sequence counter — route er sathe duplicate number hobe na
        const number = await nextInvoiceNumber();
        // Invoice create + due increment EK transaction-e — majhkhan-e crash hole
        // "invoice ache due barini" obostha thakto, ar alreadyBilled guard er karone
        // porer run-e due kabhu add hoto na. Increment = concurrent payment/void er
        // sathe lost-update hobe na. Advisory lock = dui instance race-e double-bill na.
        const ok = await prisma.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(${900000 + c.id}::bigint)`;
          const again = await tx.invoice.findFirst({
            where: { clientId: c.id, issuedAt: { gte: new Date(`${expStr}T00:00:00`) } },
            select: { id: true },
          });
          if (again) return false;
          await tx.invoice.create({
            data: {
              number,
              amount: price,
              status: "unpaid",
              dueDate: addDays(c.expiry, graceDays),
              note: "Auto monthly bill",
              clientId: c.id,
            },
          });
          await tx.client.update({ where: { id: c.id }, data: { due: { increment: price } } });
          return true;
        });
        if (ok) { due += price; billed += 1; }
      }

      // Grace: expiry + graceDays porjonto line ON, erpor expired + off
      const graceDeadlineStr = ymd(addDays(c.expiry, graceDays));
      if (todayStr <= graceDeadlineStr) {
        next = "due"; // grace cholche — net ON
      } else {
        next = "expired";
        if (autoOff && c.online) data.online = false; // grace sesh — net OFF
      }
    }

    if (next !== c.status) data.status = next;
    if (Object.keys(data).length) {
      await prisma.client.update({ where: { id: c.id }, data });
      changed++;
    }
  }

  if (billed) console.log(`[statusSweep] ${billed} ta auto-bill boshlo (${todayStr})`);
  if (changed) console.log(`[statusSweep] ${changed} client er status update holo (${todayStr})`);

  // Due (runAt periye jawa) scheduler action gula cholao
  try {
    const ran = await runDueSchedules();
    if (ran) console.log(`[scheduler] ${ran} ta scheduled action cholano holo`);
  } catch (e) { console.error("[scheduler] error:", e.message); }

  return { changed, billed };
}

// ===== SaaS recurring billing sweep (tenant-der nijer subscription bill) =====
// trial sesh -> past_due (lock); active period sesh -> notun SaaS invoice + past_due.
// Global model (Subscription/Tenant/SaasInvoice) niye kaj — tenant context lage na.
export async function runSaasBillingSweep() {
  const now = new Date();
  const subs = await prisma.subscription.findMany({ include: { plan: true } });
  let flipped = 0, invoiced = 0;
  for (const s of subs) {
    if (s.status === "trial" && s.trialEndsAt && new Date(s.trialEndsAt) < now) {
      await prisma.subscription.update({ where: { id: s.id }, data: { status: "past_due" } });
      await prisma.tenant.update({ where: { id: s.tenantId }, data: { status: "past_due" } });
      flipped++;
    } else if (s.status === "active" && s.currentPeriodEnd && new Date(s.currentPeriodEnd) < now) {
      const existing = await prisma.saasInvoice.findFirst({ where: { tenantId: s.tenantId, status: "unpaid" } });
      if (!existing) {
        const amount = s.plan?.priceMonthly || 0;
        await prisma.saasInvoice.create({
          data: { number: `SAAS-${s.tenantId}-${Date.now().toString().slice(-7)}`, amount, status: "unpaid", subscriptionId: s.id, tenantId: s.tenantId, periodStart: s.currentPeriodEnd, periodEnd: new Date(now.getTime() + 30 * 864e5) },
        });
        invoiced++;
      }
      await prisma.subscription.update({ where: { id: s.id }, data: { status: "past_due" } });
      await prisma.tenant.update({ where: { id: s.tenantId }, data: { status: "past_due" } });
    }
  }
  if (flipped || invoiced) console.log(`[saasBilling] ${flipped} trial expired, ${invoiced} renewal invoice`);
  return { flipped, invoiced };
}

// Server e: start e ekbar + protidin (12 ghonta por por) cholbe
export function startStatusSweep() {
  const runAll = () => {
    runStatusSweep().catch((e) => console.error("[statusSweep] error:", e.message));
    runSaasBillingSweep().catch((e) => console.error("[saasBilling] error:", e.message));
  };
  runAll();
  setInterval(runAll, 12 * 60 * 60 * 1000);
}
