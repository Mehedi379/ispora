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

// Dashboard "overview" — competitor-style financial tiles + charts (sob real DB, source na thakle 0)
r.get("/overview", async (req, res) => {
  const rid = req.user.role === "reseller" ? req.user.id : null;
  const base = { deletedAt: null, leftAt: null, ...(rid ? { resellerId: rid } : {}) };
  const payScope = rid ? { client: { resellerId: rid } } : {};
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const safe = (p, d = 0) => p.then((v) => v).catch(() => d);
  const sumAmt = (agg) => agg?._sum?.amount || 0;

  // Monthly Bill = active client der package price-er jog
  const [pkgGroups, pkgs] = await Promise.all([
    safe(prisma.client.groupBy({ by: ["packageId"], where: { ...base, status: "active" }, _count: { _all: true } }), []),
    safe(prisma.package.findMany({ select: { id: true, price: true } }), []),
  ]);
  const priceMap = Object.fromEntries(pkgs.map((p) => [p.id, p.price]));
  const monthlyBill = pkgGroups.reduce((s, g) => s + (priceMap[g.packageId] || 0) * g._count._all, 0);

  const [
    collMonth, dueAgg, incomeM, expenseM, salaryPaid,
    bwBill, bwDue, purchasePaid, purchaseDue, smsSetting, topUnpaid,
  ] = await Promise.all([
    safe(prisma.payment.aggregate({ where: { paidAt: { gte: monthStart }, ...payScope }, _sum: { amount: true } }), {}),
    safe(prisma.client.aggregate({ where: base, _sum: { due: true } }), {}),
    safe(prisma.transaction.aggregate({ where: { type: "income", date: { gte: monthStart } }, _sum: { amount: true } }), {}),
    safe(prisma.transaction.aggregate({ where: { type: "expense", date: { gte: monthStart } }, _sum: { amount: true } }), {}),
    safe(prisma.payslip.aggregate({ where: { status: "paid", month: now.getMonth() + 1, year: now.getFullYear() }, _sum: { net: true } }), {}),
    safe(prisma.bwPurchaseBill.aggregate({ where: { date: { gte: monthStart } }, _sum: { amount: true } }), {}),
    safe(prisma.bwPurchaseBill.aggregate({ where: { status: "unpaid" }, _sum: { amount: true } }), {}),
    safe(prisma.purchaseBill.aggregate({ where: { status: "paid", date: { gte: monthStart } }, _sum: { amount: true } }), {}),
    safe(prisma.purchaseBill.aggregate({ where: { status: "unpaid" }, _sum: { amount: true } }), {}),
    safe(prisma.setting.findFirst({ where: { key: "smsBalance" } }), null),
    safe(prisma.client.findMany({ where: { ...base, due: { gt: 0 } }, orderBy: { due: "desc" }, take: 20, select: { id: true, name: true, phone: true, due: true, package: { select: { price: true } } } }), []),
  ]);

  const collected = sumAmt(collMonth);
  const income = sumAmt(incomeM), expense = sumAmt(expenseM);
  const paidSalary = salaryPaid?._sum?.net || 0;

  // Monthly new client (last 12 months)
  const yearStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const newRows = await safe(prisma.client.findMany({ where: { deletedAt: null, createdAt: { gte: yearStart }, ...(rid ? { resellerId: rid } : {}) }, select: { createdAt: true } }), []);
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: d.toLocaleString("en-US", { month: "short" }), year: d.getFullYear(), month: d.getMonth(), count: 0 });
  }
  for (const c of newRows) {
    const d = new Date(c.createdAt);
    const b = months.find((m) => m.year === d.getFullYear() && m.month === d.getMonth());
    if (b) b.count++;
  }

  res.json({
    monthlyBill,
    collectedBill: collected,
    discount: 0,
    totalDue: dueAgg?._sum?.due || 0,
    serviceSalesInvoice: 0,
    productSalesInvoice: 0,
    income,
    expense,
    creditedAmount: 0,
    popFund: 0,
    popBill: 0,
    receivableAmount: dueAgg?._sum?.due || 0,
    bwProviderBill: sumAmt(bwBill),
    bwProviderDue: sumAmt(bwDue),
    bwPopBill: 0,
    paidSalary,
    smsBalance: smsSetting ? Number(smsSetting.value) || 0 : 0,
    purchasePayableDue: sumAmt(purchaseDue),
    purchasePaidAmount: sumAmt(purchasePaid),
    cashOnHand: collected + income - expense,
    monthlyNewClient: months.map((m) => ({ label: m.label, count: m.count })),
    topUnpaid: topUnpaid.map((c) => ({ id: c.id, name: c.name, phone: c.phone, bill: c.package?.price || 0, due: c.due })),
  });
});

export default r;