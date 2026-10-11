// SaaS billing (tenant-side) — nijer subscription dekha + renew request (manual pay).
// Ei route gula lock-exempt (auth.js), tai trial sesh holeo tenant renew korte parbe.
import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { isLocked, daysLeft } from "../entitlements.js";
import { payMode, initSslcommerz } from "../payments/gateway.js";
import { getPayInfo } from "../platformSettings.js";
import { activateSubscription } from "../saasActivate.js";

const r = Router();
r.use(requireAuth);

// Current tenant-er unpaid invoice ensure kore ferot dey (na thakle banay).
// planId dile oi plan-e upgrade kore (user barale amount barbe) + invoice amount update.
async function ensureInvoice(tid, planId) {
  let sub = await prisma.subscription.findUnique({ where: { tenantId: tid }, include: { plan: true } });
  if (!sub) return null;
  if (planId && planId !== sub.planId) {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (plan && plan.active) {
      await prisma.subscription.update({ where: { id: sub.id }, data: { planId } });
      await prisma.tenant.update({ where: { id: tid }, data: { planId } });
      sub = await prisma.subscription.findUnique({ where: { tenantId: tid }, include: { plan: true } });
    }
  }
  const amount = sub.plan?.priceMonthly || 0;
  let inv = await prisma.saasInvoice.findFirst({ where: { tenantId: tid, status: "unpaid" }, orderBy: { id: "desc" } });
  if (!inv) {
    inv = await prisma.saasInvoice.create({
      data: { number: `SAAS-${tid}-${Date.now().toString().slice(-7)}`, amount, status: "unpaid", subscriptionId: sub.id, tenantId: tid, periodStart: new Date(), periodEnd: new Date(Date.now() + 30 * 864e5) },
    });
  } else if (inv.amount !== amount) {
    inv = await prisma.saasInvoice.update({ where: { id: inv.id }, data: { amount } });
  }
  return { sub, inv };
}

// Nijer subscription + saas invoice history + kon number-e pay korbe
r.get("/me", async (req, res) => {
  const tid = req.user.tenantId;
  if (tid == null) return res.json({ platformOwner: true });
  const sub = await prisma.subscription.findUnique({ where: { tenantId: tid }, include: { plan: true } });
  const invoices = await prisma.saasInvoice.findMany({ where: { tenantId: tid }, orderBy: { id: "desc" }, take: 12 });
  res.json({ subscription: sub, invoices, locked: isLocked(sub), daysLeft: daysLeft(sub), payInfo: await getPayInfo(), payMode: await payMode() });
});

// Payment session shuru — mock hole frontend-e checkout, sslcommerz hole redirect URL
r.post("/pay", requireRole("admin"), async (req, res) => {
  const tid = req.user.tenantId;
  if (tid == null) return res.status(400).json({ error: "Platform owner-er pay lage na" });
  const ei = await ensureInvoice(tid, req.body?.planId ? Number(req.body.planId) : null);
  if (!ei) return res.status(400).json({ error: "Subscription nei" });
  const { inv } = ei;
  const mode = await payMode();
  if (mode === "sslcommerz") {
    try {
      const tenant = await prisma.tenant.findUnique({ where: { id: tid } });
      const apiOrigin = `${req.protocol}://${req.get("host")}`;
      const siteOrigin = process.env.PUBLIC_SITE_URL || apiOrigin.replace(":4000", ":5173");
      const url = await initSslcommerz({
        invoice: inv, tenant,
        successUrl: `${siteOrigin}/pay/success`, failUrl: `${siteOrigin}/pay/fail`,
        ipnUrl: `${apiOrigin}/api/public/sslcommerz/ipn`,
      });
      return res.json({ mode: "sslcommerz", redirectUrl: url, invoice: { number: inv.number, amount: inv.amount } });
    } catch (e) { return res.status(400).json({ error: e.message }); }
  }
  // mock — frontend demo checkout dekhabe (owner-er bKash/Nagad number soho), tarpor /pay/confirm
  res.json({ mode: "mock", invoice: { number: inv.number, amount: inv.amount }, payInfo: await getPayInfo() });
});

// Manual pay — tenant owner-er fixed number-e Send Money kore, TrxID submit kore.
// Pending thake, owner panel theke verify korle active hoy (personal bKash API-te
// auto-verify hoy na — tai TrxID + owner confirm).
r.post("/pay/manual", requireRole("admin"), async (req, res) => {
  const tid = req.user.tenantId;
  if (tid == null) return res.status(400).json({ error: "Platform owner-er pay lage na" });
  const txnId = String(req.body?.txnId || "").trim().slice(0, 40);
  if (!txnId) return res.status(400).json({ error: "bKash/Nagad TrxID din" });
  const ei = await ensureInvoice(tid, req.body?.planId ? Number(req.body.planId) : null);
  if (!ei) return res.status(400).json({ error: "Subscription nei" });
  const { sub, inv } = ei;
  await prisma.saasPayment.create({
    data: { amount: inv.amount, method: String(req.body?.method || "bKash"), txnId, status: "pending", subscriptionId: sub.id, invoiceId: inv.id, tenantId: tid },
  });
  res.status(201).json({ pending: true, invoice: { number: inv.number, amount: inv.amount } });
});

// Mock gateway success (demo only). Real mode-e SSLCOMMERZ IPN (public route) kore.
r.post("/pay/confirm", requireRole("admin"), async (req, res) => {
  if ((await payMode()) !== "mock") return res.status(400).json({ error: "Real gateway callback diye confirm hoy" });
  const tid = req.user.tenantId;
  if (tid == null) return res.status(400).json({ error: "Invalid" });
  await ensureInvoice(tid);
  try {
    const out = await activateSubscription(tid, { method: String(req.body?.method || "bKash"), confirmedBy: req.user.id });
    res.json({ ok: true, ...out });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Legacy "renew request" (manual pay — owner confirm kore) — rakha holo
r.post("/renew", requireRole("admin"), async (req, res) => {
  const tid = req.user.tenantId;
  if (tid == null) return res.status(400).json({ error: "Platform owner-er renew lage na" });
  const ei = await ensureInvoice(tid);
  if (!ei) return res.status(400).json({ error: "Subscription nei" });
  const { sub, inv } = ei;
  if (sub.status === "trial" || sub.status === "suspended") {
    await prisma.subscription.update({ where: { id: sub.id }, data: { status: "past_due" } });
    await prisma.tenant.update({ where: { id: tid }, data: { status: "past_due" } });
  }
  res.status(201).json({
    invoice: { number: inv.number, amount: inv.amount, status: inv.status },
    instructions: "bKash/Nagad e amount pathan, tarpor amader janan — confirm hole shonge shonge active hobe.",
  });
});

// Frontend-ke bole kon mode (mock/sslcommerz) — pay UI shei moto dekhabe
r.get("/pay/mode", async (_q, res) => res.json({ mode: await payMode() }));

// ---- SaaS support: tenant owner-er sathe contact kore ----
r.get("/support", async (req, res) => {
  const tid = req.user.tenantId;
  if (tid == null) return res.json([]);
  const list = await prisma.saasTicket.findMany({ where: { tenantId: tid }, orderBy: { id: "desc" }, take: 50 });
  res.json(list);
});
r.post("/support", async (req, res) => {
  const tid = req.user.tenantId;
  if (tid == null) return res.status(400).json({ error: "Platform owner-er support ticket lage na" });
  const subject = String(req.body?.subject || "").trim().slice(0, 150);
  const message = String(req.body?.message || "").trim().slice(0, 2000);
  if (!subject || !message) return res.status(400).json({ error: "Subject ar message din" });
  const t = await prisma.saasTicket.create({ data: { tenantId: tid, subject, message } });
  res.status(201).json(t);
});

export default r;
