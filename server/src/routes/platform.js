// Platform Owner (SaaS malik) control panel — tenant/plan/pricing control.
// Shudhu isPlatformOwner user access pabe (requirePlatformOwner).
import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requirePlatformOwner, hashPassword } from "../auth.js";
import { activateSubscription, extendSubscription, confirmPendingPayment } from "../saasActivate.js";
import { getPlatformSettingsMasked, savePlatformSettings } from "../platformSettings.js";

const r = Router();
r.use(requireAuth, requirePlatformOwner);

const clean = (v, max) => (v == null ? null : String(v).trim().slice(0, max));
const num = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? Math.round(n) : d; };

const planShape = (p) => ({
  id: p.id, name: p.name, priceMonthly: p.priceMonthly, maxUsers: p.maxUsers,
  features: p.features, active: p.active, sortOrder: p.sortOrder,
});

// ---------- Plans (pricing tiers) — owner nijei dam/limit control kore ----------
r.get("/plans", async (_q, res) => {
  const plans = await prisma.plan.findMany({ orderBy: [{ sortOrder: "asc" }, { priceMonthly: "asc" }] });
  res.json(plans.map(planShape));
});

r.post("/plans", async (req, res) => {
  const name = clean(req.body?.name, 60);
  if (!name) return res.status(400).json({ error: "Plan name din" });
  try {
    const p = await prisma.plan.create({
      data: {
        name,
        priceMonthly: num(req.body?.priceMonthly, 0),
        maxUsers: num(req.body?.maxUsers, 0),
        features: clean(req.body?.features, 500) || "",
        active: req.body?.active !== false,
        sortOrder: num(req.body?.sortOrder, 0),
      },
    });
    res.status(201).json(planShape(p));
  } catch (e) {
    res.status(400).json({ error: e.code === "P2002" ? "Ei name-er plan age thekei ache" : "Create failed" });
  }
});

r.put("/plans/:id", async (req, res) => {
  const id = Number(req.params.id);
  const data = {};
  if (req.body?.name != null) data.name = clean(req.body.name, 60);
  if (req.body?.priceMonthly != null) data.priceMonthly = num(req.body.priceMonthly, 0);
  if (req.body?.maxUsers != null) data.maxUsers = num(req.body.maxUsers, 0);
  if (req.body?.features != null) data.features = clean(req.body.features, 500) || "";
  if (req.body?.active != null) data.active = !!req.body.active;
  if (req.body?.sortOrder != null) data.sortOrder = num(req.body.sortOrder, 0);
  try {
    const p = await prisma.plan.update({ where: { id }, data });
    res.json(planShape(p));
  } catch (e) {
    res.status(400).json({ error: e.code === "P2002" ? "Name duplicate" : "Update failed" });
  }
});

r.delete("/plans/:id", async (req, res) => {
  const id = Number(req.params.id);
  // plan use kora tenant thakle delete na kore inactive kore di
  const inUse = await prisma.tenant.count({ where: { planId: id } });
  if (inUse > 0) {
    await prisma.plan.update({ where: { id }, data: { active: false } });
    return res.json({ ok: true, deactivated: true, note: `${inUse} tenant ei plan-e ache — delete na kore inactive kora holo` });
  }
  try { await prisma.plan.delete({ where: { id } }); res.json({ ok: true }); }
  catch { res.status(400).json({ error: "Delete failed" }); }
});

// ---------- Tenants (jara software use korche) + usage ----------
r.get("/tenants", async (_q, res) => {
  const tenants = await prisma.tenant.findMany({ include: { plan: true, subscription: true }, orderBy: { id: "desc" } });
  // per-tenant active client count (platform owner context = global, tai groupBy shob tenant)
  const counts = await prisma.client.groupBy({ by: ["tenantId"], where: { deletedAt: null, leftAt: null }, _count: { _all: true } });
  const cmap = {};
  for (const c of counts) cmap[c.tenantId] = c._count._all;
  res.json(tenants.map((t) => ({
    id: t.id, businessName: t.businessName, ownerName: t.ownerName, email: t.email, phone: t.phone,
    status: t.status, createdAt: t.createdAt,
    planId: t.planId, planName: t.plan?.name || null, maxUsers: t.plan?.maxUsers ?? 0,
    usedUsers: cmap[t.id] || 0,
    subStatus: t.subscription?.status || null,
    trialEndsAt: t.subscription?.trialEndsAt || null,
    nextBillDate: t.subscription?.nextBillDate || null,
  })));
});

// Tenant-e plan assign / status change (owner control)
r.put("/tenants/:id", async (req, res) => {
  const id = Number(req.params.id);
  const data = {};
  if (req.body?.planId !== undefined) data.planId = req.body.planId ? Number(req.body.planId) : null;
  if (req.body?.status) data.status = String(req.body.status);
  try {
    const t = await prisma.tenant.update({ where: { id }, data });
    // subscription-eo plan/status sync
    const subData = {};
    if (req.body?.planId !== undefined) subData.planId = data.planId;
    if (req.body?.status) subData.status = data.status;
    if (Object.keys(subData).length) await prisma.subscription.updateMany({ where: { tenantId: id }, data: subData });
    res.json({ ok: true, tenant: { id: t.id, status: t.status, planId: t.planId } });
  } catch { res.status(400).json({ error: "Update failed" }); }
});

// Manual payment confirm — tenant pay korle owner ekhane confirm kore (active kore)
r.post("/tenants/:id/confirm-payment", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const out = await activateSubscription(id, { method: "Manual", confirmedBy: req.user.id });
    res.json({ ok: true, ...out });
  } catch (e) { res.status(400).json({ error: e.message || "Confirm failed" }); }
});

// Platform overview stat (dashboard)
r.get("/overview", async (_q, res) => {
  const [tenants, active, trial, plans] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: "active" } }),
    prisma.tenant.count({ where: { status: "trial" } }),
    prisma.plan.count({ where: { active: true } }),
  ]);
  res.json({ tenants, active, trial, plans });
});

// Owner dashboard — revenue, counts, MRR, recent payments
r.get("/dashboard", async (_q, res) => {
  const [tenants, active, trial, pastDue, suspended] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: "active" } }),
    prisma.tenant.count({ where: { status: "trial" } }),
    prisma.tenant.count({ where: { status: "past_due" } }),
    prisma.tenant.count({ where: { status: "suspended" } }),
  ]);
  const rev = await prisma.saasPayment.aggregate({ where: { status: "confirmed" }, _sum: { amount: true } });
  // MRR = active tenant-der plan price er sum
  const activeSubs = await prisma.subscription.findMany({ where: { status: "active" }, include: { plan: true } });
  const mrr = activeSubs.reduce((s, x) => s + (x.plan?.priceMonthly || 0), 0);
  // recent payments + tenant name
  const pays = await prisma.saasPayment.findMany({ where: { status: "confirmed" }, orderBy: { id: "desc" }, take: 12 });
  const tids = [...new Set(pays.map((p) => p.tenantId))];
  const tmap = {};
  for (const t of await prisma.tenant.findMany({ where: { id: { in: tids } }, select: { id: true, businessName: true } })) tmap[t.id] = t.businessName;
  res.json({
    counts: { tenants, active, trial, pastDue, suspended },
    totalRevenue: rev._sum.amount || 0,
    mrr,
    recentPayments: pays.map((p) => ({ id: p.id, amount: p.amount, method: p.method, at: p.paidAt, tenant: tmap[p.tenantId] || `#${p.tenantId}` })),
  });
});

// Platform payment config (bKash/Nagad number, SSLCOMMERZ keys) — owner set kore
r.get("/settings", async (_q, res) => res.json(await getPlatformSettingsMasked()));
r.put("/settings", async (req, res) => {
  await savePlatformSettings(req.body || {});
  res.json(await getPlatformSettingsMasked());
});

// Pending payments (tenant TrxID submit koreche) — owner verify kore active kore
r.get("/payments/pending", async (_q, res) => {
  const pays = await prisma.saasPayment.findMany({ where: { status: "pending" }, orderBy: { id: "desc" } });
  const tids = [...new Set(pays.map((p) => p.tenantId))];
  const tmap = {};
  for (const t of await prisma.tenant.findMany({ where: { id: { in: tids } }, select: { id: true, businessName: true } })) tmap[t.id] = t.businessName;
  res.json(pays.map((p) => ({ id: p.id, tenant: tmap[p.tenantId] || `#${p.tenantId}`, tenantId: p.tenantId, amount: p.amount, method: p.method, txnId: p.txnId, at: p.paidAt })));
});
r.post("/payments/:id/verify", async (req, res) => {
  try { const out = await confirmPendingPayment(Number(req.params.id), req.user.id); res.json({ ok: true, ...out }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});
r.post("/payments/:id/reject", async (req, res) => {
  try { await prisma.saasPayment.update({ where: { id: Number(req.params.id) }, data: { status: "rejected" } }); res.json({ ok: true }); }
  catch { res.status(400).json({ error: "Reject failed" }); }
});

// Owner nijei tenant renew/extend kore dey (pay na korleo) — row auto-update
r.post("/tenants/:id/renew", async (req, res) => {
  try { const out = await extendSubscription(Number(req.params.id)); res.json({ ok: true, ...out }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// Password reset — tenant pass vule gele owner notun password set kore dey.
// (Stored password hashed, dekhano jay na — tai reset-i ekmatro surokkhito poth.)
// Notun password ek-bar response-e ashe jate owner tenant-ke janate pare.
r.post("/tenants/:id/reset-password", async (req, res) => {
  const id = Number(req.params.id);
  // Tenant-er admin (main login) user — tenant.email-er sathe mile, nahole prothom admin
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) return res.status(404).json({ error: "Tenant nei" });
  let user = await prisma.user.findFirst({ where: { tenantId: id, email: tenant.email } })
    || await prisma.user.findFirst({ where: { tenantId: id, role: "admin" }, orderBy: { id: "asc" } });
  if (!user) return res.status(404).json({ error: "Tenant-er user nei" });
  let pw = String(req.body?.password || "").trim();
  if (!pw) pw = Math.random().toString(36).slice(-4) + Math.random().toString(36).toUpperCase().slice(-4); // auto 8-char
  if (pw.length < 6) return res.status(400).json({ error: "Password 6+ character din" });
  await prisma.user.update({ where: { id: user.id }, data: { password: await hashPassword(pw) } });
  res.json({ ok: true, email: user.email, password: pw });
});

// ---- SaaS support inbox (tenant-der message) ----
r.get("/support", async (_q, res) => {
  const list = await prisma.saasTicket.findMany({ orderBy: [{ status: "asc" }, { id: "desc" }], take: 100 });
  const tids = [...new Set(list.map((t) => t.tenantId))];
  const tmap = {};
  for (const t of await prisma.tenant.findMany({ where: { id: { in: tids } }, select: { id: true, businessName: true, email: true } })) tmap[t.id] = t;
  res.json(list.map((t) => ({ ...t, tenant: tmap[t.tenantId]?.businessName || `#${t.tenantId}`, tenantEmail: tmap[t.tenantId]?.email || "" })));
});
r.post("/support/:id/reply", async (req, res) => {
  const id = Number(req.params.id);
  const reply = String(req.body?.reply || "").trim().slice(0, 2000);
  const close = req.body?.close !== false;
  try {
    const t = await prisma.saasTicket.update({ where: { id }, data: { reply: reply || undefined, status: close ? "closed" : "open" } });
    res.json(t);
  } catch { res.status(400).json({ error: "Reply failed" }); }
});

export default r;
