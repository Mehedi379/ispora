import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";

const r = Router();
r.use(requireAuth);

const clean = (v, max = 120) => (v == null ? null : String(v).trim().slice(0, max) || null);
const num = (v) => (v === "" || v == null || Number.isNaN(Number(v)) ? null : Number(v));
const admin = requireRole("admin");

// ---------- POPs ----------
const popShape = (p) => ({
  id: p.id, name: p.name, type: p.type, lat: p.lat, lng: p.lng, address: p.address || "",
  capacity: p.capacity, status: p.status,
  clients: p._count?.clients ?? undefined, items: p._count?.items ?? undefined,
});
r.get("/pops", async (_q, res) => {
  const list = await prisma.networkPop.findMany({ orderBy: { id: "asc" }, include: { _count: { select: { clients: true, items: true } } } });
  res.json(list.map(popShape));
});
r.post("/pops", admin, async (req, res) => {
  const name = clean(req.body?.name, 80);
  if (!name) return res.status(400).json({ error: "POP name din" });
  const type = ["datacenter", "pop", "tower", "switch"].includes(req.body?.type) ? req.body.type : "pop";
  const p = await prisma.networkPop.create({ data: { name, type, lat: num(req.body?.lat), lng: num(req.body?.lng), address: clean(req.body?.address, 200), capacity: Number(req.body?.capacity) || 0, status: req.body?.status === "offline" ? "offline" : "online" } });
  res.status(201).json(popShape(p));
});
r.put("/pops/:id", admin, async (req, res) => {
  const data = {};
  if (req.body?.name != null) data.name = clean(req.body.name, 80);
  if (req.body?.type != null) data.type = ["datacenter", "pop", "tower", "switch"].includes(req.body.type) ? req.body.type : "pop";
  if (req.body?.lat !== undefined) data.lat = num(req.body.lat);
  if (req.body?.lng !== undefined) data.lng = num(req.body.lng);
  if (req.body?.address != null) data.address = clean(req.body.address, 200);
  if (req.body?.capacity != null) data.capacity = Number(req.body.capacity) || 0;
  if (req.body?.status != null) data.status = req.body.status === "offline" ? "offline" : "online";
  try { res.json(popShape(await prisma.networkPop.update({ where: { id: Number(req.params.id) }, data }))); }
  catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/pops/:id", admin, async (req, res) => {
  try { await prisma.networkPop.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); }
  catch { res.status(400).json({ error: "Delete failed" }); }
});

// ---------- Connections ----------
const connShape = (c) => ({ id: c.id, type: c.type, bandwidth: c.bandwidth || "", note: c.note || "", fromId: c.fromId, from: c.from?.name || "", toId: c.toId, to: c.to?.name || "" });
r.get("/connections", async (_q, res) => {
  const list = await prisma.networkConnection.findMany({ include: { from: true, to: true }, orderBy: { id: "desc" } });
  res.json(list.map(connShape));
});
r.post("/connections", admin, async (req, res) => {
  const fromId = Number(req.body?.fromId), toId = Number(req.body?.toId);
  if (!fromId || !toId) return res.status(400).json({ error: "From o To POP din" });
  if (fromId === toId) return res.status(400).json({ error: "Ek-i POP e connect kora jabe na" });
  const c = await prisma.networkConnection.create({ data: { fromId, toId, type: clean(req.body?.type, 20) || "fiber", bandwidth: clean(req.body?.bandwidth, 40), note: clean(req.body?.note, 200) }, include: { from: true, to: true } });
  res.status(201).json(connShape(c));
});
r.put("/connections/:id", admin, async (req, res) => {
  const data = {};
  for (const k of ["type", "bandwidth", "note"]) if (req.body?.[k] != null) data[k] = clean(req.body[k], 200);
  if (req.body?.fromId != null) data.fromId = Number(req.body.fromId);
  if (req.body?.toId != null) data.toId = Number(req.body.toId);
  try { res.json(connShape(await prisma.networkConnection.update({ where: { id: Number(req.params.id) }, data, include: { from: true, to: true } }))); }
  catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/connections/:id", admin, async (req, res) => {
  try { await prisma.networkConnection.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); }
  catch { res.status(400).json({ error: "Delete failed" }); }
});

// ---------- Distributed Inventory Items ----------
const itemShape = (i) => ({ id: i.id, name: i.name, qty: i.qty, note: i.note || "", popId: i.popId, pop: i.pop?.name || "" });
r.get("/items", async (req, res) => {
  const where = req.query.popId ? { popId: Number(req.query.popId) } : {};
  const list = await prisma.popItem.findMany({ where, include: { pop: true }, orderBy: { id: "desc" } });
  res.json(list.map(itemShape));
});
r.post("/items", admin, async (req, res) => {
  const name = clean(req.body?.name, 80); const popId = Number(req.body?.popId);
  if (!name) return res.status(400).json({ error: "Item name din" });
  if (!popId) return res.status(400).json({ error: "POP select korun" });
  const i = await prisma.popItem.create({ data: { name, popId, qty: Number(req.body?.qty) || 1, note: clean(req.body?.note, 200) }, include: { pop: true } });
  res.status(201).json(itemShape(i));
});
r.put("/items/:id", admin, async (req, res) => {
  const data = {};
  if (req.body?.name != null) data.name = clean(req.body.name, 80);
  if (req.body?.qty != null) data.qty = Number(req.body.qty) || 1;
  if (req.body?.note != null) data.note = clean(req.body.note, 200);
  if (req.body?.popId != null) data.popId = Number(req.body.popId);
  try { res.json(itemShape(await prisma.popItem.update({ where: { id: Number(req.params.id) }, data, include: { pop: true } }))); }
  catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/items/:id", admin, async (req, res) => {
  try { await prisma.popItem.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); }
  catch { res.status(400).json({ error: "Delete failed" }); }
});

// ---------- Diagram data (nodes + edges) ----------
r.get("/diagram", async (_q, res) => {
  const [pops, connections] = await Promise.all([
    prisma.networkPop.findMany({ include: { _count: { select: { clients: true } } }, orderBy: { id: "asc" } }),
    prisma.networkConnection.findMany(),
  ]);
  res.json({
    pops: pops.map((p) => ({ id: p.id, name: p.name, type: p.type, status: p.status, lat: p.lat, lng: p.lng, clients: p._count.clients })),
    connections: connections.map((c) => ({ id: c.id, fromId: c.fromId, toId: c.toId, type: c.type })),
  });
});

// ---------- Clients in Diagram ----------
r.get("/clients-in-diagram", async (_q, res) => {
  const pops = await prisma.networkPop.findMany({
    orderBy: { id: "asc" },
    include: { clients: { where: { deletedAt: null, leftAt: null }, select: { id: true, name: true, pppoe: true, status: true } } },
  });
  const unassigned = await prisma.client.count({ where: { deletedAt: null, leftAt: null, popId: null } });
  res.json({ pops: pops.map((p) => ({ id: p.id, name: p.name, type: p.type, clients: p.clients })), unassigned });
});
r.post("/assign-client", admin, async (req, res) => {
  const clientId = Number(req.body?.clientId);
  if (!clientId) return res.status(400).json({ error: "Client din" });
  const popId = req.body?.popId ? Number(req.body.popId) : null;
  try { await prisma.client.update({ where: { id: clientId }, data: { popId } }); res.json({ ok: true }); }
  catch { res.status(400).json({ error: "Assign failed" }); }
});

export default r;
