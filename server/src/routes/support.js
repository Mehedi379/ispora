import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";

const r = Router();
r.use(requireAuth);
const admin = requireRole("admin");
const clean = (v, max = 120) => (v == null ? null : String(v).trim().slice(0, max) || null);

// Support ticket categories
r.get("/categories", async (_q, res) => res.json(await prisma.supportCategory.findMany({ orderBy: { name: "asc" } })));
r.post("/categories", admin, async (req, res) => {
  const name = clean(req.body?.name, 80);
  if (!name) return res.status(400).json({ error: "Category name din" });
  try { res.status(201).json(await prisma.supportCategory.create({ data: { name, note: clean(req.body?.note, 200) } })); }
  catch (e) { res.status(400).json({ error: e.code === "P2002" ? "Ei category ache" : "Create failed" }); }
});
r.put("/categories/:id", admin, async (req, res) => {
  const data = {};
  if (req.body?.name != null) data.name = clean(req.body.name, 80);
  if (req.body?.note != null) data.note = clean(req.body.note, 200);
  try { res.json(await prisma.supportCategory.update({ where: { id: Number(req.params.id) }, data })); }
  catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/categories/:id", admin, async (req, res) => {
  try { await prisma.supportCategory.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); }
  catch (e) { res.status(400).json({ error: e.code === "P2003" ? "Category use e ache" : "Delete failed" }); }
});

export default r;
