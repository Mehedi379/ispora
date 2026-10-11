import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { hashPassword } from "../auth.js";

const r = Router();
r.use(requireAuth);

const scope = (req) => (req.user.role === "reseller" ? { resellerId: req.user.id } : {});

const shape = (c) => ({
  id: c.id,
  name: c.name,
  phone: c.phone,
  pppoe: c.pppoe,
  zone: c.zone?.name || "",
  portalEnabled: c.portalEnabled,
  portalUser: c.portalUser || "",
  hasPassword: !!c.portalPassword,
});

// Portal Manage list — client der portal access obostha
r.get("/", async (req, res) => {
  const clients = await prisma.client.findMany({
    where: { deletedAt: null, leftAt: null, ...scope(req) },
    include: { zone: true }, orderBy: { id: "desc" },
  });
  res.json(clients.map(shape));
});

// Enable portal — user na dile pppoe default, password set
r.post("/:id/enable", requireRole("admin", "reseller"), async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.client.findFirst({ where: { id, ...scope(req) } });
  if (!existing) return res.status(404).json({ error: "Client nei" });
  const user = (req.body?.portalUser || existing.pppoe || `cust${id}`).trim();
  const data = { portalEnabled: true, portalUser: user };
  if (req.body?.password) {
    if (String(req.body.password).length < 4) return res.status(400).json({ error: "Password 4+ char" });
    data.portalPassword = await hashPassword(String(req.body.password));
  }
  try {
    const c = await prisma.client.update({ where: { id }, data, include: { zone: true } });
    res.json(shape(c));
  } catch (e) {
    res.status(400).json({ error: e.code === "P2002" ? "Ei portal username onno client er ache" : "Update failed" });
  }
});

// Disable portal
r.post("/:id/disable", requireRole("admin", "reseller"), async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.client.findFirst({ where: { id, ...scope(req) } });
  if (!existing) return res.status(404).json({ error: "Client nei" });
  const c = await prisma.client.update({ where: { id }, data: { portalEnabled: false }, include: { zone: true } });
  res.json(shape(c));
});

// Password reset / username update
r.put("/:id", requireRole("admin", "reseller"), async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.client.findFirst({ where: { id, ...scope(req) } });
  if (!existing) return res.status(404).json({ error: "Client nei" });
  const data = {};
  if (req.body?.portalUser != null) data.portalUser = String(req.body.portalUser).trim() || null;
  if (req.body?.password) {
    if (String(req.body.password).length < 4) return res.status(400).json({ error: "Password 4+ char" });
    data.portalPassword = await hashPassword(String(req.body.password));
  }
  try {
    const c = await prisma.client.update({ where: { id }, data, include: { zone: true } });
    res.json(shape(c));
  } catch (e) {
    res.status(400).json({ error: e.code === "P2002" ? "Ei portal username onno client er ache" : "Update failed" });
  }
});

export default r;
