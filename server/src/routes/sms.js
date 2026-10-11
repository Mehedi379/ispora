import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { encrypt } from "../mikrotik/crypto.js";
import { ymd } from "../dates.js";

const r = Router();
r.use(requireAuth);
const admin = requireRole("admin");
const clean = (v, max = 500) => (v == null ? null : String(v).trim().slice(0, max) || null);

// ---------- Gateway config (single row, key never returned raw) ----------
r.get("/gateway", async (_q, res) => {
  const g = await prisma.smsGateway.findFirst();
  res.json(g ? { id: g.id, provider: g.provider, apiUrl: g.apiUrl || "", senderId: g.senderId || "", active: g.active, hasKey: !!g.apiKeyEnc } : { provider: "BulkSMSBD", apiUrl: "", senderId: "", active: false, hasKey: false });
});
r.put("/gateway", admin, async (req, res) => {
  const data = { provider: clean(req.body?.provider, 60) || "BulkSMSBD", apiUrl: clean(req.body?.apiUrl, 200), senderId: clean(req.body?.senderId, 40), active: !!req.body?.active };
  if (req.body?.apiKey) data.apiKeyEnc = encrypt(String(req.body.apiKey));
  const existing = await prisma.smsGateway.findFirst();
  const g = existing ? await prisma.smsGateway.update({ where: { id: existing.id }, data }) : await prisma.smsGateway.create({ data });
  res.json({ ok: true, provider: g.provider, active: g.active, hasKey: !!g.apiKeyEnc });
});

// ---------- Templates ----------
r.get("/templates", async (_q, res) => res.json(await prisma.smsTemplate.findMany({ orderBy: { name: "asc" } })));
r.post("/templates", admin, async (req, res) => {
  const name = clean(req.body?.name, 80); const body = clean(req.body?.body, 500);
  if (!name || !body) return res.status(400).json({ error: "Name o body din" });
  try { res.status(201).json(await prisma.smsTemplate.create({ data: { name, body } })); } catch (e) { res.status(400).json({ error: e.code === "P2002" ? "Ei template ache" : "Create failed" }); }
});
r.put("/templates/:id", admin, async (req, res) => {
  const data = {}; if (req.body?.name != null) data.name = clean(req.body.name, 80); if (req.body?.body != null) data.body = clean(req.body.body, 500);
  try { res.json(await prisma.smsTemplate.update({ where: { id: Number(req.params.id) }, data })); } catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/templates/:id", admin, async (req, res) => { try { await prisma.smsTemplate.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); } catch { res.status(400).json({ error: "Delete failed" }); } });

// ---------- Groups + recipients ----------
r.get("/groups", async (_q, res) => {
  const list = await prisma.smsGroup.findMany({ include: { _count: { select: { recipients: true } } }, orderBy: { name: "asc" } });
  res.json(list.map((g) => ({ id: g.id, name: g.name, count: g._count.recipients })));
});
r.post("/groups", admin, async (req, res) => {
  const name = clean(req.body?.name, 80);
  if (!name) return res.status(400).json({ error: "Group name din" });
  try { const g = await prisma.smsGroup.create({ data: { name } }); res.status(201).json({ id: g.id, name: g.name, count: 0 }); } catch (e) { res.status(400).json({ error: e.code === "P2002" ? "Ache" : "Create failed" }); }
});
r.delete("/groups/:id", admin, async (req, res) => { try { await prisma.smsGroup.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); } catch { res.status(400).json({ error: "Delete failed" }); } });
r.get("/groups/:id/recipients", async (req, res) => res.json(await prisma.smsRecipient.findMany({ where: { groupId: Number(req.params.id) }, orderBy: { id: "desc" } })));
r.post("/groups/:id/recipients", admin, async (req, res) => {
  const phone = clean(req.body?.phone, 20);
  if (!phone) return res.status(400).json({ error: "Phone din" });
  const rec = await prisma.smsRecipient.create({ data: { groupId: Number(req.params.id), phone, name: clean(req.body?.name, 100) } });
  res.status(201).json(rec);
});
r.delete("/recipients/:id", admin, async (req, res) => { try { await prisma.smsRecipient.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); } catch { res.status(400).json({ error: "Delete failed" }); } });

// ---------- Send ----------
// body: { phones:[...] | groupId | all:true, body, templateId? } -> SmsMessage log
r.post("/send", admin, async (req, res) => {
  let text = clean(req.body?.body, 500);
  if (req.body?.templateId && !text) { const t = await prisma.smsTemplate.findUnique({ where: { id: Number(req.body.templateId) } }); text = t?.body; }
  if (!text) return res.status(400).json({ error: "Message body din" });
  let phones = [];
  if (Array.isArray(req.body?.phones)) phones = req.body.phones.map((p) => String(p).trim()).filter(Boolean);
  else if (req.body?.groupId) phones = (await prisma.smsRecipient.findMany({ where: { groupId: Number(req.body.groupId) } })).map((x) => x.phone);
  else if (req.body?.all) phones = (await prisma.client.findMany({ where: { deletedAt: null, leftAt: null }, select: { phone: true } })).map((c) => c.phone).filter(Boolean);
  if (phones.length === 0) return res.status(400).json({ error: "Kono recipient nei" });

  const gw = await prisma.smsGateway.findFirst();
  const status = gw?.active && gw?.apiKeyEnc ? "sent" : "simulated";
  // NOTE: real gateway e etai HTTP call hobe; ekhon log kori (status gateway config onujayi)
  await prisma.smsMessage.createMany({ data: phones.map((to) => ({ to, body: text, status })) });
  res.json({ ok: true, count: phones.length, status, simulated: status === "simulated" });
});

// ---------- Message log (Messages Report) ----------
r.get("/messages", async (_q, res) => {
  const list = await prisma.smsMessage.findMany({ orderBy: { id: "desc" }, take: 1000 });
  res.json(list.map((m) => ({ id: m.id, to: m.to, body: m.body, status: m.status, date: ymd(m.date) })));
});

export default r;
