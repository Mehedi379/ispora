import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { ymd } from "../dates.js";

const r = Router();
r.use(requireAuth);
const admin = requireRole("admin");
const clean = (v, max = 120) => (v == null ? null : String(v).trim().slice(0, max) || null);

// ---------- MAC Packages ----------
r.get("/packages", async (_q, res) => res.json(await prisma.macPackage.findMany({ orderBy: { price: "asc" } })));
r.post("/packages", admin, async (req, res) => {
  const name = clean(req.body?.name, 80);
  if (!name) return res.status(400).json({ error: "Package name din" });
  try { res.status(201).json(await prisma.macPackage.create({ data: { name, speed: clean(req.body?.speed, 40), price: Number(req.body?.price) || 0, validity: Number(req.body?.validity) || 30 } })); }
  catch (e) { res.status(400).json({ error: e.code === "P2002" ? "Ei package ache" : "Create failed" }); }
});
r.put("/packages/:id", admin, async (req, res) => {
  const data = {};
  if (req.body?.name != null) data.name = clean(req.body.name, 80);
  if (req.body?.speed != null) data.speed = clean(req.body.speed, 40);
  if (req.body?.price != null) data.price = Number(req.body.price) || 0;
  if (req.body?.validity != null) data.validity = Number(req.body.validity) || 30;
  try { res.json(await prisma.macPackage.update({ where: { id: Number(req.params.id) }, data })); }
  catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/packages/:id", admin, async (req, res) => {
  try { await prisma.macPackage.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); } catch { res.status(400).json({ error: "Delete failed" }); }
});

// ---------- Tariffs ----------
r.get("/tariffs", async (_q, res) => res.json(await prisma.tariff.findMany({ orderBy: { name: "asc" } })));
r.post("/tariffs", admin, async (req, res) => {
  const name = clean(req.body?.name, 80);
  if (!name) return res.status(400).json({ error: "Tariff name din" });
  try { res.status(201).json(await prisma.tariff.create({ data: { name, commission: Number(req.body?.commission) || 0, note: clean(req.body?.note, 200) } })); }
  catch (e) { res.status(400).json({ error: e.code === "P2002" ? "Ei tariff ache" : "Create failed" }); }
});
r.put("/tariffs/:id", admin, async (req, res) => {
  const data = {};
  if (req.body?.name != null) data.name = clean(req.body.name, 80);
  if (req.body?.commission != null) data.commission = Number(req.body.commission) || 0;
  if (req.body?.note != null) data.note = clean(req.body.note, 200);
  try { res.json(await prisma.tariff.update({ where: { id: Number(req.params.id) }, data })); } catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/tariffs/:id", admin, async (req, res) => {
  try { await prisma.tariff.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); } catch { res.status(400).json({ error: "Delete failed" }); }
});

// ---------- MAC Resellers ----------
const resShape = (x) => ({ id: x.id, name: x.name, phone: x.phone || "", email: x.email || "", balance: x.balance, commission: x.commission, active: x.active });
r.get("/resellers", async (_q, res) => res.json((await prisma.macReseller.findMany({ orderBy: { id: "desc" } })).map(resShape)));
r.post("/resellers", admin, async (req, res) => {
  const name = clean(req.body?.name, 100);
  if (!name) return res.status(400).json({ error: "Reseller name din" });
  const x = await prisma.macReseller.create({ data: { name, phone: clean(req.body?.phone, 20), email: clean(req.body?.email, 120), commission: Number(req.body?.commission) || 0, balance: Number(req.body?.balance) || 0 } });
  res.status(201).json(resShape(x));
});
r.put("/resellers/:id", admin, async (req, res) => {
  const data = {};
  for (const k of ["name", "phone", "email"]) if (req.body?.[k] != null) data[k] = clean(req.body[k], 120);
  if (req.body?.commission != null) data.commission = Number(req.body.commission) || 0;
  if (req.body?.active != null) data.active = !!req.body.active;
  try { res.json(resShape(await prisma.macReseller.update({ where: { id: Number(req.params.id) }, data }))); } catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/resellers/:id", admin, async (req, res) => {
  try { await prisma.macReseller.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); } catch { res.status(400).json({ error: "Delete failed" }); }
});

// ---------- Reseller Funding (balance baray) ----------
const fundShape = (f) => ({ id: f.id, resellerId: f.resellerId, reseller: f.reseller?.name || "", amount: f.amount, method: f.method, note: f.note || "", date: ymd(f.date) });
r.get("/funding", async (req, res) => {
  const where = req.query.resellerId ? { resellerId: Number(req.query.resellerId) } : {};
  const list = await prisma.resellerFunding.findMany({ where, include: { reseller: true }, orderBy: { id: "desc" } });
  res.json(list.map(fundShape));
});
r.post("/funding", admin, async (req, res) => {
  const resellerId = Number(req.body?.resellerId);
  const amount = Math.round(Number(req.body?.amount) || 0);
  if (!resellerId) return res.status(400).json({ error: "Reseller select korun" });
  if (amount <= 0) return res.status(400).json({ error: "Amount 0 er boro hote hobe" });
  const fund = await prisma.$transaction(async (tx) => {
    const f = await tx.resellerFunding.create({ data: { resellerId, amount, method: clean(req.body?.method, 30) || "Cash", note: clean(req.body?.note, 200) }, include: { reseller: true } });
    await tx.macReseller.update({ where: { id: resellerId }, data: { balance: { increment: amount } } });
    return f;
  });
  res.status(201).json(fundShape(fund));
});

// ---------- Client PGW Payments ----------
const pgwShape = (p) => ({ id: p.id, amount: p.amount, gateway: p.gateway, txnId: p.txnId || "", status: p.status, note: p.note || "", clientId: p.clientId || null, date: ymd(p.date) });
r.get("/pgw-payments", async (req, res) => {
  const where = {};
  if (req.query.status) where.status = String(req.query.status);
  const list = await prisma.pgwPayment.findMany({ where, orderBy: { id: "desc" }, take: 1000 });
  res.json(list.map(pgwShape));
});
r.post("/pgw-payments", admin, async (req, res) => {
  const amount = Math.round(Number(req.body?.amount) || 0);
  if (amount <= 0) return res.status(400).json({ error: "Amount din" });
  const p = await prisma.pgwPayment.create({ data: { amount, gateway: clean(req.body?.gateway, 30) || "bKash", txnId: clean(req.body?.txnId, 60), status: ["success", "pending", "failed"].includes(req.body?.status) ? req.body.status : "success", note: clean(req.body?.note, 200), clientId: req.body?.clientId ? Number(req.body.clientId) : null } });
  res.status(201).json(pgwShape(p));
});
r.delete("/pgw-payments/:id", admin, async (req, res) => {
  try { await prisma.pgwPayment.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); } catch { res.status(400).json({ error: "Delete failed" }); }
});

export default r;
