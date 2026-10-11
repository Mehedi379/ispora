// SaaS payment gateway adapter — mock/real (MikroTik-er moto pattern).
// Config ekhon Platform Owner panel (PlatformSetting) theke ashe — na thakle env fallback.
// payMode "manual"/"mock" => in-app simulate; "sslcommerz" + keys => real redirect.
import { sslczCreds } from "../platformSettings.js";

const sslczBase = (sandbox) => (sandbox ? "https://sandbox.sslcommerz.com" : "https://securepay.sslcommerz.com");

export async function payMode() {
  const c = await sslczCreds();
  if (c.mode === "sslcommerz" && c.storeId && c.storePass) return "sslcommerz";
  return "mock";
}

// Payment session toiri — GatewayPageURL ferot
export async function initSslcommerz({ invoice, tenant, successUrl, failUrl, ipnUrl }) {
  const c = await sslczCreds();
  const form = new URLSearchParams({
    store_id: c.storeId, store_passwd: c.storePass,
    total_amount: String(invoice.amount), currency: "BDT", tran_id: invoice.number,
    success_url: successUrl, fail_url: failUrl, cancel_url: failUrl, ipn_url: ipnUrl,
    cus_name: tenant.businessName || "ISP", cus_email: tenant.email || "n/a@ispora.app", cus_phone: tenant.phone || "N/A",
    shipping_method: "NO", product_name: "ISPora Subscription", product_category: "SaaS", product_profile: "general",
  });
  const res = await fetch(`${sslczBase(c.sandbox)}/gwprocess/v4/api.php`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form,
  });
  const j = await res.json();
  if (j.status !== "SUCCESS" || !j.GatewayPageURL) throw new Error(j.failedreason || "Gateway init failed");
  return j.GatewayPageURL;
}

export async function validateSslcommerz(valId) {
  const c = await sslczCreds();
  const url = `${sslczBase(c.sandbox)}/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(valId)}&store_id=${c.storeId}&store_passwd=${c.storePass}&format=json`;
  const res = await fetch(url);
  return res.json();
}
