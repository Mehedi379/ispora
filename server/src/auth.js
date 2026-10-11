import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "./db.js";
import { runWithTenant } from "./tenantContext.js";
import { isLocked } from "./entitlements.js";

// Fail-fast: secret na thakle kewei token banate pare — tai server start-ei band
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET set nei (server/.env) — lomba random string din, nahole server start hobe na");
}
const SECRET = process.env.JWT_SECRET;
const EXPIRES = process.env.JWT_EXPIRES || "7d";

export const hashPassword = (plain) => bcrypt.hash(plain, 10);
export const checkPassword = (plain, hash) => bcrypt.compare(plain, hash);

export const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role, name: user.name, tenantId: user.tenantId ?? null }, SECRET, { expiresIn: EXPIRES });

// Login lagle token thakte hobe. Token valid hole request-ta tenant-context-er
// bhitore run kori — db.js auto-scope ei context theke tenantId ney.
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Login required" });
  try {
    // algorithms pin — "none"/HS512 diye sign kora token accept hobe na
    const payload = jwt.verify(token, SECRET, { algorithms: ["HS256"] });
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || !user.active) return res.status(401).json({ error: "Invalid session" });
    req.user = {
      id: user.id, role: user.role, name: user.name,
      tenantId: user.tenantId ?? null, isPlatformOwner: user.isPlatformOwner,
    };
    // Trial/subscription lock — tenant user locked hole SHOB request (read+write)
    // block hoy (402), jate pay na kore kewe app chalate na pare — devtools/API
    // diye frontend lock bypass korleo backend atkabe. Shudhu auth + saas-billing
    // exempt (nahole login/subscription-dekha/pay-i kora jabe na).
    if (!user.isPlatformOwner && user.tenantId != null) {
      const path = (req.originalUrl || req.url).split("?")[0];
      const exempt = path.includes("/auth/") || path.includes("/billing/saas");
      if (!exempt) {
        const sub = await prisma.subscription.findUnique({ where: { tenantId: user.tenantId } });
        if (isLocked(sub)) return res.status(402).json({ error: "Trial/subscription sesh — bill pay korle abar kaj korbe", code: "SUB_LOCKED" });
      }
    }
    // Baki middleware/route gula ei tenant-context-er bhitore cholbe (async propagates)
    runWithTenant({ tenantId: user.tenantId ?? null, userId: user.id, role: user.role }, () => next());
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Shudhu nirdishto role er lok parbe (jemon admin)
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role))
    return res.status(403).json({ error: "Permission nei" });
  next();
};

// Shudhu Platform Owner (SaaS malik) — tenant-der control panel route gular jonno
export const requirePlatformOwner = (req, res, next) => {
  if (!req.user?.isPlatformOwner)
    return res.status(403).json({ error: "Platform owner only" });
  next();
};
