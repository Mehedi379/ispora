import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { schemas, parse } from "../validate.js";

const r = Router();
r.use(requireAuth);

const shape = async (p) => ({
  id: p.id, name: p.name, speed: p.speed, price: p.price,
  validity: p.validity, active: p.active,
  type: p.type || "", vas: p.vas || "", description: p.description || "",
  users: await prisma.client.count({ where: { packageId: p.id, deletedAt: null } }),
});

r.get("/", async (_req, res) => {
  const list = await prisma.package.findMany({ orderBy: { price: "asc" } });
  res.json(await Promise.all(list.map(shape)));
});

r.post("/", requireRole("admin"), async (req, res) => {
  const v = parse(schemas.packageCreate, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { name, speed, price, validity, type, vas, description } = v.data;
  try {
    const p = await prisma.package.create({
      data: {
        name, speed, price: Math.round(Number(price)), validity: Number(validity) || 30,
        type: type || null, vas: vas || null, description: description || null,
      },
    });
    res.status(201).json(await shape(p));
  } catch (e) {
    res.status(400).json({ error: e.code === "P2002" ? "Ei name er package ache" : "Create failed" });
  }
});

r.put("/:id", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  const v = parse(schemas.packageUpdate, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { name, speed, price, validity, active, type, vas, description } = v.data;
  const data = {};
  if (name != null) data.name = name;
  if (speed != null) data.speed = speed;
  if (price != null) data.price = Math.round(Number(price));
  if (validity != null) data.validity = Number(validity);
  if (active != null) data.active = !!active;
  if (type !== undefined) data.type = type || null;
  if (vas !== undefined) data.vas = vas || null;
  if (description !== undefined) data.description = description || null;
  try {
    const p = await prisma.package.update({ where: { id }, data });
    res.json(await shape(p));
  } catch {
    res.status(400).json({ error: "Update failed" });
  }
});

r.delete("/:id", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  const used = await prisma.client.count({ where: { packageId: id, deletedAt: null } });
  if (used > 0) return res.status(400).json({ error: `${used} jon client ei package e ache, age change korun` });
  await prisma.package.delete({ where: { id } });
  res.json({ ok: true });
});

export default r;
