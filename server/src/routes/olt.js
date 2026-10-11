import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";

const r = Router();
r.use(requireAuth);

const clean = (v, max = 120) => (v == null ? null : String(v).trim().slice(0, max) || null);

// ---------- OLT devices (NetDevice type=olt) ----------
const devShape = (d) => ({ id: d.id, name: d.name, ip: d.ip || "", model: d.model || "", capacity: d.capacity, status: d.status });

r.get("/devices", async (_q, res) => {
  const list = await prisma.netDevice.findMany({ where: { type: "olt" }, orderBy: { id: "asc" } });
  res.json(list.map(devShape));
});
r.post("/devices", requireRole("admin"), async (req, res) => {
  const name = clean(req.body?.name, 80);
  if (!name) return res.status(400).json({ error: "OLT name din" });
  const d = await prisma.netDevice.create({
    data: { name, type: "olt", ip: clean(req.body?.ip, 100), model: clean(req.body?.model, 80), capacity: Number(req.body?.capacity) || 0, status: req.body?.status === "offline" ? "offline" : "online" },
  });
  res.status(201).json(devShape(d));
});
r.put("/devices/:id", requireRole("admin"), async (req, res) => {
  const data = {};
  if (req.body?.name != null) data.name = clean(req.body.name, 80);
  if (req.body?.ip != null) data.ip = clean(req.body.ip, 100);
  if (req.body?.model != null) data.model = clean(req.body.model, 80);
  if (req.body?.capacity != null) data.capacity = Number(req.body.capacity) || 0;
  if (req.body?.status != null) data.status = req.body.status === "offline" ? "offline" : "online";
  try { res.json(devShape(await prisma.netDevice.update({ where: { id: Number(req.params.id) }, data }))); }
  catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/devices/:id", requireRole("admin"), async (req, res) => {
  try { await prisma.netDevice.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); }
  catch { res.status(400).json({ error: "Delete failed" }); }
});

// ---------- OLT Users (ONU) ----------
const userShape = (u) => ({
  id: u.id, name: u.name, onu: u.onu || "", ponPort: u.ponPort || "", status: u.status,
  signal: u.signal || "", oltId: u.oltId, olt: u.olt?.name || "", clientId: u.clientId || null,
});

r.get("/users", async (req, res) => {
  const where = {};
  if (req.query.oltId) where.oltId = Number(req.query.oltId);
  const list = await prisma.oltUser.findMany({ where, include: { olt: true }, orderBy: { id: "desc" } });
  res.json(list.map(userShape));
});
r.post("/users", requireRole("admin"), async (req, res) => {
  const name = clean(req.body?.name, 120);
  const oltId = Number(req.body?.oltId);
  if (!name) return res.status(400).json({ error: "User name din" });
  if (!oltId) return res.status(400).json({ error: "OLT select korun" });
  const dev = await prisma.netDevice.findFirst({ where: { id: oltId, type: "olt" } });
  if (!dev) return res.status(400).json({ error: "Thik OLT device select korun" });
  const u = await prisma.oltUser.create({
    data: {
      name, oltId, onu: clean(req.body?.onu, 60), ponPort: clean(req.body?.ponPort, 30),
      signal: clean(req.body?.signal, 30), status: req.body?.status === "offline" ? "offline" : "online",
      clientId: req.body?.clientId ? Number(req.body.clientId) : null,
    },
    include: { olt: true },
  });
  res.status(201).json(userShape(u));
});
r.put("/users/:id", requireRole("admin"), async (req, res) => {
  const data = {};
  for (const k of ["name", "onu", "ponPort", "signal"]) if (req.body?.[k] != null) data[k] = clean(req.body[k], 120);
  if (req.body?.status != null) data.status = req.body.status === "offline" ? "offline" : "online";
  if (req.body?.oltId != null) data.oltId = Number(req.body.oltId);
  if (req.body?.clientId !== undefined) data.clientId = req.body.clientId ? Number(req.body.clientId) : null;
  try { res.json(userShape(await prisma.oltUser.update({ where: { id: Number(req.params.id) }, data, include: { olt: true } }))); }
  catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/users/:id", requireRole("admin"), async (req, res) => {
  try { await prisma.oltUser.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); }
  catch { res.status(400).json({ error: "Delete failed" }); }
});

export default r;
