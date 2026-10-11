import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { getTenantId } from "../tenantContext.js";

const r = Router();
r.use(requireAuth);

// Default settings — DB te na thakle egulo fallback hishebe jay
const DEFAULTS = {
  companyName: "ISPora",
  companyPhone: "09611-XXXXXX",
  companyEmail: "support@ispora.com",
  companyAddress: "Mirpur, Dhaka",
  companyLogo: "",
  billDate: "1st of month",
  dueAfterDays: 5,
  penalty: 50,
  autoDisconnect: "Enabled",
  autoBill: "Enabled",
  vat: 0,
  currency: "BDT (৳)",
  timezone: "Asia/Dhaka",
  smsProvider: "BulkSMSBD",
  senderId: "ISPora",
  smsApiKey: "",
  whatsapp: "Enabled",
  // invoice setup
  invoicePrefix: "INV-",
  invoiceFooter: "Thank you for being with us.",
  // periods
  fiscalYearStart: "January",
  // payment gateways
  bkashNumber: "",
  bkashKey: "",
  nagadNumber: "",
  nagadKey: "",
  // email (SMTP)
  smtpHost: "",
  smtpPort: 587,
  smtpUser: "",
  smtpPass: "",
  smtpFrom: "",
  // processing fee
  processingFee: 0,
};

// Secret key gula shob role-er kache masked jabe (screen/DevTools e leak rokte).
// Save korle client ei placeholder ferot pathay, seta original value replace kore na.
const SMS_MASK = "••••••••";
const SECRETS = ["smsApiKey", "bkashKey", "nagadKey", "smtpPass"];
const NUMERIC = { dueAfterDays: [0, 60], penalty: [0, 100000], vat: [0, 100], processingFee: [0, 100], smtpPort: [1, 65535] };

const readAll = async () => {
  const rows = await prisma.setting.findMany();
  const stored = {};
  for (const row of rows) {
    if (!(row.key in DEFAULTS)) continue; // invoiceSeq/ticketSeq counter leak hobe na
    try { stored[row.key] = JSON.parse(row.value); }
    catch { stored[row.key] = row.value; }
  }
  return { ...DEFAULTS, ...stored };
};

// Sob setting ekta object hishebe return kori (default er upor DB value merge kore)
r.get("/", async (req, res) => {
  const out = await readAll();
  for (const k of SECRETS) if (out[k]) out[k] = SMS_MASK;
  res.json(out);
});

// Settings save (admin only) — protita key upsert kori
r.put("/", requireRole("admin"), async (req, res) => {
  const body = req.body || {};
  const entries = Object.entries(body)
    .filter(([k]) => k in DEFAULTS)
    // Masked secret change hoy ni — existing value thakuk
    .filter(([k, v]) => !(SECRETS.includes(k) && v === SMS_MASK))
    .map(([key, value]) => {
      if (key in NUMERIC) {
        const [min, max] = NUMERIC[key];
        const n = Number(value);
        return [key, Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : DEFAULTS[key]];
      }
      if (typeof value === "string") return [key, value.slice(0, 500)];
      return [key, value];
    });
  try {
    const tid = getTenantId() ?? null;
    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.setting.upsert({
          where: { tenantId_key: { tenantId: tid, key } },
          create: { key, value: JSON.stringify(value), tenantId: tid },
          update: { value: JSON.stringify(value) },
        })
      )
    );
    const out = await readAll();
    for (const k of SECRETS) if (out[k]) out[k] = SMS_MASK;
    res.json(out);
  } catch {
    res.status(400).json({ error: "Settings save failed" });
  }
});

export default r;
