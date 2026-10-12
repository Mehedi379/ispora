import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { nextInvoiceNumber } from "../numbering.js";
import { ymd } from "../dates.js";

const r = Router();
r.use(requireAuth);

const scope = (req) => (req.user.role === "reseller" ? { resellerId: req.user.id } : {});

// ---- Billing List: protyek active client-er ei maaser billing obostha ----
r.get("/list", async (req, res) => {
  const { zone, status } = req.query;
  const where = { deletedAt: null, leftAt: null, ...scope(req) };
  if (status) where.status = String(status);
  if (zone) where.zone = { name: String(zone) };

  const clients = await prisma.client.findMany({
    where, include: { zone: true, package: true, clientType: true, connectionType: true }, orderBy: { id: "desc" },
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const ids = clients.map((c) => c.id);

  // Ei maaser invoice (kon client already billed) + last payment + ei maaser received — bulk, N+1 edano
  const [invMonth, lastPays, recvMonth] = await Promise.all([
    prisma.invoice.findMany({
      where: { clientId: { in: ids }, issuedAt: { gte: monthStart } },
      select: { clientId: true, status: true },
    }),
    prisma.payment.groupBy({
      by: ["clientId"], where: { clientId: { in: ids } }, _max: { paidAt: true },
    }),
    prisma.payment.groupBy({
      by: ["clientId"], where: { clientId: { in: ids }, paidAt: { gte: monthStart } }, _sum: { amount: true },
    }),
  ]);
  const billedSet = new Set(invMonth.map((i) => i.clientId));
  const lastMap = {};
  for (const p of lastPays) lastMap[p.clientId] = p._max.paidAt;
  const recvMap = {};
  for (const p of recvMonth) recvMap[p.clientId] = p._sum.amount || 0;

  res.json(clients.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    pppoe: c.pppoe,
    zone: c.zone?.name || "",
    clientType: c.clientType?.name || "",
    connectionType: c.connectionType?.name || "",
    package: c.package?.name || "",
    speed: c.package?.speed || "",
    monthlyBill: c.monthlyBill ?? c.package?.price ?? 0,
    received: recvMap[c.id] || 0,
    vat: 0,
    due: c.due,
    advance: c.due < 0 ? Math.abs(c.due) : 0,
    online: c.online,
    status: c.status,
    billedThisMonth: billedSet.has(c.id),
    lastPayment: lastMap[c.id] ? ymd(lastMap[c.id]) : null,
    expiry: c.expiry ? ymd(c.expiry) : null,
  })));
});

// ---- Daily Bill Collection: ek diner (ba range) collection summary ----
r.get("/collection", async (req, res) => {
  const day = /^\d{4}-\d{2}-\d{2}$/;
  const from = day.test(String(req.query.from)) ? String(req.query.from) : ymd(new Date());
  const to = day.test(String(req.query.to)) ? String(req.query.to) : from;

  const where = {
    paidAt: { gte: new Date(`${from}T00:00:00`), lte: new Date(`${to}T23:59:59.999`) },
  };
  if (req.user.role === "reseller") where.client = { resellerId: req.user.id };

  const pays = await prisma.payment.findMany({
    where, include: { client: { include: { zone: true } }, collectedBy: true }, orderBy: { id: "desc" },
  });

  const byMethod = {};
  const byCollector = {};
  let total = 0;
  for (const p of pays) {
    total += p.amount;
    byMethod[p.method] = (byMethod[p.method] || 0) + p.amount;
    const col = p.collectedBy?.name || "—";
    byCollector[col] = (byCollector[col] || 0) + p.amount;
  }

  res.json({
    from, to,
    total,
    count: pays.length,
    byMethod: Object.entries(byMethod).map(([method, amount]) => ({ method, amount })),
    byCollector: Object.entries(byCollector).map(([name, amount]) => ({ name, amount })),
    payments: pays.map((p) => ({
      id: p.id,
      code: p.client ? String(p.client.id).padStart(4, "0") : "—",
      username: p.client?.pppoe || "",
      client: p.client?.name || "",
      phone: p.client?.phone || "",
      zone: p.client?.zone?.name || "",
      amount: p.amount,
      method: p.method,
      collectedBy: p.collectedBy?.name || "—",
      date: ymd(p.paidAt),
      time: new Date(p.paidAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      note: p.note || "",
    })),
  });
});

// ---- Bulk generate: ei maase jader bill boshe nai tader invoice banau (admin) ----
r.post("/generate", requireRole("admin"), async (req, res) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const clients = await prisma.client.findMany({
    where: { deletedAt: null, leftAt: null, status: { not: "suspended" } },
    include: { package: true },
  });
  const billedThisMonth = await prisma.invoice.findMany({
    where: { issuedAt: { gte: monthStart } }, select: { clientId: true },
  });
  const billedSet = new Set(billedThisMonth.map((i) => i.clientId));

  let created = 0;
  for (const c of clients) {
    const price = c.package?.price || 0;
    if (price <= 0 || billedSet.has(c.id)) continue;
    const number = await nextInvoiceNumber();
    const due = new Date();
    due.setDate(due.getDate() + 10);
    await prisma.$transaction([
      prisma.invoice.create({
        data: { number, amount: price, status: "unpaid", dueDate: due, note: "Monthly bill (manual generate)", clientId: c.id },
      }),
      prisma.client.update({ where: { id: c.id }, data: { due: { increment: price } } }),
    ]);
    created++;
  }
  res.json({ ok: true, created });
});

export default r;
