import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { ymd } from "../dates.js";

const r = Router();
r.use(requireAuth);
const admin = requireRole("admin");
const clean = (v, max = 200) => (v == null ? null : String(v).trim().slice(0, max) || null);

const shape = (e) => ({ id: e.id, title: e.title, type: e.type, fromDate: ymd(e.fromDate), toDate: e.toDate ? ymd(e.toDate) : null, note: e.note || "" });

r.get("/", async (req, res) => {
  const where = {};
  if (req.query.year) {
    const y = Number(req.query.year);
    where.fromDate = { gte: new Date(`${y}-01-01`), lte: new Date(`${y}-12-31T23:59:59`) };
  }
  const list = await prisma.holidayEvent.findMany({ where, orderBy: { fromDate: "asc" } });
  res.json(list.map(shape));
});

r.post("/", admin, async (req, res) => {
  const title = clean(req.body?.title, 120);
  if (!title) return res.status(400).json({ error: "Title din" });
  const from = new Date(req.body?.fromDate);
  if (Number.isNaN(from.getTime())) return res.status(400).json({ error: "From date din" });
  let to = null;
  if (req.body?.toDate) { const t = new Date(req.body.toDate); if (!Number.isNaN(t.getTime())) to = t; }
  const e = await prisma.holidayEvent.create({ data: { title, type: req.body?.type === "event" ? "event" : "holiday", fromDate: from, toDate: to, note: clean(req.body?.note, 300) } });
  res.status(201).json(shape(e));
});

r.put("/:id", admin, async (req, res) => {
  const data = {};
  if (req.body?.title != null) data.title = clean(req.body.title, 120);
  if (req.body?.type != null) data.type = req.body.type === "event" ? "event" : "holiday";
  if (req.body?.fromDate) { const f = new Date(req.body.fromDate); if (!Number.isNaN(f.getTime())) data.fromDate = f; }
  if (req.body?.toDate !== undefined) { const t = req.body.toDate ? new Date(req.body.toDate) : null; data.toDate = t && !Number.isNaN(t.getTime()) ? t : null; }
  if (req.body?.note != null) data.note = clean(req.body.note, 300);
  try { res.json(shape(await prisma.holidayEvent.update({ where: { id: Number(req.params.id) }, data }))); }
  catch { res.status(400).json({ error: "Update failed" }); }
});

r.delete("/:id", admin, async (req, res) => {
  try { await prisma.holidayEvent.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); }
  catch { res.status(400).json({ error: "Delete failed" }); }
});

export default r;
