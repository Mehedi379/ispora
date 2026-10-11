import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";

const r = Router();
r.use(requireAuth);
const admin = requireRole("admin");
const clean = (v, max = 120) => (v == null ? null : String(v).trim().slice(0, max) || null);

const shape = (a) => ({ id: a.id, name: a.name, phone: a.phone || "", email: a.email || "", commission: a.commission, referrals: a.referrals, earned: a.earned, active: a.active, note: a.note || "" });

r.get("/", async (_q, res) => res.json((await prisma.affiliate.findMany({ orderBy: { id: "desc" } })).map(shape)));
r.post("/", admin, async (req, res) => {
  const name = clean(req.body?.name, 100);
  if (!name) return res.status(400).json({ error: "Name din" });
  const a = await prisma.affiliate.create({ data: { name, phone: clean(req.body?.phone, 20), email: clean(req.body?.email, 120), commission: Number(req.body?.commission) || 0, referrals: Number(req.body?.referrals) || 0, earned: Math.round(Number(req.body?.earned) || 0), note: clean(req.body?.note, 200) } });
  res.status(201).json(shape(a));
});
r.put("/:id", admin, async (req, res) => {
  const data = {};
  for (const k of ["name", "phone", "email", "note"]) if (req.body?.[k] != null) data[k] = clean(req.body[k], 200);
  if (req.body?.commission != null) data.commission = Number(req.body.commission) || 0;
  if (req.body?.referrals != null) data.referrals = Number(req.body.referrals) || 0;
  if (req.body?.earned != null) data.earned = Math.round(Number(req.body.earned) || 0);
  if (req.body?.active != null) data.active = !!req.body.active;
  try { res.json(shape(await prisma.affiliate.update({ where: { id: Number(req.params.id) }, data }))); } catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/:id", admin, async (req, res) => { try { await prisma.affiliate.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); } catch { res.status(400).json({ error: "Delete failed" }); } });

export default r;
