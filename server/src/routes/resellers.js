import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole, hashPassword } from "../auth.js";

const r = Router();
r.use(requireAuth);

// Reseller = role="reseller" er User. Tader clients, outstanding balance, zone compute kori.
const shape = async (u) => {
  const clients = await prisma.client.findMany({
    where: { resellerId: u.id, deletedAt: null },
    include: { zone: true },
  });
  const balance = clients.reduce((s, c) => s + (c.due || 0), 0); // outstanding due
  // clients der modhye shobcheye common zone ta reseller er elaka hishebe dekhai
  const zoneCount = {};
  for (const c of clients) if (c.zone?.name) zoneCount[c.zone.name] = (zoneCount[c.zone.name] || 0) + 1;
  const zone = Object.entries(zoneCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  return {
    id: u.id, name: u.name, owner: u.name, email: u.email, phone: u.phone || "",
    active: u.active, clients: clients.length, balance, zone,
  };
};

// List resellers (admin only)
r.get("/", requireRole("admin"), async (_req, res) => {
  const list = await prisma.user.findMany({ where: { role: "reseller" }, orderBy: { name: "asc" } });
  res.json(await Promise.all(list.map(shape)));
});

// Notun reseller banai (admin only) — login korar jonno User toiri hoy
r.post("/", requireRole("admin"), async (req, res) => {
  const { name, email, phone, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: "name, email, password din" });
  if (String(password).length < 6) return res.status(400).json({ error: "Password 6+ char hote hobe" });
  try {
    const u = await prisma.user.create({
      data: { name, email, phone: phone || null, password: await hashPassword(password), role: "reseller" },
    });
    res.status(201).json(await shape(u));
  } catch (e) {
    res.status(400).json({ error: e.code === "P2002" ? "Ei email already ache" : "Create failed" });
  }
});

// Ekta reseller-er shob client (admin only) — card theke drill-down
r.get("/:id/clients", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  const clients = await prisma.client.findMany({
    where: { resellerId: id, deletedAt: null },
    include: { zone: true, package: true },
    orderBy: { id: "desc" },
  });
  res.json(clients.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    zone: c.zone?.name || "",
    package: c.package?.name || "",
    bill: c.package?.price || 0,
    status: c.status,
    online: c.online,
    due: c.due,
    expiry: c.expiry ? c.expiry.toISOString().slice(0, 10) : null,
  })));
});

// Reseller update (admin only)
r.put("/:id", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  const { name, phone, active, password } = req.body || {};
  // Shudhu reseller user update hobe — admin/collector id dile onno role-er
  // account (jemon onno admin-er password) muche jete parto
  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!target || target.role !== "reseller") return res.status(404).json({ error: "Reseller nei" });
  const data = {};
  if (name != null) data.name = name;
  if (phone != null) data.phone = phone;
  if (active != null) data.active = !!active;
  if (password) {
    if (String(password).length < 6) return res.status(400).json({ error: "Password 6+ char hote hobe" });
    data.password = await hashPassword(password);
  }
  try {
    const u = await prisma.user.update({ where: { id }, data });
    res.json(await shape(u));
  } catch {
    res.status(400).json({ error: "Update failed" });
  }
});

// Reseller delete (admin only) — clients thakle block
r.delete("/:id", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  const used = await prisma.client.count({ where: { resellerId: id, deletedAt: null } });
  if (used > 0) return res.status(400).json({ error: `${used} jon client ei reseller er under e ache, age transfer korun` });
  try {
    await prisma.user.delete({ where: { id } });
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: "Delete failed" });
  }
});

export default r;
