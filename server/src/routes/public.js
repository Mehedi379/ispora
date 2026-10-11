// Public (no-auth) endpoints — marketing landing + signup page e lage
import { Router } from "express";
import { prisma } from "../db.js";
import { validateSslcommerz } from "../payments/gateway.js";
import { activateSubscription } from "../saasActivate.js";

const r = Router();

// Active plans — landing/signup pricing dekhanor jonno
r.get("/plans", async (_q, res) => {
  const plans = await prisma.plan.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { priceMonthly: "asc" }] });
  res.json(plans.map((p) => ({ id: p.id, name: p.name, priceMonthly: p.priceMonthly, maxUsers: p.maxUsers, features: p.features })));
});

// SSLCOMMERZ IPN — payment hole SSLCOMMERZ ei URL-e POST kore (form-encoded).
// val_id verify kore tabe-i activate — nahole keu fake call kore active korte parbe.
r.post("/sslcommerz/ipn", async (req, res) => {
  const { val_id, tran_id, status } = req.body || {};
  if (!val_id || (status !== "VALID" && status !== "VALIDATED")) return res.json({ ok: false });
  try {
    const v = await validateSslcommerz(val_id);
    if ((v.status === "VALID" || v.status === "VALIDATED") && (v.tran_id === tran_id || !tran_id)) {
      const inv = await prisma.saasInvoice.findFirst({ where: { number: v.tran_id || tran_id } });
      if (inv && inv.status !== "paid") await activateSubscription(inv.tenantId, { method: "SSLCommerz" });
    }
    res.json({ ok: true });
  } catch { res.json({ ok: false }); }
});

export default r;

