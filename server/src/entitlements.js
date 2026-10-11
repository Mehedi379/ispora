// Tenant-er plan limit + feature access ber kori (seat limit + feature gating-e lage)
import { prisma } from "./db.js";

// tenantId null = Platform Owner — unlimited, shob feature
export async function getEntitlements(tenantId) {
  if (tenantId == null) {
    return { planName: null, maxUsers: 0, features: "*", status: "active", trialEndsAt: null, nextBillDate: null, unlimited: true };
  }
  // Subscription/Plan global model — scoped na, tenantId diye direct
  const sub = await prisma.subscription.findUnique({ where: { tenantId }, include: { plan: true } });
  const plan = sub?.plan || null;
  const maxUsers = plan?.maxUsers ?? 0;
  return {
    planName: plan?.name || null,
    maxUsers,
    features: plan?.features ?? "",
    status: sub?.status || "active",
    trialEndsAt: sub?.trialEndsAt || null,
    nextBillDate: sub?.nextBillDate || null,
    unlimited: !plan || maxUsers === 0, // maxUsers 0 = unlimited
  };
}

// features string ("*" ba "sms,hr,accounting") e key ache kina
export const hasFeature = (features, key) =>
  features === "*" || String(features || "").split(",").map((s) => s.trim()).filter(Boolean).includes(key);

// Subscription locked kina — trial sesh / suspended / past_due / period sesh
export function isLocked(sub) {
  if (!sub) return false; // sub nei (legacy) = lock na
  const now = Date.now();
  if (sub.status === "suspended" || sub.status === "past_due" || sub.status === "cancelled") return true;
  if (sub.status === "trial") return sub.trialEndsAt ? new Date(sub.trialEndsAt).getTime() < now : false;
  if (sub.status === "active") return sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).getTime() < now : false;
  return false;
}

// Trial/period e koto din baki (negative = periye gese)
export function daysLeft(sub) {
  if (!sub) return null;
  const end = sub.status === "trial" ? sub.trialEndsAt : sub.currentPeriodEnd;
  if (!end) return null;
  return Math.ceil((new Date(end).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}
