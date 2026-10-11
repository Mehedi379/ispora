import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { hashPassword } from "../auth.js";

const r = Router();
r.use(requireAuth);
r.use(requireRole("admin"));
const clean = (v, max = 120) => (v == null ? null : String(v).trim().slice(0, max) || null);
const ROLES = ["admin", "reseller", "collector"];

// ---------- App Users ----------
const shape = (u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone || "", role: u.role, active: u.active });

r.get("/users", async (_q, res) => res.json((await prisma.user.findMany({ orderBy: { id: "asc" } })).map(shape)));
r.post("/users", async (req, res) => {
  const name = clean(req.body?.name, 100);
  const email = clean(req.body?.email, 120)?.toLowerCase();
  const password = req.body?.password;
  if (!name || !email) return res.status(400).json({ error: "Name o email din" });
  if (!password || String(password).length < 6) return res.status(400).json({ error: "Password 6+ char" });
  const role = ROLES.includes(req.body?.role) ? req.body.role : "collector";
  try {
    const u = await prisma.user.create({ data: { name, email, phone: clean(req.body?.phone, 20), role, password: await hashPassword(String(password)) } });
    res.status(201).json(shape(u));
  } catch (e) { res.status(400).json({ error: e.code === "P2002" ? "Ei email ache" : "Create failed" }); }
});
r.put("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  const data = {};
  if (req.body?.name != null) data.name = clean(req.body.name, 100);
  if (req.body?.phone != null) data.phone = clean(req.body.phone, 20);
  if (req.body?.role != null && ROLES.includes(req.body.role)) data.role = req.body.role;
  if (req.body?.active != null) data.active = !!req.body.active;
  if (req.body?.password) {
    if (String(req.body.password).length < 6) return res.status(400).json({ error: "Password 6+ char" });
    data.password = await hashPassword(String(req.body.password));
  }
  // nijeke deactivate kora theke rokkha
  if (id === req.user.id && data.active === false) return res.status(400).json({ error: "Nijeke deactivate kora jabe na" });
  try { res.json(shape(await prisma.user.update({ where: { id }, data }))); } catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: "Nijeke delete kora jabe na" });
  const used = await prisma.client.count({ where: { resellerId: id, deletedAt: null } });
  if (used > 0) return res.status(400).json({ error: `${used} jon client ei user er under e ache` });
  try { await prisma.user.delete({ where: { id } }); res.json({ ok: true }); } catch { res.status(400).json({ error: "Delete failed" }); }
});

// ---------- Activity Logs ----------
r.get("/activity", async (_q, res) => {
  const list = await prisma.activityLog.findMany({ orderBy: { id: "desc" }, take: 500 });
  res.json(list.map((a) => ({ id: a.id, user: a.userName || "—", role: a.role || "", action: a.action, detail: a.detail || "", at: a.createdAt })));
});

// ---------- Automatic Process status ----------
r.get("/automatic", async (_q, res) => {
  const rows = await prisma.setting.findMany({ where: { key: { in: ["autoDisconnect", "autoBill", "dueAfterDays"] } } });
  const s = {}; for (const row of rows) { try { s[row.key] = JSON.parse(row.value); } catch { s[row.key] = row.value; } }
  res.json({
    autoDisconnect: s.autoDisconnect ?? "Enabled",
    autoBill: s.autoBill ?? "Enabled",
    graceDays: s.dueAfterDays ?? 5,
    engine: "statusSweep (12 ghonta por por + server start e) — auto bill, expiry, grace, line off",
  });
});

export default r;
