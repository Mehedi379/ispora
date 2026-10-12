import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { ymd } from "../dates.js";

const r = Router();
r.use(requireAuth);

const TYPES = ["IPTV", "OTT", "Static IP", "Cloud", "Other"];
const clean = (v, max = 120) => (v == null ? "" : String(v).trim().slice(0, max));

// ---- VAS Config (service list) ----
const svcShape = (s, counts) => ({
  id: s.id, name: s.name, type: s.type, price: s.price, active: s.active,
  balance: s.balance || 0, logo: s.logo || "",
  totalUsers: counts?.total || 0, activeUsers: counts?.active || 0, inactiveUsers: counts?.inactive || 0,
});

// Protiti service-er user count (distinct client) ek pass-e — client.status active hole active user
async function serviceCounts() {
  const txs = await prisma.vasTransaction.findMany({
    where: { clientId: { not: null } },
    select: { serviceId: true, clientId: true, client: { select: { status: true, deletedAt: true } } },
  });
  const map = {}; // serviceId -> { active:Set, inactive:Set }
  for (const t of txs) {
    if (!t.client || t.client.deletedAt) continue;
    const m = (map[t.serviceId] ||= { active: new Set(), inactive: new Set() });
    if (t.client.status === "active") m.active.add(t.clientId);
    else m.inactive.add(t.clientId);
  }
  const out = {};
  for (const [sid, m] of Object.entries(map)) {
    // eki client active+inactive duto-tei thakle active-ke priority
    for (const c of m.active) m.inactive.delete(c);
    out[sid] = { active: m.active.size, inactive: m.inactive.size, total: m.active.size + m.inactive.size };
  }
  return out;
}

r.get("/services", async (_req, res) => {
  const [list, counts] = await Promise.all([
    prisma.vasService.findMany({ orderBy: { name: "asc" } }),
    serviceCounts().catch(() => ({})),
  ]);
  res.json(list.map((s) => svcShape(s, counts[s.id])));
});

r.post("/services", requireRole("admin"), async (req, res) => {
  const name = clean(req.body?.name, 80);
  if (!name) return res.status(400).json({ error: "Service name din" });
  const type = TYPES.includes(req.body?.type) ? req.body.type : "Other";
  const price = Math.max(0, Math.round(Number(req.body?.price) || 0));
  const logo = clean(req.body?.logo, 300) || null;
  try {
    const s = await prisma.vasService.create({ data: { name, type, price, logo } });
    res.status(201).json(svcShape(s));
  } catch (e) {
    res.status(400).json({ error: e.code === "P2002" ? "Ei service age thekei ache" : "Create failed" });
  }
});

r.put("/services/:id", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  const data = {};
  if (req.body.name != null) data.name = clean(req.body.name, 80);
  if (req.body.type != null && TYPES.includes(req.body.type)) data.type = req.body.type;
  if (req.body.price != null) data.price = Math.max(0, Math.round(Number(req.body.price) || 0));
  if (req.body.logo != null) data.logo = clean(req.body.logo, 300) || null;
  if (req.body.active != null) data.active = !!req.body.active;
  try {
    const s = await prisma.vasService.update({ where: { id }, data });
    res.json(svcShape(s));
  } catch (e) {
    res.status(400).json({ error: e.code === "P2002" ? "Ei service age thekei ache" : "Update failed" });
  }
});

// Recharge — provider balance e taka add
r.post("/services/:id/recharge", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  const amt = Math.round(Number(req.body?.amount) || 0);
  if (!amt || amt <= 0) return res.status(400).json({ error: "Valid amount din" });
  try {
    const s = await prisma.vasService.update({ where: { id }, data: { balance: { increment: amt } } });
    res.json(svcShape(s));
  } catch { res.status(400).json({ error: "Recharge failed" }); }
});

r.delete("/services/:id", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  const used = await prisma.vasTransaction.count({ where: { serviceId: id } });
  if (used > 0) return res.status(400).json({ error: `${used} ta transaction ei service e ache — delete kora jabe na` });
  try { await prisma.vasService.delete({ where: { id } }); res.json({ ok: true }); }
  catch { res.status(400).json({ error: "Delete failed" }); }
});

// ---- VAS Transaction History (sale log) ----
const txShape = (t) => ({
  id: t.id,
  service: t.service?.name || "",
  type: t.service?.type || "",
  client: t.client?.name || "",
  clientId: t.clientId || null,
  amount: t.amount,
  note: t.note || "",
  date: ymd(t.date),
});

r.get("/transactions", async (req, res) => {
  const { from, to, clientId } = req.query;
  const where = {};
  if (clientId) where.clientId = Number(clientId);
  const day = /^\d{4}-\d{2}-\d{2}$/;
  if (from || to) {
    where.date = {};
    if (from && day.test(String(from))) where.date.gte = new Date(`${from}T00:00:00`);
    if (to && day.test(String(to))) where.date.lte = new Date(`${to}T23:59:59.999`);
    if (!Object.keys(where.date).length) delete where.date;
  }
  // Reseller hole shudhu nijer client er VAS
  if (req.user.role === "reseller") where.client = { resellerId: req.user.id };
  const list = await prisma.vasTransaction.findMany({
    where, include: { service: true, client: true }, orderBy: { id: "desc" }, take: 1000,
  });
  res.json(list.map(txShape));
});

// VAS bikri — service client ke charge korlam (amount na dile service price)
r.post("/transactions", async (req, res) => {
  const serviceId = Number(req.body?.serviceId);
  if (!serviceId) return res.status(400).json({ error: "Service select korun" });
  const svc = await prisma.vasService.findUnique({ where: { id: serviceId } });
  if (!svc) return res.status(400).json({ error: "Service nei" });
  const clientId = req.body?.clientId ? Number(req.body.clientId) : null;
  // Reseller hole shudhu nijer client
  if (clientId && req.user.role === "reseller") {
    const own = await prisma.client.findFirst({ where: { id: clientId, resellerId: req.user.id } });
    if (!own) return res.status(403).json({ error: "Ei client apnar under e nei" });
  }
  const amt = req.body?.amount != null ? Math.max(0, Math.round(Number(req.body.amount) || 0)) : svc.price;
  const t = await prisma.vasTransaction.create({
    data: { serviceId, clientId, amount: amt, note: clean(req.body?.note, 500) || null },
    include: { service: true, client: true },
  });
  res.status(201).json(txShape(t));
});

r.delete("/transactions/:id", requireRole("admin"), async (req, res) => {
  try { await prisma.vasTransaction.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); }
  catch { res.status(400).json({ error: "Delete failed" }); }
});

// ---- OTT Hub API key configuration (Setting-e store, tenant-scoped) ----
const getSet = async (key) => (await prisma.setting.findFirst({ where: { key } }))?.value || "";
const putSet = async (key, value) => {
  const ex = await prisma.setting.findFirst({ where: { key } });
  if (ex) await prisma.setting.update({ where: { id: ex.id }, data: { value } });
  else await prisma.setting.create({ data: { key, value } });
};
const maskKey = (k) => (!k ? "" : k.length <= 8 ? "••••" : `${k.slice(0, 6)}••••••${k.slice(-2)}`);

r.get("/settings", async (_req, res) => {
  const key = await getSet("ottHubApiKey");
  const mode = (await getSet("ottHubMode")) || "sandbox";
  res.json({ apiKeyMasked: maskKey(key), hasKey: !!key, mode });
});

r.put("/settings", requireRole("admin"), async (req, res) => {
  const mode = req.body?.mode === "production" ? "production" : "sandbox";
  await putSet("ottHubMode", mode);
  // key diyle-i shudhu update (khali pathale ager key thake)
  const k = clean(req.body?.apiKey, 200);
  if (k) await putSet("ottHubApiKey", k);
  const key = await getSet("ottHubApiKey");
  res.json({ apiKeyMasked: maskKey(key), hasKey: !!key, mode });
});

export default r;
