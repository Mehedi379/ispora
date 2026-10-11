import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../auth.js";

const r = Router();
r.use(requireAuth);

// Dashboard + Reports er summary
r.get("/", async (req, res) => {
  // Reseller hole shob hisheb shudhu tar nijer client-er upor
  const rid = req.user.role === "reseller" ? req.user.id : null;
  const base = { deletedAt: null, ...(rid ? { resellerId: rid } : {}) };
  const payScope = rid ? { client: { resellerId: rid } } : {};
  const [total, active, online, dueAgg, zones] = await Promise.all([
    prisma.client.count({ where: base }),
    prisma.client.count({ where: { ...base, status: "active" } }),
    prisma.client.count({ where: { ...base, online: true } }),
    prisma.client.aggregate({ where: base, _sum: { due: true } }),
    prisma.zone.findMany({ include: { _count: { select: { clients: rid ? { where: { resellerId: rid } } : true } } } }),
  ]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [collectionAgg, todayAgg] = await Promise.all([
    prisma.payment.aggregate({ where: { paidAt: { gte: monthStart }, ...payScope }, _sum: { amount: true } }),
    // Payment page er "Today's Collection" — age 200-ta payment list theke count kore bhul hoito
    prisma.payment.aggregate({ where: { paidAt: { gte: dayStart }, ...payScope }, _sum: { amount: true } }),
  ]);

  // Last 12 months revenue (actual payments, month-wise)
  const yearStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const yearPays = await prisma.payment.findMany({
    where: { paidAt: { gte: yearStart }, ...payScope }, select: { amount: true, paidAt: true },
  });
  const monthly = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthly.push({ label: d.toLocaleString("en-US", { month: "short" }), year: d.getFullYear(), month: d.getMonth(), total: 0 });
  }
  for (const p of yearPays) {
    const d = new Date(p.paidAt);
    const b = monthly.find((m) => m.year === d.getFullYear() && m.month === d.getMonth());
    if (b) b.total += p.amount;
  }

  res.json({
    totalClients: total,
    active,
    online,
    offline: total - online,
    due: dueAgg._sum.due || 0,
    collectionThisMonth: collectionAgg._sum.amount || 0,
    collectionToday: todayAgg._sum.amount || 0,
    monthlyRevenue: monthly.map((m) => ({ label: m.label, total: m.total })),
    zones: zones.map((z) => ({ name: z.name, clients: z._count.clients })),
  });
});

// Admin dashboard — competitor-style 20-tile numbers (sob real DB count)
r.get("/dashboard", async (req, res) => {
  const rid = req.user.role === "reseller" ? req.user.id : null;
  const base = { deletedAt: null, leftAt: null, ...(rid ? { resellerId: rid } : {}) };
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const payScope = rid ? { client: { resellerId: rid } } : {};
  const [
    total, running, due, expired, suspended, online, offline, newClient, left,
    paid, unpaid, billExpire, graceOnline, totalPop, popClients,
    pendingTickets, processingTickets, pendingTasks, processingTasks,
    collMonth, collToday,
  ] = await Promise.all([
    prisma.client.count({ where: base }),
    prisma.client.count({ where: { ...base, status: "active" } }),
    prisma.client.count({ where: { ...base, status: "due" } }),
    prisma.client.count({ where: { ...base, status: "expired" } }),
    prisma.client.count({ where: { ...base, status: "suspended" } }),
    prisma.client.count({ where: { ...base, online: true } }),
    prisma.client.count({ where: { ...base, online: false } }),
    prisma.client.count({ where: { deletedAt: null, createdAt: { gte: monthStart }, ...(rid ? { resellerId: rid } : {}) } }),
    prisma.client.count({ where: { leftAt: { not: null }, deletedAt: null, ...(rid ? { resellerId: rid } : {}) } }),
    prisma.client.count({ where: { ...base, due: 0 } }),
    prisma.client.count({ where: { ...base, due: { gt: 0 } } }),
    prisma.client.count({ where: { ...base, expiry: { lt: dayStart } } }),
    prisma.client.count({ where: { ...base, status: "expired", online: true } }),
    rid ? Promise.resolve(0) : prisma.networkPop.count(),
    prisma.client.count({ where: { ...base, popId: { not: null } } }),
    prisma.ticket.count({ where: { status: "open" } }),
    prisma.ticket.count({ where: { status: "pending" } }),
    prisma.task.count({ where: { status: "pending" } }).catch(() => 0),
    prisma.task.count({ where: { status: "processing" } }).catch(() => 0),
    prisma.payment.aggregate({ where: { paidAt: { gte: monthStart }, ...payScope }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { paidAt: { gte: dayStart }, ...payScope }, _sum: { amount: true } }),
  ]);
  res.json({
    total, running, inactive: suspended, due, expired, suspended, online, blocked: offline,
    newClient, left, paid, unpaid, billExpire, unpaidExtension: graceOnline,
    totalPop, popClients,
    pendingTickets, processingTickets, pendingTasks, processingTasks,
    collectionThisMonth: collMonth._sum.amount || 0, collectionToday: collToday._sum.amount || 0,
  });
});

export default r;