import crypto from "crypto";

// MikroTik router password encrypt kore DB-te rakhi — plain text kokhono na.
// Key env theke (MIKROTIK_SECRET), na thakle JWT_SECRET theke derive kori.
// AES-256-GCM — authenticated encryption (tamper detect hoy).
const rawKey = process.env.MIKROTIK_SECRET || process.env.JWT_SECRET || "";
if (!rawKey) {
  // auth.js already JWT_SECRET fail-fast kore, tai ekhane pouchbe na — tobu guard
  console.warn("[mikrotik] MIKROTIK_SECRET/JWT_SECRET nei — credential encryption weak hobe");
}
// 32-byte key (sha256 diye normalize — jekono length secret cholbe)
const KEY = crypto.createHash("sha256").update(String(rawKey || "ispora-fallback")).digest();

// Format: v1:<iv-hex>:<tag-hex>:<cipher-hex>
export function encrypt(plain) {
  if (plain == null || plain === "") return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

export function decrypt(stored) {
  if (!stored || typeof stored !== "string" || !stored.startsWith("v1:")) return null;
  try {
    const [, ivHex, tagHex, dataHex] = stored.split(":");
    const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    const dec = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]);
    return dec.toString("utf8");
  } catch {
    return null; // tampered ba wrong key
  }
}
