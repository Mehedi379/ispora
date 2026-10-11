import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { schemas, parse } from "../validate.js";
import { ymd } from "../dates.js";

const r = Router();
r.use(requireAuth);

const shape = (p) => ({
  id: p.id,
  client: p.client?.name || "",
  zone: p.client?.zone?.name || "",
  amount: p.amount,
  method: p.method,
  date: ymd(p.paidAt),
  collectedBy: p.collectedBy?.name || null,
  note: p.note || "",
});

r.get("/", async (req, res) => {
  const { from, to, zone, limit } = req.query;
  // Reseller hole shudhu nijer client-er payment dekhbe
  const where = {};
  if (req.user.role === "reseller") where.client = { resellerId: req.user.id };
  // Range/zone filter — Reports date-range niye ashe, na hole 200 limit-er purana data-i paito
  const day = /^\d{4}-\d{2}-\d{2}$/;
  if (from || to) {
    where.paidAt = {};
    if (from && day.test(String(from))) where.paidAt.gte = new Date(`${from}T00:00:00`);
    if (to && day.test(String(to))) where.paidAt.lte = new Date(`${to}T23:59:59.999`);
    if (!Object.keys(where.paidAt).length) delete where.paidAt;
  }
  if (zone) where.client = { ...(where.client || {}), zone: { name: String(zone) } };
  const n = Number(limit);
  const take = Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 5000) : 200;
  const list = await prisma.payment.findMany({
    where,
    include: { client: { include: { zone: true } }, collectedBy: true },
    orderBy: { id: "desc" }, take,
  });
  res.json(list.map(shape));
});

// Collect payment — client er due komay, invoice paid kore
r.post("/", async (req, res) => {
  const v = parse(schemas.payment, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { clientId, amount, method, note } = v.data;
  let { invoiceId } = v.data;
  const amt = Number(amount);

  // Reseller hole shudhu nijer client er jonno payment nite parbe
  if (req.user.role === "reseller") {
    const own = await prisma.client.findFirst({ where: { id: Number(clientId), resellerId: req.user.id } });
    if (!own) return res.status(403).json({ error: "Ei client apnar under e nei" });
  }

  // invoiceId na dile client er oldest baki invoice-e link kori —
  // nahole invoice status kabhu partial/paid hoto na (frontend theke id ashe na chilo)
  if (!invoiceId) {
    const oldest = await prisma.invoice.findFirst({
      where: { clientId: Number(clientId), status: { in: ["unpaid", "partial"] } },
      orderBy: { id: "asc" },
      select: { id: true },
    });
    invoiceId = oldest?.id || null;
  }
  // Nirdishto invoice jodi onno client er hoy — bhul data hobe, age check
  if (invoiceId) {
    const own = await prisma.invoice.findFirst({
      where: { id: Number(invoiceId), clientId: Number(clientId) },
      select: { id: true },
    });
    if (!own) return res.status(400).json({ error: "Invoice ti ei client er na" });
  }

  const payment = await prisma.$transaction(async (tx) => {
    // Due atomically komao (row lock + GREATEST floor) — purano read-modify-write e
    // duita collection ekshathe hole lost-update hoye due bhul hoye jeto.
    // dueDelta = actually koma holo (overpay e clamp), void e otai ferot jabe
    const [row] = await tx.$queryRaw`
      WITH cur AS (SELECT due, status, expiry FROM "Client" WHERE id = ${Number(clientId)} FOR UPDATE)
      UPDATE "Client" c
      SET due = GREATEST(0, cur.due - ${amt})
      FROM cur
      WHERE c.id = ${Number(clientId)}
      RETURNING cur.due AS due_before, c.due AS due_after, cur.status AS prev_status`;
    if (!row) throw Object.assign(new Error("Client nei"), { status: 400 });
    const dueBefore = Number(row.due_before);
    const newDue = Number(row.due_after);
    const dueDelta = dueBefore - newDue;
    const prevStatus = row.prev_status;
    const client = await tx.client.findUnique({ where: { id: Number(clientId) } });

    const pay = await tx.payment.create({
      data: {
        amount: amt, method: method || "Cash", note: note || null,
        clientId: Number(clientId),
        invoiceId: invoiceId || null,
        collectorId: req.user.id,
        dueDelta,
      },
      include: { client: { include: { zone: true } }, collectedBy: true },
    });

    // due already raw UPDATE-e hoye geche — ekhane shudhu renew/status
    const updateData = {};
    if (newDue === 0) {
      // Expire houar age dile current expiry theke, por dile aj theke — din nosto hobe na
      const now = new Date();
      const base = client?.expiry && new Date(client.expiry) > now ? new Date(client.expiry) : now;
      const next = new Date(base);
      next.setMonth(next.getMonth() + 1);
      updateData.expiry = next;
      // suspended = admin manual — collector-er payment seta uthabe na
      if (prevStatus !== "suspended") {
        updateData.status = "active";
        updateData.online = true; // bill clear hole line auto on
      }
    }

    if (Object.keys(updateData).length) {
      await tx.client.update({ where: { id: Number(clientId) }, data: updateData });
    }

    // invoice status
    if (invoiceId) {
      const inv = await tx.invoice.findUnique({ where: { id: Number(invoiceId) } });
      if (inv) {
        const paidTotal = await tx.payment.aggregate({
          where: { invoiceId: inv.id }, _sum: { amount: true },
        });
        const sum = paidTotal._sum.amount || 0;
        await tx.invoice.update({
          where: { id: inv.id },
          data: { status: sum >= inv.amount ? "paid" : sum > 0 ? "partial" : "unpaid" },
        });
      }
    }

    // Due puro clear hole client er baki (auto) invoice gulao paid kore di — owes nothing
    if (newDue === 0) {
      await tx.invoice.updateMany({
        where: { clientId: Number(clientId), status: { in: ["unpaid", "partial"] } },
        data: { status: "paid" },
      });
    }
    return pay;
  });

  res.status(201).json(shape(payment));
});

// Void/undo — admin only. Bhul collection tai due/ invoice abar thik kore.
// Note: renewal (expiry +1month) phirajay na — oita admin chaile manually thik korbe
r.delete("/:id", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  const pay = await prisma.payment.findUnique({ where: { id } });
  if (!pay) return res.status(404).json({ error: "Payment nei" });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.payment.delete({ where: { id } });

      // Due exactly restore (atomic increment + status) — overpay e clamp hoyechilo,
      // tai dueDelta ferot jay (purano amount noi). Suspended thakle status touch na.
      await tx.$executeRaw`
        UPDATE "Client"
        SET due = due + ${pay.dueDelta || 0},
            status = CASE WHEN due + ${pay.dueDelta || 0} > 0 AND status <> 'suspended'
                          THEN 'due' ELSE status END
        WHERE id = ${pay.clientId}`;

      // Ei client-er SHOB invoice er status abar payment-theke hisab —
      // due 0 hole je gula "force paid" kora hoyechilo, oigulao asol obosthay phire
      const invs = await tx.invoice.findMany({ where: { clientId: pay.clientId } });
      for (const inv of invs) {
        const agg = await tx.payment.aggregate({ where: { invoiceId: inv.id }, _sum: { amount: true } });
        const sum = agg._sum.amount || 0;
        if (sum >= inv.amount) continue; // asol-e paid — touch na
        const st = sum > 0 ? "partial" : "unpaid";
        if (inv.status !== st) await tx.invoice.update({ where: { id: inv.id }, data: { status: st } });
      }
    });
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: "Payment void fail holo" });
  }
});

export default r;
