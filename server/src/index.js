import "dotenv/config";
import express from "express";
import "express-async-errors"; // async route e throw hole Express 4 e request hang hoto — ekhon error middleware e ashe
import cors from "cors";
import { prisma } from "./db.js";

import authRoutes from "./routes/auth.js";
import clientRoutes from "./routes/clients.js";
import packageRoutes from "./routes/packages.js";
import invoiceRoutes from "./routes/invoices.js";
import paymentRoutes from "./routes/payments.js";
import accountingRoutes from "./routes/accounting.js";
import statsRoutes from "./routes/stats.js";
import resellerRoutes from "./routes/resellers.js";
import settingsRoutes from "./routes/settings.js";
import ticketRoutes from "./routes/tickets.js";
import deviceRoutes from "./routes/devices.js";
import configRoutes from "./routes/config.js";
import requestRoutes from "./routes/requests.js";
import vasRoutes from "./routes/vas.js";
import billingRoutes from "./routes/billing.js";
import changeRequestRoutes from "./routes/changeRequests.js";
import scheduleRoutes from "./routes/schedules.js";
import portalRoutes from "./routes/portal.js";
import mikrotikRoutes from "./routes/mikrotik.js";
import hrRoutes from "./routes/hr.js";
import oltRoutes from "./routes/olt.js";
import networkRoutes from "./routes/network.js";
import leaveRoutes from "./routes/leave.js";
import macRoutes from "./routes/mac.js";
import eventRoutes from "./routes/events.js";
import supportRoutes from "./routes/support.js";
import bwbuyRoutes from "./routes/bwbuy.js";
import taskRoutes from "./routes/tasks.js";
import bwsaleRoutes from "./routes/bwsale.js";
import purchaseRoutes from "./routes/purchase.js";
import salesRoutes from "./routes/sales.js";
import inventoryRoutes from "./routes/inventory.js";
import assetRoutes from "./routes/assets.js";
import accounting2Routes from "./routes/accounting2.js";
import reportsRoutes from "./routes/reports.js";
import smsRoutes from "./routes/sms.js";
import affiliationRoutes from "./routes/affiliation.js";
import systemRoutes from "./routes/system.js";
import platformRoutes from "./routes/platform.js";
import saasRoutes from "./routes/saas.js";
import publicRoutes from "./routes/public.js";
import { startStatusSweep } from "./statusSweep.js";

const app = express();

// Render/nginx er pichone req.ip = proxy IP — rate-limit k/int key bhenge jeto
app.set("trust proxy", 1);

// CLIENT_ORIGIN = "https://a.pages.dev, https://b.pages.dev" (trim soho);
// env missing hole wildcard — deploy guide e set korte boloa ache
const origins = process.env.CLIENT_ORIGIN?.split(",").map((s) => s.trim()).filter(Boolean);
// "*" ba unset => wildcard STRING (cors-e array-te "*" dile exact-match kore, kono real
// origin match kore na → CORS header ashe na). Specific list hole oi list-i allow.
const corsOrigin = (!origins?.length || origins.includes("*")) ? "*" : origins;
app.use(cors({ origin: corsOrigin }));
// Leave attachment (max 2 MB file, base64-e ~2.7 MB) — shudhu ei path-e boro body limit;
// age parse hole niche global express.json() skip kore
app.use("/api/leave/applications", express.json({ limit: "3mb" }));
app.use(express.json());
// SSLCOMMERZ IPN form-encoded POST kore — tai urlencoded-o parse kori
app.use(express.urlencoded({ extended: true }));

// Activity logger — successful mutation (POST/PUT/DELETE) req.user soho log kori (password noy)
app.use((req, res, next) => {
  if (["POST", "PUT", "DELETE"].includes(req.method)) {
    const path = (req.originalUrl || req.url).split("?")[0]; // routing req.path strip kore, tai originalUrl
    res.on("finish", () => {
      if (res.statusCode < 400 && req.user && !path.startsWith("/api/auth")) {
        // tenantId explicit — finish callback ALS context-er baire cholte pare
        prisma.activityLog.create({ data: { userId: req.user.id, userName: req.user.name, role: req.user.role, action: `${req.method} ${path}`, tenantId: req.user.tenantId ?? null } }).catch(() => {});
      }
    });
  }
  next();
});

app.get("/api/health", (_req, res) => res.json({ ok: true, name: "ISPora API", time: new Date() }));

app.use("/api/public", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/accounting", accountingRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/resellers", resellerRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/config", configRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/vas", vasRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/change-requests", changeRequestRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/portal", portalRoutes);
app.use("/api/mikrotik", mikrotikRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/olt", oltRoutes);
app.use("/api/network", networkRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/mac", macRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/bwbuy", bwbuyRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/bwsale", bwsaleRoutes);
app.use("/api/purchase", purchaseRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/acc", accounting2Routes);
app.use("/api/reports", reportsRoutes);
app.use("/api/sms", smsRoutes);
app.use("/api/affiliation", affiliationRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/platform", platformRoutes);
app.use("/api/billing/saas", saasRoutes);

// 404
app.use((_req, res) => res.status(404).json({ error: "Route nei" }));

// Global error handler — kono route e unexpected error = logged 500, request kabhu hang thakbe na
app.use((err, _req, res, _next) => {
  // Prisma "record not found" = asol 404, 500 noy (soft-delete/restore path e)
  if (err?.code === "P2025") {
    return res.status(404).json({ error: "Record nei" });
  }
  console.error("[api] unhandled error:", err);
  res.status(err.status || 500).json({ error: err.status ? err.message : "Server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`ISPora API running on http://localhost:${PORT}`);
  startStatusSweep(); // auto status engine chalu
});
