import { prisma } from "./db.js";
import { getTenantId } from "./tenantContext.js";

// Collision-proof sequence — Setting table te counter rakhi ar protiti number
// transaction er bhitore allocate kori. (Age count() diye number deya hoto —
// duita generator (invoices route + statusSweep) race korle duplicate number
// hoy ar unique constraint e 500 ashto.)
// Multi-tenant: counter protita tenant-er alada (tenantId soho), tai dui ISP-er
// invoice number collide kore na (number ekhon @@unique([tenantId, number])).
async function nextSeq(tx, key, seed) {
  const tid = getTenantId() ?? null;
  // FOR UPDATE row lock — dui transaction ekshathe read korle o duplicate
  // number hobe na. tenantId NULL-safe compare (IS NOT DISTINCT FROM).
  const rows = await tx.$queryRaw`SELECT value FROM "Setting" WHERE key = ${key} AND "tenantId" IS NOT DISTINCT FROM ${tid} FOR UPDATE`;
  const row = rows[0];
  const current = row ? Number(row.value) || 0 : await seed(tx);
  const next = current + 1;
  await tx.setting.upsert({
    where: { tenantId_key: { tenantId: tid, key } },
    create: { key, value: String(next), tenantId: tid },
    update: { value: String(next) },
  });
  return next;
}

// "INV-2610" -> 2610 ; missing/invalid suffix hole fallback
const maxSuffix = (numbers, fallback) =>
  numbers.reduce((m, n) => Math.max(m, Number(String(n).split("-")[1]) || 0), fallback);

// Counter row first-time create e dui-jon ekshathe create korte parbe —
// unique violation hole ekbar abar try (tarpor fail throw hobe)
const withRetry = async (fn) => {
  try { return await fn(); }
  catch (e) { if (e?.code === "P2002") return fn(); throw e; }
};

// Counter na thakle (purano DB) existing number theke seed kori
export const nextInvoiceNumber = () => withRetry(() =>
  prisma.$transaction(async (tx) => {
    const n = await nextSeq(tx, "invoiceSeq", async (t) =>
      maxSuffix((await t.invoice.findMany({ select: { number: true } })).map((r) => r.number), 2600)
    );
    return `INV-${n}`;
  })
);

export const nextTicketNumber = () => withRetry(() =>
  prisma.$transaction(async (tx) => {
    const n = await nextSeq(tx, "ticketSeq", async (t) =>
      maxSuffix((await t.ticket.findMany({ select: { number: true } })).map((r) => r.number), 100)
    );
    return `TK-${n}`;
  })
);
