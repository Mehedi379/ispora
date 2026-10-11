// Platform Owner-er config (bKash/Nagad number, gateway keys) — PlatformSetting table-e.
// Secret (SSLCOMMERZ passwd) crypto diye encrypt kore rakha hoy, API-te mask kore pathai.
import { prisma } from "./db.js";
import { encrypt, decrypt } from "./mikrotik/crypto.js";

const DEFAULTS = {
  bkashNumber: "",
  nagadNumber: "",
  rocketNumber: "",
  bankInfo: "",
  // protita method on/off — off thakle tenant-er kase show hobe na
  bkashEnabled: "true",
  nagadEnabled: "true",
  rocketEnabled: "true",
  bankEnabled: "true",
  // tenant ki korbe — "Send Money" | "Payment" | "Cash Out"
  bkashAction: "Send Money",
  nagadAction: "Send Money",
  rocketAction: "Send Money",
  // general instruction / comment (tenant pay screen-e dekhabe)
  payNote: "",
  payMode: "manual", // manual | sslcommerz
  sslczStoreId: "",
  sslczStorePasswd: "",
  sslczSandbox: "true",
};
const MASK = "••••••••";

export async function getPlatformSettingsRaw() {
  const rows = await prisma.platformSetting.findMany();
  const s = { ...DEFAULTS };
  for (const r of rows) {
    if (r.key === "sslczStorePasswd") { try { s[r.key] = r.value ? decrypt(r.value) : ""; } catch { s[r.key] = ""; } }
    else if (r.key in DEFAULTS) s[r.key] = r.value;
  }
  return s;
}

// API response — secret mask kora
export async function getPlatformSettingsMasked() {
  const s = await getPlatformSettingsRaw();
  return { ...s, sslczStorePasswd: s.sslczStorePasswd ? MASK : "" };
}

export async function savePlatformSettings(obj = {}) {
  for (const [key, value] of Object.entries(obj)) {
    if (!(key in DEFAULTS)) continue;
    let v = value == null ? "" : String(value).trim().slice(0, 300);
    if (key === "sslczStorePasswd") {
      if (v === MASK || v === "") continue; // mask ba khali = change kori na
      v = encrypt(v);
    }
    await prisma.platformSetting.upsert({ where: { key }, create: { key, value: v }, update: { value: v } });
  }
}

// Tenant-der dekhanor jonno (secret chara) — kon method on, kon number, ki korbe
export async function getPayInfo() {
  const s = await getPlatformSettingsRaw();
  const on = (v) => v !== "false";
  return {
    bkash: { number: s.bkashNumber, action: s.bkashAction || "Send Money", enabled: on(s.bkashEnabled) && !!s.bkashNumber },
    nagad: { number: s.nagadNumber, action: s.nagadAction || "Send Money", enabled: on(s.nagadEnabled) && !!s.nagadNumber },
    rocket: { number: s.rocketNumber, action: s.rocketAction || "Send Money", enabled: on(s.rocketEnabled) && !!s.rocketNumber },
    bank: { info: s.bankInfo, enabled: on(s.bankEnabled) && !!s.bankInfo },
    note: s.payNote || "",
  };
}

// SSLCOMMERZ creds (settings > env fallback)
export async function sslczCreds() {
  const s = await getPlatformSettingsRaw();
  return {
    mode: (s.payMode || process.env.SAAS_PAY_MODE || "manual").toLowerCase(),
    storeId: s.sslczStoreId || process.env.SSLCZ_STORE_ID || "",
    storePass: s.sslczStorePasswd || process.env.SSLCZ_STORE_PASSWD || "",
    sandbox: String(s.sslczSandbox ?? process.env.SSLCZ_SANDBOX ?? "true") === "true",
  };
}
