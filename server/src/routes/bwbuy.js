import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { ymd } from "../dates.js";

const r = Router();
r.use(requireAuth);
const admin = requireRole("admin");
const clean = (v, max = 120) => (v == null ? null : String(v).trim().slice(0, max) || null);

// ---------- Item Categories ----------
r.get("/categories", async (_q, res) => res.json(await prisma.bwItemCategory.findMany({ orderBy: { name: "asc" } })));
r.post("/categories", admin, async (req, res) => {
  const name = clean(req.body?.name, 80);
  if (!name) return res.status(400).json({ error: "Category name din" });
  try { res.status(201).json(await prisma.bwItemCategory.create({ data: { name, note: clean(req.body?.note, 200) } })); }
  catch (e) { res.status(400).json({ error: e.code === "P2002" ? "Ei category ache" : "Create failed" }); }
});
r.put("/categories/:id", admin, async (req, res) => {
  const data = {}; if (req.body?.name != null) data.name = clean(req.body.name, 80); if (req.body?.note != null) data.note = clean(req.body.note, 200);
  try { res.json(await prisma.bwItemCategory.update({ where: { id: Number(req.params.id) }, data })); } catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/categories/:id", admin, async (req, res) => {
  try { await prisma.bwItemCategory.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); }
  catch (e) { res.status(400).json({ error: e.code === "P2003" ? "Category use e ache" : "Delete failed" }); }
});

// ---------- Items ----------
const itemShape = (i) => ({ id: i.id, name: i.name, unit: i.unit || "", note: i.note || "", categoryId: i.categoryId, category: i.category?.name || "" });
r.get("/items", async (_q, res) => res.json((await prisma.bwItem.findMany({ include: { category: true }, orderBy: { name: "asc" } })).map(itemShape)));
r.post("/items", admin, async (req, res) => {
  const name = clean(req.body?.name, 80);
  if (!name) return res.status(400).json({ error: "Item name din" });
  try { const i = await prisma.bwItem.create({ data: { name, unit: clean(req.body?.unit, 40), note: clean(req.body?.note, 200), categoryId: req.body?.categoryId ? Number(req.body.categoryId) : null }, include: { category: true } }); res.status(201).json(itemShape(i)); }
  catch (e) { res.status(400).json({ error: e.code === "P2002" ? "Ei item ache" : "Create failed" }); }
});
r.put("/items/:id", admin, async (req, res) => {
  const data = {};
  if (req.body?.name != null) data.name = clean(req.body.name, 80);
  if (req.body?.unit != null) data.unit = clean(req.body.unit, 40);
  if (req.body?.note != null) data.note = clean(req.body.note, 200);
  if (req.body?.categoryId !== undefined) data.categoryId = req.body.categoryId ? Number(req.body.categoryId) : null;
  try { res.json(itemShape(await prisma.bwItem.update({ where: { id: Number(req.params.id) }, data, include: { category: true } }))); } catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/items/:id", admin, async (req, res) => {
  try { await prisma.bwItem.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); } catch { res.status(400).json({ error: "Delete failed" }); }
});

// ---------- Providers ----------
const provShape = (p) => ({ id: p.id, name: p.name, phone: p.phone || "", email: p.email || "", address: p.address || "", note: p.note || "" });
r.get("/providers", async (_q, res) => res.json((await prisma.bwProvider.findMany({ orderBy: { name: "asc" } })).map(provShape)));
r.post("/providers", admin, async (req, res) => {
  const name = clean(req.body?.name, 100);
  if (!name) return res.status(400).json({ error: "Provider name din" });
  try { res.status(201).json(provShape(await prisma.bwProvider.create({ data: { name, phone: clean(req.body?.phone, 20), email: clean(req.body?.email, 120), address: clean(req.body?.address, 200), note: clean(req.body?.note, 200) } }))); }
  catch (e) { res.status(400).json({ error: e.code === "P2002" ? "Ei provider ache" : "Create failed" }); }
});
r.put("/providers/:id", admin, async (req, res) => {
  const data = {}; for (const k of ["name", "phone", "email", "address", "note"]) if (req.body?.[k] != null) data[k] = clean(req.body[k], 200);
  try { res.json(provShape(await prisma.bwProvider.update({ where: { id: Number(req.params.id) }, data }))); } catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/providers/:id", admin, async (req, res) => {
  try { await prisma.bwProvider.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); } catch { res.status(400).json({ error: "Delete failed" }); }
});

// ---------- Purchase Bills ----------
const billShape = (b) => ({ id: b.id, providerId: b.providerId, provider: b.provider?.name || "", itemId: b.itemId, item: b.item?.name || "", amount: b.amount, bandwidth: b.bandwidth || "", status: b.status, note: b.note || "", date: ymd(b.date) });
r.get("/bills", async (req, res) => {
  const where = {};
  if (req.query.status) where.status = String(req.query.status);
  const list = await prisma.bwPurchaseBill.findMany({ where, include: { provider: true, item: true }, orderBy: { id: "desc" } });
  res.json(list.map(billShape));
});
r.post("/bills", admin, async (req, res) => {
  const providerId = Number(req.body?.providerId);
  const amount = Math.round(Number(req.body?.amount) || 0);
  if (!providerId) return res.status(400).json({ error: "Provider select korun" });
  if (amount <= 0) return res.status(400).json({ error: "Amount din" });
  const b = await prisma.bwPurchaseBill.create({ data: { providerId, itemId: req.body?.itemId ? Number(req.body.itemId) : null, amount, bandwidth: clean(req.body?.bandwidth, 40), status: req.body?.status === "paid" ? "paid" : "unpaid", note: clean(req.body?.note, 200) }, include: { provider: true, item: true } });
  res.status(201).json(billShape(b));
});
r.post("/bills/:id/pay", admin, async (req, res) => {
  try { res.json(billShape(await prisma.bwPurchaseBill.update({ where: { id: Number(req.params.id) }, data: { status: "paid" }, include: { provider: true, item: true } }))); } catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/bills/:id", admin, async (req, res) => {
  try { await prisma.bwPurchaseBill.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); } catch { res.status(400).json({ error: "Delete failed" }); }
});

export default r;
