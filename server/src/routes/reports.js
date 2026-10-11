import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../auth.js";
import { ymd } from "../dates.js";

const r = Router();
r.use(requireAuth);
const scope = (req) => (req.user.role === "reseller" ? { resellerId: req.user.id } : {});

// ---------- Customer Report ----------
r.get("/customer", async (req, res) => {
  const base = { deletedAt: null, leftAt: null, ...scope(req) };
  const [total, active, due, expired, suspended, online, dueAgg, clients] = await Promise.all([
    prisma.client.count({ where: base }),
    prisma.client.count({ where: { ...base, status: "active" } }),
    prisma.client.count({ where: { ...base, status: "due" } }),
    prisma.client.count({ where: { ...base, status: "expired" } }),
    prisma.client.count({ where: { ...base, status: "suspended" } }),
    prisma.client.count({ where: { ...base, online: true } }),
    prisma.client.aggregate({ where: base, _sum: { due: true } }),
    prisma.client.findMany({ where: base, include: { zone: true, package: true } }),
  ]);
  const byZone = {}, byPackage = {};
  for (const c of clients) {
    const z = c.zone?.name || "No Zone"; byZone[z] = (byZone[z] || 0) + 1;
    const p = c.package?.name || "No Package"; byPackage[p] = (byPackage[p] || 0) + 1;
  }
  res.json({
    total, active, due, expired, suspended, online, offline: total - online,
    totalDue: dueAgg._sum.due || 0,
    byZone: Object.entries(byZone).map(([name, count]) => ({ name, count })),
    byPackage: Object.entries(byPackage).map(([name, count]) => ({ name, count })),
  });
});

// ---------- Due Customers (for Due Customer SMS) ----------
r.get("/due-customers", async (req, res) => {
  const list = await prisma.client.findMany({
    where: { deletedAt: null, leftAt: null, due: { gt: 0 }, ...scope(req) },
    include: { zone: true, package: true }, orderBy: { due: "desc" },
  });
  res.json(list.map((c) => ({ id: c.id, name: c.name, phone: c.phone, due: c.due, zone: c.zone?.name || "", package: c.package?.name || "", expiry: c.expiry ? ymd(c.expiry) : null })));
});

// ---------- BTRC Monthly Report (regulatory) ----------
r.get("/btrc", async (req, res) => {
  const now = new Date();
  const month = Number(req.query.month) || now.getMonth() + 1;
  const year = Number(req.query.year) || now.getFullYear();
  const mStart = new Date(year, month - 1, 1);
  const mEnd = new Date(year, month, 1);
  const base = { deletedAt: null };
  const [totalSub, active, newThis, left, revAgg] = await Promise.all([
    prisma.client.count({ where: base }),
    prisma.client.count({ where: { ...base, status: "active", leftAt: null } }),
    prisma.client.count({ where: { ...base, createdAt: { gte: mStart, lt: mEnd } } }),
    prisma.client.count({ where: { leftAt: { gte: mStart, lt: mEnd } } }),
    prisma.payment.aggregate({ where: { paidAt: { gte: mStart, lt: mEnd } }, _sum: { amount: true } }),
  ]);
  res.json({ month, year, totalSubscribers: totalSub, activeSubscribers: active, newConnections: newThis, disconnections: left, revenue: revAgg._sum.amount || 0 });
});

// ---------- Financial Report ----------
r.get("/financial", async (req, res) => {
  const day = /^\d{4}-\d{2}-\d{2}$/;
  const pay = {};
  if (day.test(req.query.from) || day.test(req.query.to)) {
    pay.paidAt = {};
    if (day.test(req.query.from)) pay.paidAt.gte = new Date(`${req.query.from}T00:00:00`);
    if (day.test(req.query.to)) pay.paidAt.lte = new Date(`${req.query.to}T23:59:59.999`);
  }
  const [collAgg, collCount, txns] = await Promise.all([
    prisma.payment.aggregate({ where: pay, _sum: { amount: true } }),
    prisma.payment.count({ where: pay }),
    prisma.transaction.findMany(),
  ]);
  const income = txns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = txns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  res.json({ collection: collAgg._sum.amount || 0, collectionCount: collCount, income, expense, net: income - expense });
});

// ---------- Pay Processing Fee (PGW payments) ----------
r.get("/pgw-fees", async (_q, res) => {
  const list = await prisma.pgwPayment.findMany({ where: { status: "success" }, orderBy: { id: "desc" }, take: 1000 });
  // Assumed ~1.5% gateway processing fee (display only)
  res.json(list.map((p) => ({ id: p.id, gateway: p.gateway, amount: p.amount, fee: Math.round(p.amount * 0.015), date: ymd(p.date) })));
});

export default r;
