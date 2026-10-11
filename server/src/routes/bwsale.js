import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { ymd } from "../dates.js";

const r = Router();
r.use(requireAuth);
const admin = requireRole("admin");
const clean = (v, max = 120) => (v == null ? null : String(v).trim().slice(0, max) || null);
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// ---------- Resellers (buyers) ----------
const buyerShape = (b) => ({ id: b.id, name: b.name, phone: b.phone || "", email: b.email || "", note: b.note || "" });
r.get("/resellers", async (_q, res) => res.json((await prisma.bwBuyer.findMany({ orderBy: { name: "asc" } })).map(buyerShape)));
r.post("/resellers", admin, async (req, res) => {
  const name = clean(req.body?.name, 100);
  if (!name) return res.status(400).json({ error: "Name din" });
  try { res.status(201).json(buyerShape(await prisma.bwBuyer.create({ data: { name, phone: clean(req.body?.phone, 20), email: clean(req.body?.email, 120), note: clean(req.body?.note, 200) } }))); }
  catch (e) { res.status(400).json({ error: e.code === "P2002" ? "Ei reseller ache" : "Create failed" }); }
});
r.put("/resellers/:id", admin, async (req, res) => {
  const data = {}; for (const k of ["name", "phone", "email", "note"]) if (req.body?.[k] != null) data[k] = clean(req.body[k], 200);
  try { res.json(buyerShape(await prisma.bwBuyer.update({ where: { id: Number(req.params.id) }, data }))); } catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/resellers/:id", admin, async (req, res) => {
  try { await prisma.bwBuyer.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); } catch { res.status(400).json({ error: "Delete failed" }); }
});

// ---------- Sales Invoices ----------
const invShape = (i) => ({ id: i.id, buyerId: i.buyerId, buyer: i.buyer?.name || "", amount: i.amount, period: i.period || "", status: i.status, note: i.note || "", date: ymd(i.date) });
r.get("/invoices", async (req, res) => {
  const where = {};
  if (req.query.status) where.status = String(req.query.status);
  const list = await prisma.bwSaleInvoice.findMany({ where, include: { buyer: true }, orderBy: { id: "desc" } });
  res.json(list.map(invShape));
});
r.post("/invoices", admin, async (req, res) => {
  const buyerId = Number(req.body?.buyerId); const amount = Math.round(Number(req.body?.amount) || 0);
  if (!buyerId) return res.status(400).json({ error: "Reseller select korun" });
  if (amount <= 0) return res.status(400).json({ error: "Amount din" });
  const i = await prisma.bwSaleInvoice.create({ data: { buyerId, amount, period: clean(req.body?.period, 40), status: req.body?.status === "paid" ? "paid" : "unpaid", note: clean(req.body?.note, 200) }, include: { buyer: true } });
  res.status(201).json(invShape(i));
});
r.post("/invoices/:id/pay", admin, async (req, res) => {
  try { res.json(invShape(await prisma.bwSaleInvoice.update({ where: { id: Number(req.params.id) }, data: { status: "paid" }, include: { buyer: true } }))); } catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/invoices/:id", admin, async (req, res) => {
  try { await prisma.bwSaleInvoice.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); } catch { res.status(400).json({ error: "Delete failed" }); }
});

// ---------- Bill Collection (payment against invoice) ----------
r.get("/payments", async (_q, res) => {
  const list = await prisma.bwSalePayment.findMany({ orderBy: { id: "desc" }, take: 1000 });
  // buyer name resolve
  const buyers = Object.fromEntries((await prisma.bwBuyer.findMany()).map((b) => [b.id, b.name]));
  res.json(list.map((p) => ({ id: p.id, buyerId: p.buyerId, buyer: buyers[p.buyerId] || "", amount: p.amount, method: p.method, invoiceId: p.invoiceId, date: ymd(p.date) })));
});
r.post("/payments", admin, async (req, res) => {
  const buyerId = Number(req.body?.buyerId); const amount = Math.round(Number(req.body?.amount) || 0);
  if (!buyerId) return res.status(400).json({ error: "Reseller din" });
  if (amount <= 0) return res.status(400).json({ error: "Amount din" });
  const invoiceId = req.body?.invoiceId ? Number(req.body.invoiceId) : null;
  const p = await prisma.$transaction(async (tx) => {
    const pay = await tx.bwSalePayment.create({ data: { buyerId, amount, method: clean(req.body?.method, 30) || "Cash", invoiceId } });
    if (invoiceId) await tx.bwSaleInvoice.update({ where: { id: invoiceId }, data: { status: "paid" } });
    return pay;
  });
  res.status(201).json({ ok: true, id: p.id });
});

// ---------- Recurring Invoices ----------
const recShape = (x) => ({ id: x.id, buyerId: x.buyerId, buyer: x.buyer?.name || "", amount: x.amount, active: x.active, note: x.note || "" });
r.get("/recurring", async (_q, res) => res.json((await prisma.bwRecurring.findMany({ include: { buyer: true }, orderBy: { id: "desc" } })).map(recShape)));
r.post("/recurring", admin, async (req, res) => {
  const buyerId = Number(req.body?.buyerId); const amount = Math.round(Number(req.body?.amount) || 0);
  if (!buyerId) return res.status(400).json({ error: "Reseller select korun" });
  if (amount <= 0) return res.status(400).json({ error: "Amount din" });
  const x = await prisma.bwRecurring.create({ data: { buyerId, amount, note: clean(req.body?.note, 200) }, include: { buyer: true } });
  res.status(201).json(recShape(x));
});
r.put("/recurring/:id", admin, async (req, res) => {
  const data = {};
  if (req.body?.amount != null) data.amount = Math.round(Number(req.body.amount) || 0);
  if (req.body?.active != null) data.active = !!req.body.active;
  if (req.body?.note != null) data.note = clean(req.body.note, 200);
  try { res.json(recShape(await prisma.bwRecurring.update({ where: { id: Number(req.params.id) }, data, include: { buyer: true } }))); } catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/recurring/:id", admin, async (req, res) => {
  try { await prisma.bwRecurring.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); } catch { res.status(400).json({ error: "Delete failed" }); }
});
// Generate this-month invoices from active recurrings
r.post("/recurring/generate", admin, async (req, res) => {
  const now = new Date();
  const period = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  const recs = await prisma.bwRecurring.findMany({ where: { active: true } });
  let created = 0;
  for (const rec of recs) {
    // ei period e already invoice thakle skip (double guard)
    const exists = await prisma.bwSaleInvoice.findFirst({ where: { buyerId: rec.buyerId, period } });
    if (exists) continue;
    await prisma.bwSaleInvoice.create({ data: { buyerId: rec.buyerId, amount: rec.amount, period, status: "unpaid", note: "Recurring" } });
    created++;
  }
  res.json({ ok: true, created, period });
});

export default r;
