import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { ymd } from "../dates.js";

const r = Router();
r.use(requireAuth);
const admin = requireRole("admin");
const clean = (v, max = 120) => (v == null ? null : String(v).trim().slice(0, max) || null);

// ---------- Units ----------
r.get("/units", async (_q, res) => res.json(await prisma.invUnit.findMany({ orderBy: { name: "asc" } })));
r.post("/units", admin, async (req, res) => {
  const name = clean(req.body?.name, 40);
  if (!name) return res.status(400).json({ error: "Unit name din" });
  try { res.status(201).json(await prisma.invUnit.create({ data: { name } })); } catch (e) { res.status(400).json({ error: e.code === "P2002" ? "Ache" : "Create failed" }); }
});
r.put("/units/:id", admin, async (req, res) => { try { res.json(await prisma.invUnit.update({ where: { id: Number(req.params.id) }, data: { name: clean(req.body?.name, 40) } })); } catch { res.status(400).json({ error: "Update failed" }); } });
r.delete("/units/:id", admin, async (req, res) => { try { await prisma.invUnit.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); } catch (e) { res.status(400).json({ error: e.code === "P2003" ? "Use e ache" : "Delete failed" }); } });

// ---------- Store Locations ----------
r.get("/locations", async (_q, res) => res.json(await prisma.storeLocation.findMany({ orderBy: { name: "asc" } })));
r.post("/locations", admin, async (req, res) => {
  const name = clean(req.body?.name, 80);
  if (!name) return res.status(400).json({ error: "Location name din" });
  try { res.status(201).json(await prisma.storeLocation.create({ data: { name, note: clean(req.body?.note, 200) } })); } catch (e) { res.status(400).json({ error: e.code === "P2002" ? "Ache" : "Create failed" }); }
});
r.put("/locations/:id", admin, async (req, res) => { const data = {}; if (req.body?.name != null) data.name = clean(req.body.name, 80); if (req.body?.note != null) data.note = clean(req.body.note, 200); try { res.json(await prisma.storeLocation.update({ where: { id: Number(req.params.id) }, data })); } catch { res.status(400).json({ error: "Update failed" }); } });
r.delete("/locations/:id", admin, async (req, res) => { try { await prisma.storeLocation.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); } catch (e) { res.status(400).json({ error: e.code === "P2003" ? "Use e ache" : "Delete failed" }); } });

// ---------- Categories ----------
r.get("/categories", async (_q, res) => res.json(await prisma.invCategory.findMany({ orderBy: { name: "asc" } })));
r.post("/categories", admin, async (req, res) => {
  const name = clean(req.body?.name, 80);
  if (!name) return res.status(400).json({ error: "Category name din" });
  try { res.status(201).json(await prisma.invCategory.create({ data: { name, note: clean(req.body?.note, 200) } })); } catch (e) { res.status(400).json({ error: e.code === "P2002" ? "Ache" : "Create failed" }); }
});
r.put("/categories/:id", admin, async (req, res) => { const data = {}; if (req.body?.name != null) data.name = clean(req.body.name, 80); if (req.body?.note != null) data.note = clean(req.body.note, 200); try { res.json(await prisma.invCategory.update({ where: { id: Number(req.params.id) }, data })); } catch { res.status(400).json({ error: "Update failed" }); } });
r.delete("/categories/:id", admin, async (req, res) => { try { await prisma.invCategory.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); } catch (e) { res.status(400).json({ error: e.code === "P2003" ? "Use e ache" : "Delete failed" }); } });

// ---------- Items ----------
const itemShape = (i) => ({ id: i.id, name: i.name, note: i.note || "", categoryId: i.categoryId, category: i.category?.name || "", unitId: i.unitId, unit: i.unit?.name || "" });
r.get("/items", async (_q, res) => res.json((await prisma.invItem.findMany({ include: { category: true, unit: true }, orderBy: { name: "asc" } })).map(itemShape)));
r.post("/items", admin, async (req, res) => {
  const name = clean(req.body?.name, 80);
  if (!name) return res.status(400).json({ error: "Item name din" });
  try { const i = await prisma.invItem.create({ data: { name, note: clean(req.body?.note, 200), categoryId: req.body?.categoryId ? Number(req.body.categoryId) : null, unitId: req.body?.unitId ? Number(req.body.unitId) : null }, include: { category: true, unit: true } }); res.status(201).json(itemShape(i)); }
  catch (e) { res.status(400).json({ error: e.code === "P2002" ? "Ei item ache" : "Create failed" }); }
});
r.put("/items/:id", admin, async (req, res) => {
  const data = {};
  if (req.body?.name != null) data.name = clean(req.body.name, 80);
  if (req.body?.note != null) data.note = clean(req.body.note, 200);
  if (req.body?.categoryId !== undefined) data.categoryId = req.body.categoryId ? Number(req.body.categoryId) : null;
  if (req.body?.unitId !== undefined) data.unitId = req.body.unitId ? Number(req.body.unitId) : null;
  try { res.json(itemShape(await prisma.invItem.update({ where: { id: Number(req.params.id) }, data, include: { category: true, unit: true } }))); } catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/items/:id", admin, async (req, res) => { try { await prisma.invItem.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); } catch { res.status(400).json({ error: "Delete failed" }); } });

// ---------- Stock ----------
r.get("/stock", async (_q, res) => {
  const list = await prisma.invStock.findMany({ include: { item: true, location: true }, orderBy: { id: "desc" }, take: 1000 });
  res.json(list.map((s) => ({ id: s.id, itemId: s.itemId, item: s.item?.name || "", location: s.location?.name || "", qty: s.qty, type: s.type, note: s.note || "", date: ymd(s.date) })));
});
// Net stock level per item (in - out)
r.get("/stock/levels", async (_q, res) => {
  const items = await prisma.invItem.findMany({ include: { unit: true, stocks: true } });
  res.json(items.map((i) => {
    const level = i.stocks.reduce((n, s) => n + (s.type === "out" ? -s.qty : s.qty), 0);
    return { id: i.id, name: i.name, unit: i.unit?.name || "", level };
  }));
});
r.post("/stock", admin, async (req, res) => {
  const itemId = Number(req.body?.itemId); const qty = Math.round(Number(req.body?.qty) || 0);
  if (!itemId) return res.status(400).json({ error: "Item select korun" });
  if (qty <= 0) return res.status(400).json({ error: "Qty din" });
  const type = req.body?.type === "out" ? "out" : "in";
  const s = await prisma.invStock.create({ data: { itemId, qty, type, locationId: req.body?.locationId ? Number(req.body.locationId) : null, note: clean(req.body?.note, 200) }, include: { item: true, location: true } });
  res.status(201).json({ id: s.id, item: s.item?.name, location: s.location?.name || "", qty: s.qty, type: s.type });
});
r.delete("/stock/:id", admin, async (req, res) => { try { await prisma.invStock.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); } catch { res.status(400).json({ error: "Delete failed" }); } });

export default r;
