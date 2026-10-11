import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { ymd } from "../dates.js";

const r = Router();
r.use(requireAuth);
const admin = requireRole("admin");
const clean = (v, max = 200) => (v == null ? null : String(v).trim().slice(0, max) || null);

// ---------- Task Categories ----------
r.get("/categories", async (_q, res) => res.json(await prisma.taskCategory.findMany({ orderBy: { name: "asc" } })));
r.post("/categories", admin, async (req, res) => {
  const name = clean(req.body?.name, 80);
  if (!name) return res.status(400).json({ error: "Category name din" });
  try { res.status(201).json(await prisma.taskCategory.create({ data: { name, note: clean(req.body?.note, 200) } })); }
  catch (e) { res.status(400).json({ error: e.code === "P2002" ? "Ei category ache" : "Create failed" }); }
});
r.put("/categories/:id", admin, async (req, res) => {
  const data = {}; if (req.body?.name != null) data.name = clean(req.body.name, 80); if (req.body?.note != null) data.note = clean(req.body.note, 200);
  try { res.json(await prisma.taskCategory.update({ where: { id: Number(req.params.id) }, data })); } catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/categories/:id", admin, async (req, res) => {
  try { await prisma.taskCategory.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); }
  catch (e) { res.status(400).json({ error: e.code === "P2003" ? "Category use e ache" : "Delete failed" }); }
});

// ---------- Tasks ----------
const shape = (t) => ({ id: t.id, title: t.title, priority: t.priority, status: t.status, assignee: t.assignee || "", dueDate: t.dueDate ? ymd(t.dueDate) : null, note: t.note || "", categoryId: t.categoryId, category: t.category?.name || "" });
r.get("/", async (req, res) => {
  const where = {};
  if (req.query.status) where.status = String(req.query.status);
  const list = await prisma.task.findMany({ where, include: { category: true }, orderBy: { id: "desc" } });
  res.json(list.map(shape));
});
r.post("/", admin, async (req, res) => {
  const title = clean(req.body?.title, 200);
  if (!title) return res.status(400).json({ error: "Task title din" });
  const data = {
    title, assignee: clean(req.body?.assignee, 100), note: clean(req.body?.note, 300),
    priority: ["high", "medium", "low"].includes(req.body?.priority) ? req.body.priority : "medium",
    status: ["pending", "processing", "done"].includes(req.body?.status) ? req.body.status : "pending",
    categoryId: req.body?.categoryId ? Number(req.body.categoryId) : null,
  };
  if (req.body?.dueDate) { const d = new Date(req.body.dueDate); if (!Number.isNaN(d.getTime())) data.dueDate = d; }
  const t = await prisma.task.create({ data, include: { category: true } });
  res.status(201).json(shape(t));
});
r.put("/:id", admin, async (req, res) => {
  const data = {};
  if (req.body?.title != null) data.title = clean(req.body.title, 200);
  if (req.body?.assignee != null) data.assignee = clean(req.body.assignee, 100);
  if (req.body?.note != null) data.note = clean(req.body.note, 300);
  if (req.body?.priority != null && ["high", "medium", "low"].includes(req.body.priority)) data.priority = req.body.priority;
  if (req.body?.status != null && ["pending", "processing", "done"].includes(req.body.status)) data.status = req.body.status;
  if (req.body?.categoryId !== undefined) data.categoryId = req.body.categoryId ? Number(req.body.categoryId) : null;
  if (req.body?.dueDate !== undefined) { const d = req.body.dueDate ? new Date(req.body.dueDate) : null; data.dueDate = d && !Number.isNaN(d.getTime()) ? d : null; }
  try { res.json(shape(await prisma.task.update({ where: { id: Number(req.params.id) }, data, include: { category: true } }))); } catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/:id", admin, async (req, res) => {
  try { await prisma.task.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); } catch { res.status(400).json({ error: "Delete failed" }); }
});

export default r;
