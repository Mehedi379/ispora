import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";

const r = Router();
r.use(requireAuth);

const clean = (v, max = 200) => (v == null ? null : String(v).trim().slice(0, max) || null);

const shape = (x) => ({
  id: x.id,
  name: x.name,
  phone: x.phone,
  address: x.address || "",
  pppoe: x.pppoe || "",
  area: x.area || "",
  package: x.package || "",
  note: x.note || "",
  status: x.status,
  createdAt: x.createdAt,
});

// List new connection requests (?status=pending|approved|rejected)
r.get("/", async (req, res) => {
  const where = {};
  if (req.query.status) where.status = String(req.query.status);
  const list = await prisma.clientRequest.findMany({ where, orderBy: { id: "desc" } });
  res.json(list.map(shape));
});

// Create a new request (admin/reseller/collector — pore public portal theke-o ashte parbe)
r.post("/", async (req, res) => {
  const name = clean(req.body?.name, 120);
  const phone = clean(req.body?.phone, 20);
  if (!name) return res.status(400).json({ error: "Name din" });
  if (!phone) return res.status(400).json({ error: "Phone din" });
  const row = await prisma.clientRequest.create({
    data: {
      name, phone,
      address: clean(req.body?.address, 200),
      pppoe: clean(req.body?.pppoe, 60),
      area: clean(req.body?.area, 60),
      package: clean(req.body?.package, 60),
      note: clean(req.body?.note, 500),
    },
  });
  res.status(201).json(shape(row));
});

// Approve — request theke asol Client toiri hoy (admin only)
r.post("/:id/approve", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  const reqRow = await prisma.clientRequest.findUnique({ where: { id } });
  if (!reqRow) return res.status(404).json({ error: "Request nei" });
  if (reqRow.status === "approved") return res.status(400).json({ error: "Age-i approve kora hoyeche" });
  if (!reqRow.pppoe) return res.status(400).json({ error: "PPPoE username nei — age request edit kore din" });

  try {
    const data = {
      name: reqRow.name,
      phone: reqRow.phone,
      pppoe: reqRow.pppoe,
      address: reqRow.address,
      status: "active",
    };
    if (reqRow.area) {
      let zone = await prisma.zone.findFirst({ where: { name: reqRow.area } });
      if (!zone) zone = await prisma.zone.create({ data: { name: reqRow.area } });
      data.zoneId = zone.id;
    }
    if (reqRow.package) {
      const pkg = await prisma.package.findFirst({ where: { name: reqRow.package } });
      if (pkg) data.packageId = pkg.id;
    }
    const client = await prisma.client.create({
      data,
      include: { zone: true, package: true },
    });
    await prisma.clientRequest.update({ where: { id }, data: { status: "approved" } });
    res.status(201).json({ ok: true, clientId: client.id });
  } catch (e) {
    if (e.code === "P2002") return res.status(409).json({ error: "Ei PPPoE user age thekei ache" });
    res.status(400).json({ error: "Approve failed" });
  }
});

// Reject (admin only)
r.post("/:id/reject", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  await prisma.clientRequest.update({ where: { id }, data: { status: "rejected" } });
  res.json({ ok: true });
});

// Delete request (admin only)
r.delete("/:id", requireRole("admin"), async (req, res) => {
  await prisma.clientRequest.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

export default r;
