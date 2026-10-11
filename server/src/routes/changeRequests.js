import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { ymd } from "../dates.js";

const r = Router();
r.use(requireAuth);

// Reseller shudhu nijer client er change request dekhbe/banabe
const ownClient = async (req, clientId) => {
  if (req.user.role !== "reseller") return true;
  const own = await prisma.client.findFirst({ where: { id: Number(clientId), resellerId: req.user.id } });
  return !!own;
};

const shape = (x) => ({
  id: x.id,
  client: x.client?.name || "",
  clientId: x.clientId,
  phone: x.client?.phone || "",
  currentPackage: x.client?.package?.name || "",
  type: x.type,
  detail: x.detail || "",
  note: x.note || "",
  status: x.status,
  createdAt: ymd(x.createdAt),
});

r.get("/", async (req, res) => {
  const where = {};
  if (req.query.status) where.status = String(req.query.status);
  if (req.user.role === "reseller") where.client = { resellerId: req.user.id };
  const list = await prisma.changeRequest.findMany({
    where, include: { client: { include: { package: true } } }, orderBy: { id: "desc" },
  });
  res.json(list.map(shape));
});

r.post("/", requireRole("admin", "reseller"), async (req, res) => {
  const clientId = Number(req.body?.clientId);
  if (!clientId) return res.status(400).json({ error: "Client select korun" });
  if (!(await ownClient(req, clientId))) return res.status(403).json({ error: "Ei client apnar under e nei" });
  const type = ["package", "info", "other"].includes(req.body?.type) ? req.body.type : "package";
  const row = await prisma.changeRequest.create({
    data: {
      clientId, type,
      detail: req.body?.detail ? String(req.body.detail).slice(0, 200) : null,
      note: req.body?.note ? String(req.body.note).slice(0, 500) : null,
    },
    include: { client: { include: { package: true } } },
  });
  res.status(201).json(shape(row));
});

// Approve — package type hole client er package change kore dey (admin only)
r.post("/:id/approve", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  const cr = await prisma.changeRequest.findUnique({ where: { id } });
  if (!cr) return res.status(404).json({ error: "Request nei" });
  if (cr.type === "package" && cr.detail) {
    const pkg = await prisma.package.findFirst({ where: { name: cr.detail } });
    if (!pkg) return res.status(400).json({ error: `Package "${cr.detail}" nei` });
    await prisma.client.update({ where: { id: cr.clientId }, data: { packageId: pkg.id } });
  }
  await prisma.changeRequest.update({ where: { id }, data: { status: "approved" } });
  res.json({ ok: true });
});

r.post("/:id/reject", requireRole("admin"), async (req, res) => {
  await prisma.changeRequest.update({ where: { id: Number(req.params.id) }, data: { status: "rejected" } });
  res.json({ ok: true });
});

r.delete("/:id", requireRole("admin"), async (req, res) => {
  await prisma.changeRequest.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

export default r;
