// Public client-registration + forgot-password endpoints (no auth required).
import { Router } from "express";
import { prisma } from "../db.js";
import { hashPassword } from "../auth.js";
import jwt from "jsonwebtoken";

const r = Router();
const clean = (v, max) => (v == null ? null : String(v).trim().slice(0, max) || null);

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET set nei — server start hobena");
}
const SECRET = process.env.JWT_SECRET;

// ---- Client Registration (public) ----
// End-customer self-registers to get portal access. Creates a pending request
// that an admin must approve before portal credentials are issued.
r.post("/register", async (req, res) => {
  const name = clean(req.body?.name, 120);
  const phone = clean(req.body?.phone, 20);
  if (!name) return res.status(400).json({ error: "Name din" });
  if (!phone) return res.status(400).json({ error: "Phone din" });

  try {
    const row = await prisma.clientRequest.create({
      data: {
        name, phone,
        address: clean(req.body?.address, 300),
        pppoe: clean(req.body?.pppoe, 60),
        area: clean(req.body?.area, 60),
        package: clean(req.body?.package, 60),
        note: clean(req.body?.note, 500),
      },
    });
    res.status(201).json({ ok: true, id: row.id, message: "Registration request received — admin review kore portal credentials issue korbe." });
  } catch {
    res.status(400).json({ error: "Registration failed" });
  }
});

// ---- Forgot Password (staff) ----
// Step 1: request reset token. JWT-diye token banai (user id + expiry), email pathabar
// fully kora hoy. Dev-e token response e ashe jate frontend test korte pare.
r.post("/forgot-password", async (req, res) => {
  const email = clean(req.body?.email, 200)?.toLowerCase();
  if (!email) return res.status(400).json({ error: "Email din" });

  const user = await prisma.user.findUnique({ where: { email } });
  // Always 200 — email enumeration prevent
  if (!user || user.tenantId == null || user.isPlatformOwner) {
    return res.json({ ok: true, message: "Jodi account thake, password reset link ei email e pathano hbe." });
  }

  const token = jwt.sign({ uid: user.id }, SECRET, { expiresIn: "30m" });
  const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${token}`;
  res.json({ ok: true, message: "Password reset link ei email e pathano hbe (dev: url response).", resetUrl });
});

// Step 2: reset password with token
r.post("/reset-password", async (req, res) => {
  const token = String(req.body?.token || "").trim();
  const password = req.body?.password;
  if (!token) return res.status(400).json({ error: "Token nei" });
  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ error: "Password 6+ character din" });
  }

  let payload;
  try {
    payload = jwt.verify(token, SECRET);
  } catch {
    return res.status(400).json({ error: "Invalid othoba expire token" });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.uid } });
  if (!user || !user.active) return res.status(400).json({ error: "User nei" });

  await prisma.user.update({ where: { id: user.id }, data: { password: await hashPassword(password) } });
  res.json({ ok: true, message: "Password reset holo — login korun" });
});

export default r;
