import { Router } from "express";
import { prisma } from "../db.js";
import { hashPassword, checkPassword, signToken, requireAuth } from "../auth.js";
import { getEntitlements, isLocked, daysLeft } from "../entitlements.js";
import { schemas, parse } from "../validate.js";
import { rateLimit } from "../rateLimit.js";

const r = Router();

const clean = (v, max) => (v == null ? null : String(v).trim().slice(0, max));

// Login — brute-force protection: 10 min e 10 bar (IP + email)
r.post("/login", rateLimit({ windowMs: 10 * 60 * 1000, max: 10 }), async (req, res) => {
  const v = parse(schemas.login, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { email, password } = v.data;
  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
  // Ek-i message — "email naki password vul" bujhiye user enumerate korte parbe na
  const bad = () => res.status(401).json({ error: "Email ba password thik na" });
  if (!user || !user.active) return bad();
  const ok = await checkPassword(password, user.password);
  if (!ok) return bad();
  const token = signToken(user);
  // Login history er jonno log (IP soho) — tenantId explicit (login-e context nei)
  prisma.activityLog.create({ data: { userId: user.id, userName: user.name, role: user.role, action: "LOGIN", detail: req.ip, tenantId: user.tenantId ?? null } }).catch(() => {});
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId ?? null, isPlatformOwner: user.isPlatformOwner } });
});

// Self-serve signup — notun ISP (tenant) + admin user + 7-din trial, shonge shonge login
r.post("/signup", rateLimit({ windowMs: 60 * 60 * 1000, max: 20 }), async (req, res) => {
  const businessName = clean(req.body?.businessName, 120);
  const ownerName = clean(req.body?.ownerName, 120);
  const email = clean(req.body?.email, 120)?.toLowerCase();
  const phone = clean(req.body?.phone, 20);
  const password = req.body?.password;
  const planId = req.body?.planId ? Number(req.body.planId) : null;
  if (!businessName) return res.status(400).json({ error: "Business name din" });
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: "Thik email din" });
  if (typeof password !== "string" || password.length < 6) return res.status(400).json({ error: "Password 6+ character din" });

  const dupe = await prisma.user.findUnique({ where: { email } });
  if (dupe) return res.status(409).json({ error: "Ei email age thekei registered — login korun" });

  // Plan: deya thakle oita, nahole shobcheye cheap active plan
  let plan = planId ? await prisma.plan.findUnique({ where: { id: planId } }) : null;
  if (!plan) plan = await prisma.plan.findFirst({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { priceMonthly: "asc" }] });
  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const pwHash = await hashPassword(password);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({ data: { businessName, ownerName, email, phone, status: "trial", planId: plan?.id ?? null } });
      const user = await tx.user.create({ data: { name: ownerName || businessName, email, phone, password: pwHash, role: "admin", tenantId: tenant.id, active: true } });
      await tx.subscription.create({ data: { tenantId: tenant.id, planId: plan?.id ?? null, status: "trial", trialEndsAt, nextBillDate: trialEndsAt } });
      return { tenant, user };
    });
    const token = signToken(result.user);
    prisma.activityLog.create({ data: { userId: result.user.id, userName: result.user.name, role: "admin", action: "SIGNUP", detail: req.ip, tenantId: result.tenant.id } }).catch(() => {});
    res.status(201).json({ token, user: { id: result.user.id, name: result.user.name, email, role: "admin", tenantId: result.tenant.id, isPlatformOwner: false } });
  } catch (e) {
    res.status(400).json({ error: e.code === "P2002" ? "Ei email age thekei ache" : "Signup failed" });
  }
});

// Nijer info
r.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, phone: true, role: true, active: true, address: true, dob: true, avatar: true, createdAt: true, tenantId: true, isPlatformOwner: true },
  });
  res.json(user);
});

// Tenant-er plan limit + usage (seat limit + feature gating frontend-e lage)
r.get("/entitlements", requireAuth, async (req, res) => {
  const ent = await getEntitlements(req.user.tenantId);
  const usedUsers = req.user.tenantId == null ? 0 : await prisma.client.count({ where: { deletedAt: null, leftAt: null } });
  const sub = req.user.tenantId == null ? null : await prisma.subscription.findUnique({ where: { tenantId: req.user.tenantId } });
  res.json({
    ...ent, usedUsers,
    remaining: ent.unlimited ? null : Math.max(0, ent.maxUsers - usedUsers),
    locked: isLocked(sub),
    daysLeft: daysLeft(sub),
    isPlatformOwner: !!req.user.isPlatformOwner,
  });
});

// Profile update (name, phone, email, address, dob, avatar)
r.put("/profile", requireAuth, async (req, res) => {
  const data = {};
  const clean = (v, max) => (v == null ? undefined : String(v).trim().slice(0, max));
  if (req.body?.name != null) data.name = clean(req.body.name, 100);
  if (req.body?.phone != null) data.phone = clean(req.body.phone, 20) || null;
  if (req.body?.address != null) data.address = clean(req.body.address, 200) || null;
  if (req.body?.dob != null) data.dob = clean(req.body.dob, 20) || null;
  if (req.body?.avatar != null) data.avatar = clean(req.body.avatar, 300) || null;
  if (req.body?.email != null) data.email = clean(req.body.email, 120)?.toLowerCase();
  try {
    const u = await prisma.user.update({ where: { id: req.user.id }, data, select: { id: true, name: true, email: true, phone: true, role: true, address: true, dob: true, avatar: true, createdAt: true } });
    res.json(u);
  } catch (e) { res.status(400).json({ error: e.code === "P2002" ? "Ei email onno keu use korche" : "Update failed" }); }
});

// Nijer activity log (login chara) o login history
r.get("/activity", requireAuth, async (req, res) => {
  const list = await prisma.activityLog.findMany({ where: { userId: req.user.id, action: { not: "LOGIN" } }, orderBy: { id: "desc" }, take: 100 });
  res.json(list.map((a) => ({ id: a.id, action: a.action, at: a.createdAt })));
});
r.get("/logins", requireAuth, async (req, res) => {
  const list = await prisma.activityLog.findMany({ where: { userId: req.user.id, action: "LOGIN" }, orderBy: { id: "desc" }, take: 100 });
  res.json(list.map((a) => ({ id: a.id, ip: a.detail || "—", at: a.createdAt })));
});

// Password change
r.post("/change-password", requireAuth, rateLimit({ windowMs: 10 * 60 * 1000, max: 5 }), async (req, res) => {
  const { current, next: nextPass } = req.body || {};
  if (typeof nextPass !== "string" || nextPass.length < 6)
    return res.status(400).json({ error: "Notun password 6+ char" });
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const ok = await checkPassword(current || "", user.password);
  if (!ok) return res.status(401).json({ error: "Current password vul" });
  await prisma.user.update({ where: { id: user.id }, data: { password: await hashPassword(nextPass) } });
  res.json({ ok: true });
});

export default r;
