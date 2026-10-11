import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { ymd } from "../dates.js";

const r = Router();
r.use(requireAuth);
const admin = requireRole("admin");
const clean = (v, max = 120) => (v == null ? null : String(v).trim().slice(0, max) || null);

const shape = (a) => ({ id: a.id, name: a.name, category: a.category || "", qty: a.qty, value: a.value, status: a.status, purchaseDate: a.purchaseDate ? ymd(a.purchaseDate) : null, note: a.note || "" });

r.get("/", async (req, res) => {
  const where = {};
  if (req.query.status) where.status = String(req.query.status);
  res.json((await prisma.asset.findMany({ where, orderBy: { id: "desc" } })).map(shape));
});
r.post("/", admin, async (req, res) => {
  const name = clean(req.body?.name, 120);
  if (!name) return res.status(400).json({ error: "Asset name din" });
  const data = { name, category: clean(req.body?.category, 80), qty: Number(req.body?.qty) || 1, value: Math.round(Number(req.body?.value) || 0), note: clean(req.body?.note, 200) };
  if (req.body?.purchaseDate) { const d = new Date(req.body.purchaseDate); if (!Number.isNaN(d.getTime())) data.purchaseDate = d; }
  res.status(201).json(shape(await prisma.asset.create({ data })));
});
r.put("/:id", admin, async (req, res) => {
  const data = {};
  if (req.body?.name != null) data.name = clean(req.body.name, 120);
  if (req.body?.category != null) data.category = clean(req.body.category, 80);
  if (req.body?.qty != null) data.qty = Number(req.body.qty) || 1;
  if (req.body?.value != null) data.value = Math.round(Number(req.body.value) || 0);
  if (req.body?.note != null) data.note = clean(req.body.note, 200);
  if (req.body?.purchaseDate !== undefined) { const d = req.body.purchaseDate ? new Date(req.body.purchaseDate) : null; data.purchaseDate = d && !Number.isNaN(d.getTime()) ? d : null; }
  try { res.json(shape(await prisma.asset.update({ where: { id: Number(req.params.id) }, data }))); } catch { res.status(400).json({ error: "Update failed" }); }
});
r.post("/:id/destroy", admin, async (req, res) => {
  try { res.json(shape(await prisma.asset.update({ where: { id: Number(req.params.id) }, data: { status: "destroyed" } }))); } catch { res.status(400).json({ error: "Update failed" }); }
});
r.post("/:id/restore", admin, async (req, res) => {
  try { res.json(shape(await prisma.asset.update({ where: { id: Number(req.params.id) }, data: { status: "active" } }))); } catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/:id", admin, async (req, res) => {
  try { await prisma.asset.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); } catch { res.status(400).json({ error: "Delete failed" }); }
});

export default r;
