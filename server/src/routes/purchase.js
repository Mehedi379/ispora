import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { ymd } from "../dates.js";

const r = Router();
r.use(requireAuth);
const admin = requireRole("admin");
const clean = (v, max = 120) => (v == null ? null : String(v).trim().slice(0, max) || null);

// ---------- Vendors ----------
const vShape = (v) => ({ id: v.id, name: v.name, phone: v.phone || "", email: v.email || "", address: v.address || "", note: v.note || "" });
r.get("/vendors", async (_q, res) => res.json((await prisma.vendor.findMany({ orderBy: { name: "asc" } })).map(vShape)));
r.post("/vendors", admin, async (req, res) => {
  const name = clean(req.body?.name, 100);
  if (!name) return res.status(400).json({ error: "Vendor name din" });
  try { res.status(201).json(vShape(await prisma.vendor.create({ data: { name, phone: clean(req.body?.phone, 20), email: clean(req.body?.email, 120), address: clean(req.body?.address, 200), note: clean(req.body?.note, 200) } }))); }
  catch (e) { res.status(400).json({ error: e.code === "P2002" ? "Ei vendor ache" : "Create failed" }); }
});
r.put("/vendors/:id", admin, async (req, res) => {
  const data = {}; for (const k of ["name", "phone", "email", "address", "note"]) if (req.body?.[k] != null) data[k] = clean(req.body[k], 200);
  try { res.json(vShape(await prisma.vendor.update({ where: { id: Number(req.params.id) }, data }))); } catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/vendors/:id", admin, async (req, res) => {
  try { await prisma.vendor.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); } catch { res.status(400).json({ error: "Delete failed" }); }
});

// ---------- Requisitions ----------
const reqShape = (x) => ({ id: x.id, item: x.item, qty: x.qty, requestedBy: x.requestedBy || "", status: x.status, note: x.note || "", date: ymd(x.date) });
r.get("/requisitions", async (req, res) => {
  const where = {}; if (req.query.status) where.status = String(req.query.status);
  res.json((await prisma.requisition.findMany({ where, orderBy: { id: "desc" } })).map(reqShape));
});
r.post("/requisitions", admin, async (req, res) => {
  const item = clean(req.body?.item, 120);
  if (!item) return res.status(400).json({ error: "Item din" });
  res.status(201).json(reqShape(await prisma.requisition.create({ data: { item, qty: Number(req.body?.qty) || 1, requestedBy: clean(req.body?.requestedBy, 100), note: clean(req.body?.note, 200) } })));
});
r.post("/requisitions/:id/:action", admin, async (req, res) => {
  const action = req.params.action;
  if (!["approve", "reject"].includes(action)) return res.status(400).json({ error: "Invalid action" });
  try { res.json(reqShape(await prisma.requisition.update({ where: { id: Number(req.params.id) }, data: { status: action === "approve" ? "approved" : "rejected" } }))); } catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/requisitions/:id", admin, async (req, res) => {
  try { await prisma.requisition.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); } catch { res.status(400).json({ error: "Delete failed" }); }
});

// ---------- Purchases ----------
const pShape = (p) => ({ id: p.id, vendorId: p.vendorId, vendor: p.vendor?.name || "", item: p.item, qty: p.qty, unitPrice: p.unitPrice, total: p.total, note: p.note || "", date: ymd(p.date) });
r.get("/purchases", async (_q, res) => res.json((await prisma.purchase.findMany({ include: { vendor: true }, orderBy: { id: "desc" } })).map(pShape)));
r.post("/purchases", admin, async (req, res) => {
  const vendorId = Number(req.body?.vendorId); const item = clean(req.body?.item, 120);
  if (!vendorId) return res.status(400).json({ error: "Vendor select korun" });
  if (!item) return res.status(400).json({ error: "Item din" });
  const qty = Number(req.body?.qty) || 1; const unitPrice = Math.round(Number(req.body?.unitPrice) || 0);
  const p = await prisma.purchase.create({ data: { vendorId, item, qty, unitPrice, total: qty * unitPrice, note: clean(req.body?.note, 200) }, include: { vendor: true } });
  res.status(201).json(pShape(p));
});
r.delete("/purchases/:id", admin, async (req, res) => {
  try { await prisma.purchase.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); } catch { res.status(400).json({ error: "Delete failed" }); }
});

// ---------- Purchase Bills ----------
const bShape = (b) => ({ id: b.id, vendorId: b.vendorId, vendor: b.vendor?.name || "", amount: b.amount, status: b.status, note: b.note || "", date: ymd(b.date) });
r.get("/bills", async (req, res) => {
  const where = {}; if (req.query.status) where.status = String(req.query.status);
  res.json((await prisma.purchaseBill.findMany({ where, include: { vendor: true }, orderBy: { id: "desc" } })).map(bShape));
});
r.post("/bills", admin, async (req, res) => {
  const vendorId = Number(req.body?.vendorId); const amount = Math.round(Number(req.body?.amount) || 0);
  if (!vendorId) return res.status(400).json({ error: "Vendor select korun" });
  if (amount <= 0) return res.status(400).json({ error: "Amount din" });
  const b = await prisma.purchaseBill.create({ data: { vendorId, amount, status: req.body?.status === "paid" ? "paid" : "unpaid", note: clean(req.body?.note, 200) }, include: { vendor: true } });
  res.status(201).json(bShape(b));
});
r.post("/bills/:id/pay", admin, async (req, res) => {
  try { res.json(bShape(await prisma.purchaseBill.update({ where: { id: Number(req.params.id) }, data: { status: "paid" }, include: { vendor: true } }))); } catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/bills/:id", admin, async (req, res) => {
  try { await prisma.purchaseBill.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); } catch { res.status(400).json({ error: "Delete failed" }); }
});

export default r;
