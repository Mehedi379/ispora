import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { ymd } from "../dates.js";
import { getTenantId } from "../tenantContext.js";

const r = Router();
r.use(requireAuth);
r.use(requireRole("admin")); // Accounting admin-only
const clean = (v, max = 120) => (v == null ? null : String(v).trim().slice(0, max) || null);
const TYPES = ["asset", "liability", "equity", "income", "expense"];

const DEFAULTS = [
  { code: "1000", name: "Cash", type: "asset" },
  { code: "1010", name: "Bank", type: "asset" },
  { code: "1100", name: "Accounts Receivable", type: "asset" },
  { code: "2000", name: "Accounts Payable", type: "liability" },
  { code: "3000", name: "Owner Capital", type: "equity" },
  { code: "4000", name: "Internet Service Income", type: "income" },
  { code: "4100", name: "VAS Income", type: "income" },
  { code: "5000", name: "Bandwidth Expense", type: "expense" },
  { code: "5100", name: "Salary Expense", type: "expense" },
  { code: "5200", name: "Office Rent", type: "expense" },
  { code: "5300", name: "Utility Expense", type: "expense" },
];

// date range filter helper -> journal lines with account + entry
const day = /^\d{4}-\d{2}-\d{2}$/;
async function linesInRange(from, to) {
  const where = {};
  if (day.test(from) || day.test(to)) {
    where.entry = { date: {} };
    if (day.test(from)) where.entry.date.gte = new Date(`${from}T00:00:00`);
    if (day.test(to)) where.entry.date.lte = new Date(`${to}T23:59:59.999`);
  }
  return prisma.journalLine.findMany({ where, include: { account: true, entry: true } });
}

// ---------- Chart of Accounts ----------
const accShape = (a) => ({ id: a.id, code: a.code, name: a.name, type: a.type, note: a.note || "" });
r.get("/accounts", async (_q, res) => res.json((await prisma.account.findMany({ orderBy: { code: "asc" } })).map(accShape)));
r.post("/accounts", async (req, res) => {
  const code = clean(req.body?.code, 20); const name = clean(req.body?.name, 80);
  if (!code || !name) return res.status(400).json({ error: "Code o name din" });
  const type = TYPES.includes(req.body?.type) ? req.body.type : "asset";
  try { res.status(201).json(accShape(await prisma.account.create({ data: { code, name, type, note: clean(req.body?.note, 200) } }))); }
  catch (e) { res.status(400).json({ error: e.code === "P2002" ? "Ei code ache" : "Create failed" }); }
});
r.put("/accounts/:id", async (req, res) => {
  const data = {};
  if (req.body?.code != null) data.code = clean(req.body.code, 20);
  if (req.body?.name != null) data.name = clean(req.body.name, 80);
  if (req.body?.type != null && TYPES.includes(req.body.type)) data.type = req.body.type;
  if (req.body?.note != null) data.note = clean(req.body.note, 200);
  try { res.json(accShape(await prisma.account.update({ where: { id: Number(req.params.id) }, data }))); }
  catch (e) { res.status(400).json({ error: e.code === "P2002" ? "Ei code ache" : "Update failed" }); }
});
r.delete("/accounts/:id", async (req, res) => {
  const used = await prisma.journalLine.count({ where: { accountId: Number(req.params.id) } });
  if (used > 0) return res.status(400).json({ error: "Ei account e entry ache — delete kora jabe na" });
  try { await prisma.account.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); }
  catch { res.status(400).json({ error: "Delete failed" }); }
});
r.post("/accounts/seed-defaults", async (_q, res) => {
  await prisma.account.createMany({ data: DEFAULTS, skipDuplicates: true });
  res.json({ ok: true, count: DEFAULTS.length });
});

// ---------- Journal ----------
const entryShape = (e) => ({
  id: e.id, date: ymd(e.date), memo: e.memo || "", reference: e.reference || "",
  lines: e.lines.map((l) => ({ id: l.id, accountId: l.accountId, account: l.account?.name || "", code: l.account?.code || "", debit: l.debit, credit: l.credit })),
  debit: e.lines.reduce((s, l) => s + l.debit, 0), credit: e.lines.reduce((s, l) => s + l.credit, 0),
});
r.get("/journal", async (_q, res) => {
  const list = await prisma.journalEntry.findMany({ include: { lines: { include: { account: true } } }, orderBy: { id: "desc" }, take: 500 });
  res.json(list.map(entryShape));
});
r.post("/journal", async (req, res) => {
  const rawLines = Array.isArray(req.body?.lines) ? req.body.lines : [];
  const lines = rawLines.map((l) => ({ accountId: Number(l.accountId), debit: Math.round(Number(l.debit) || 0), credit: Math.round(Number(l.credit) || 0) })).filter((l) => l.accountId && (l.debit > 0 || l.credit > 0));
  if (lines.length < 2) return res.status(400).json({ error: "Kompokkhe 2 ta line din" });
  const totDr = lines.reduce((s, l) => s + l.debit, 0), totCr = lines.reduce((s, l) => s + l.credit, 0);
  if (totDr !== totCr) return res.status(400).json({ error: `Debit (${totDr}) = Credit (${totCr}) hote hobe` });
  const date = day.test(req.body?.date) ? new Date(`${req.body.date}T00:00:00`) : new Date();
  // Nested line create-e extension auto tenantId dey na — tai nijei boshai
  const tid = getTenantId() ?? null;
  const e = await prisma.journalEntry.create({ data: { date, memo: clean(req.body?.memo, 200), reference: clean(req.body?.reference, 60), lines: { create: lines.map((l) => ({ ...l, tenantId: tid })) } }, include: { lines: { include: { account: true } } } });
  res.status(201).json(entryShape(e));
});
r.delete("/journal/:id", async (req, res) => {
  try { await prisma.journalEntry.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); } catch { res.status(400).json({ error: "Delete failed" }); }
});

// ---------- Income / Expense quick entry ----------
// income: Dr cash/bank, Cr income account | expense: Dr expense account, Cr cash/bank
async function quickEntry(req, res, kind) {
  const amount = Math.round(Number(req.body?.amount) || 0);
  const accountId = Number(req.body?.accountId); // income/expense head
  const cashId = Number(req.body?.cashAccountId); // cash/bank
  if (amount <= 0) return res.status(400).json({ error: "Amount din" });
  if (!accountId || !cashId) return res.status(400).json({ error: "Account select korun" });
  const date = day.test(req.body?.date) ? new Date(`${req.body.date}T00:00:00`) : new Date();
  const lines = kind === "income"
    ? [{ accountId: cashId, debit: amount, credit: 0 }, { accountId, debit: 0, credit: amount }]
    : [{ accountId, debit: amount, credit: 0 }, { accountId: cashId, debit: 0, credit: amount }];
  const tid = getTenantId() ?? null;
  const e = await prisma.journalEntry.create({ data: { date, memo: clean(req.body?.memo, 200), reference: kind, lines: { create: lines.map((l) => ({ ...l, tenantId: tid })) } }, include: { lines: { include: { account: true } } } });
  res.status(201).json(entryShape(e));
}
r.post("/income", (req, res) => quickEntry(req, res, "income"));
r.post("/expense", (req, res) => quickEntry(req, res, "expense"));

// list income/expense lines (account type based)
r.get("/ledger/:type", async (req, res) => {
  const type = req.params.type; // income | expense
  if (!["income", "expense"].includes(type)) return res.status(400).json({ error: "Invalid" });
  const lines = await prisma.journalLine.findMany({ where: { account: { type } }, include: { account: true, entry: true }, orderBy: { id: "desc" }, take: 500 });
  res.json(lines.map((l) => ({ id: l.id, account: l.account.name, amount: type === "income" ? l.credit : l.debit, date: ymd(l.entry.date), memo: l.entry.memo || "" })).filter((x) => x.amount > 0));
});

// ---------- Reports ----------
r.get("/trial-balance", async (req, res) => {
  const lines = await linesInRange(req.query.from, req.query.to);
  const accs = await prisma.account.findMany({ orderBy: { code: "asc" } });
  const map = {}; for (const a of accs) map[a.id] = { code: a.code, name: a.name, type: a.type, debit: 0, credit: 0 };
  for (const l of lines) { if (!map[l.accountId]) continue; map[l.accountId].debit += l.debit; map[l.accountId].credit += l.credit; }
  const rows = Object.values(map).filter((x) => x.debit || x.credit);
  res.json({ rows, totalDebit: rows.reduce((s, x) => s + x.debit, 0), totalCredit: rows.reduce((s, x) => s + x.credit, 0) });
});

r.get("/profit-loss", async (req, res) => {
  const lines = await linesInRange(req.query.from, req.query.to);
  const income = {}, expense = {};
  for (const l of lines) {
    if (l.account.type === "income") income[l.account.name] = (income[l.account.name] || 0) + (l.credit - l.debit);
    if (l.account.type === "expense") expense[l.account.name] = (expense[l.account.name] || 0) + (l.debit - l.credit);
  }
  const incomeRows = Object.entries(income).map(([name, amount]) => ({ name, amount }));
  const expenseRows = Object.entries(expense).map(([name, amount]) => ({ name, amount }));
  const totalIncome = incomeRows.reduce((s, x) => s + x.amount, 0);
  const totalExpense = expenseRows.reduce((s, x) => s + x.amount, 0);
  res.json({ incomeRows, expenseRows, totalIncome, totalExpense, net: totalIncome - totalExpense });
});

r.get("/balance-sheet", async (_q, res) => {
  const lines = await linesInRange();
  const bal = {}; // accountId -> {name,type,amount(normal)}
  const accs = await prisma.account.findMany();
  for (const a of accs) bal[a.id] = { name: a.name, type: a.type, net: 0 };
  for (const l of lines) { if (bal[l.accountId]) bal[l.accountId].net += l.debit - l.credit; }
  const group = (type, sign) => Object.values(bal).filter((b) => b.type === type && (b.net * sign) !== 0).map((b) => ({ name: b.name, amount: b.net * sign }));
  // income - expense = net profit -> equity
  const incomeExpenseNet = Object.values(bal).reduce((s, b) => s + (b.type === "income" ? -b.net : b.type === "expense" ? -b.net : 0), 0);
  const assets = group("asset", 1);
  const liabilities = group("liability", -1);
  const equity = group("equity", -1);
  const totalAssets = assets.reduce((s, x) => s + x.amount, 0);
  const totalLiab = liabilities.reduce((s, x) => s + x.amount, 0);
  const totalEquity = equity.reduce((s, x) => s + x.amount, 0) + incomeExpenseNet;
  res.json({ assets, liabilities, equity: [...equity, { name: "Retained Earnings (P/L)", amount: incomeExpenseNet }], totalAssets, totalLiabilities: totalLiab, totalEquity });
});

r.get("/cash-book", async (req, res) => {
  const lines = await linesInRange(req.query.from, req.query.to);
  const cash = lines.filter((l) => l.account.type === "asset" && /cash|bank/i.test(l.account.name));
  cash.sort((a, b) => new Date(a.entry.date) - new Date(b.entry.date) || a.id - b.id);
  let running = 0;
  const rows = cash.map((l) => { running += l.debit - l.credit; return { id: l.id, date: ymd(l.entry.date), account: l.account.name, memo: l.entry.memo || "", debit: l.debit, credit: l.credit, balance: running }; });
  res.json({ rows, balance: running });
});

r.get("/dashboard", async (_q, res) => {
  const lines = await linesInRange();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  let cash = 0, bank = 0, receivable = 0, income = 0, expense = 0, incomeM = 0, expenseM = 0;
  for (const l of lines) {
    const t = l.account.type, net = l.debit - l.credit;
    if (t === "asset" && /^cash$/i.test(l.account.name)) cash += net;
    if (t === "asset" && /bank/i.test(l.account.name)) bank += net;
    if (t === "asset" && /receivable/i.test(l.account.name)) receivable += net;
    if (t === "income") { income += -net; if (new Date(l.entry.date) >= monthStart) incomeM += -net; }
    if (t === "expense") { expense += net; if (new Date(l.entry.date) >= monthStart) expenseM += net; }
  }
  res.json({ cash, bank, receivable, income, expense, net: income - expense, incomeThisMonth: incomeM, expenseThisMonth: expenseM });
});

export default r;

