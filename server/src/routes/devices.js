import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";

const r = Router();
r.use(requireAuth);

const shape = (d) => ({
  id: d.id, name: d.name, type: d.type, ip: d.ip || "",
  model: d.model || "", capacity: d.capacity, status: d.status,
});

// type diye filter kora jay (?type=mikrotik ba olt)
r.get("/", async (req, res) => {
  const where = {};
  if (req.query.type) where.type = String(req.query.type);
  const list = await prisma.netDevice.findMany({ where, orderBy: { id: "asc" } });
  res.json(list.map(shape));
});

r.post("/", requireRole("admin"), async (req, res) => {
  const { name, type, ip, model, capacity } = req.body || {};
  if (!name) return res.status(400).json({ error: "Device name din" });
  const t = type === "olt" ? "olt" : "mikrotik";
  try {
    const d = await prisma.netDevice.create({
      data: { name, type: t, ip: ip || null, model: model || null, capacity: Number(capacity) || 0 },
    });
    res.status(201).json(shape(d));
  } catch {
    res.status(400).json({ error: "Create failed" });
  }
});

r.put("/:id", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  const { name, ip, model, capacity, status } = req.body || {};
  const data = {};
  if (name != null) data.name = name;
  if (ip != null) data.ip = ip;
  if (model != null) data.model = model;
  if (capacity != null) data.capacity = Number(capacity);
  if (status != null && ["online", "offline"].includes(status)) data.status = status;
  try {
    const d = await prisma.netDevice.update({ where: { id }, data });
    res.json(shape(d));
  } catch {
    res.status(400).json({ error: "Update failed" });
  }
});

r.delete("/:id", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  try { await prisma.netDevice.delete({ where: { id } }); res.json({ ok: true }); }
  catch { res.status(400).json({ error: "Delete failed" }); }
});

export default r;
