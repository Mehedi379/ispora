// SaaS subscription active/extend korar shared logic — manual confirm, mock pay,
// SSLCOMMERZ IPN, owner-verify, owner-comp — shob ekhane eshe (duplicate na).
import { prisma } from "./db.js";

// baki din na hariye +30 din (advance/early renew-eo stack kore)
function nextPeriodEnd(sub) {
  const now = Date.now();
  const base = Math.max(
    now,
    sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).getTime() : 0,
    sub.trialEndsAt ? new Date(sub.trialEndsAt).getTime() : 0,
  );
  return new Date(base + 30 * 864e5);
}

// Unpaid invoice paid kore + confirmed payment create kore + extend (auto gateway / mock)
export async function activateSubscription(tenantId, { method = "Manual", confirmedBy = null } = {}) {
  const sub = await prisma.subscription.findUnique({ where: { tenantId } });
  if (!sub) throw new Error("Subscription nei");
  const periodEnd = nextPeriodEnd(sub);
  const inv = await prisma.saasInvoice.findFirst({ where: { tenantId, status: "unpaid" }, orderBy: { id: "desc" } });
  await prisma.$transaction(async (tx) => {
    if (inv) {
      await tx.saasInvoice.update({ where: { id: inv.id }, data: { status: "paid" } });
      await tx.saasPayment.create({ data: { amount: inv.amount, method, status: "confirmed", confirmedBy, subscriptionId: sub.id, invoiceId: inv.id, tenantId } });
    }
    await tx.subscription.update({ where: { id: sub.id }, data: { status: "active", currentPeriodEnd: periodEnd, nextBillDate: periodEnd } });
    await tx.tenant.update({ where: { id: tenantId }, data: { status: "active" } });
  });
  return { nextBillDate: periodEnd, invoiceNumber: inv?.number || null };
}

// Owner nijei extend kore dey (comp/free renew — tenant pay na korleo). Payment record kore na.
export async function extendSubscription(tenantId) {
  const sub = await prisma.subscription.findUnique({ where: { tenantId } });
  if (!sub) throw new Error("Subscription nei");
  const periodEnd = nextPeriodEnd(sub);
  await prisma.$transaction(async (tx) => {
    // unpaid invoice thakle "paid" kore di (owner comp)
    await tx.saasInvoice.updateMany({ where: { tenantId, status: "unpaid" }, data: { status: "paid" } });
    await tx.subscription.update({ where: { id: sub.id }, data: { status: "active", currentPeriodEnd: periodEnd, nextBillDate: periodEnd } });
    await tx.tenant.update({ where: { id: tenantId }, data: { status: "active" } });
  });
  return { nextBillDate: periodEnd };
}

// Owner ekta PENDING payment (tenant-er TrxID submit) verify kore active kore
export async function confirmPendingPayment(paymentId, confirmedBy = null) {
  const pay = await prisma.saasPayment.findUnique({ where: { id: paymentId } });
  if (!pay) throw new Error("Payment nei");
  if (pay.status === "confirmed") return { already: true };
  const sub = await prisma.subscription.findUnique({ where: { tenantId: pay.tenantId } });
  if (!sub) throw new Error("Subscription nei");
  const periodEnd = nextPeriodEnd(sub);
  await prisma.$transaction(async (tx) => {
    await tx.saasPayment.update({ where: { id: pay.id }, data: { status: "confirmed", confirmedBy } });
    if (pay.invoiceId) await tx.saasInvoice.update({ where: { id: pay.invoiceId }, data: { status: "paid" } });
    await tx.subscription.update({ where: { id: sub.id }, data: { status: "active", currentPeriodEnd: periodEnd, nextBillDate: periodEnd } });
    await tx.tenant.update({ where: { id: pay.tenantId }, data: { status: "active" } });
  });
  return { nextBillDate: periodEnd, tenantId: pay.tenantId };
}
