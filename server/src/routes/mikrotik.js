import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { encrypt } from "../mikrotik/crypto.js";
import { getAdapter, adapterError } from "../mikrotik/index.js";
import { syncPppoeOnline } from "../statusSweep.js";

const r = Router();
r.use(requireAuth);
// Pura module admin-only (router credentials + network control)
r.use(requireRole("admin"));

const clean = (v, max = 120) => (v == null ? null : String(v).trim().slice(0, max) || null);

// Server shape — password KOKHONO expose kori na, shudhu "set/not set" bolel
const shape = (s) => ({
  id: s.id,
  name: s.name,
  ip: s.ip || "",
  model: s.model || "",
  type: s.type,
  mode: s.mode,
  apiPort: s.apiPort,
  username: s.username || "",
  hasPassword: !!s.passwordEnc,
  timeout: s.timeout,
  version: s.version || "",
  status: s.status,
  connected: s.connected,
  lastConnected: s.lastConnected,
  capacity: s.capacity,
});

// Security-relevant event log — password kokhono log kori na
const audit = (req, action, detail) =>
  console.log(`[mikrotik][audit] user=${req.user?.id}(${req.user?.role}) action=${action} ${detail || ""}`);

// ---------- Server CRUD ----------
r.get("/servers", async (_req, res) => {
  const list = await prisma.netDevice.findMany({ where: { type: "mikrotik" }, orderBy: { id: "asc" } });
  res.json(list.map(shape));
});

r.get("/servers/:id", async (req, res) => {
  const s = await prisma.netDevice.findUnique({ where: { id: Number(req.params.id) } });
  if (!s) return res.status(404).json({ error: "Server nei" });
  res.json(shape(s));
});

r.post("/servers", async (req, res) => {
  const name = clean(req.body?.name, 80);
  if (!name) return res.status(400).json({ error: "Server name din" });
  const mode = req.body?.mode === "real" ? "real" : "mock";
  const data = {
    name, type: "mikrotik", mode,
    ip: clean(req.body?.ip, 100),
    model: clean(req.body?.model, 80),
    apiPort: Number(req.body?.apiPort) || 8728,
    username: clean(req.body?.username, 80),
    timeout: Math.max(1, Math.min(120, Number(req.body?.timeout) || 10)),
    capacity: Number(req.body?.capacity) || 0,
    status: "offline",
  };
  if (req.body?.password) data.passwordEnc = encrypt(String(req.body.password));
  const s = await prisma.netDevice.create({ data });
  audit(req, "server.create", `id=${s.id} mode=${mode}`);
  res.status(201).json(shape(s));
});

r.put("/servers/:id", async (req, res) => {
  const id = Number(req.params.id);
  const data = {};
  if (req.body?.name != null) data.name = clean(req.body.name, 80);
  if (req.body?.ip != null) data.ip = clean(req.body.ip, 100);
  if (req.body?.model != null) data.model = clean(req.body.model, 80);
  if (req.body?.mode != null) data.mode = req.body.mode === "real" ? "real" : "mock";
  if (req.body?.apiPort != null) data.apiPort = Number(req.body.apiPort) || 8728;
  if (req.body?.username != null) data.username = clean(req.body.username, 80);
  if (req.body?.timeout != null) data.timeout = Math.max(1, Math.min(120, Number(req.body.timeout) || 10));
  if (req.body?.capacity != null) data.capacity = Number(req.body.capacity) || 0;
  // password shudhu dile update (khali dile purano thakbe)
  if (req.body?.password) data.passwordEnc = encrypt(String(req.body.password));
  try {
    const s = await prisma.netDevice.update({ where: { id }, data });
    audit(req, "server.update", `id=${id}`);
    res.json(shape(s));
  } catch { res.status(400).json({ error: "Update failed" }); }
});

r.delete("/servers/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.netDevice.delete({ where: { id } });
    audit(req, "server.delete", `id=${id}`);
    res.json({ ok: true });
  } catch { res.status(400).json({ error: "Delete failed" }); }
});

// ---------- Test connection ----------
r.post("/servers/:id/test", async (req, res) => {
  const s = await prisma.netDevice.findUnique({ where: { id: Number(req.params.id) } });
  if (!s) return res.status(404).json({ error: "Server nei" });
  try {
    const result = await getAdapter(s).testConnection();
    await prisma.netDevice.update({
      where: { id: s.id },
      data: { connected: true, status: "online", version: result.version, lastConnected: new Date() },
    });
    audit(req, "server.test", `id=${s.id} ok simulated=${result.simulated}`);
    res.json(result);
  } catch (e) {
    await prisma.netDevice.update({ where: { id: s.id }, data: { connected: false, status: "offline" } });
    audit(req, "server.test", `id=${s.id} FAIL`);
    res.status(400).json({ ...adapterError(e), simulated: s.mode !== "real" });
  }
});

// ---------- Sync client.online from real router active sessions ----------
// "Sync Clients & Servers" button er backend — real Mikrotik-der active PPPoE sessions
// fetch kore matching client.online=true set kore.
r.post("/sync/clients", async (req, res) => {
  try {
    const result = await syncPppoeOnline({ tenantId: req.user?.tenantId });
    audit(req, "sync.clients", `updated=${result.updated} servers=${result.servers}`);
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ error: e?.message || "Sync failed" });
  }
});

// ---------- PPPoE management ----------
// Router er PPPoE user list
r.get("/servers/:id/pppoe", async (req, res) => {
  const s = await prisma.netDevice.findUnique({ where: { id: Number(req.params.id) } });
  if (!s) return res.status(404).json({ error: "Server nei" });
  try {
    const users = await getAdapter(s).listPppoe();
    res.json({ simulated: s.mode !== "real", users });
  } catch (e) {
    res.status(400).json({ ...adapterError(e), simulated: s.mode !== "real" });
  }
});

// Enable/disable PPPoE user router-e + DB client sync (matching pppoe thakle)
async function togglePppoe(req, res, enabled) {
  const s = await prisma.netDevice.findUnique({ where: { id: Number(req.params.id) } });
  if (!s) return res.status(404).json({ error: "Server nei" });
  const name = String(req.params.name);
  try {
    const result = await getAdapter(s).setPppoeEnabled(name, enabled);
    // DB sync — ei pppoe-r existing client thakle online flag update (notun client banai NA)
    const client = await prisma.client.findFirst({ where: { pppoe: name, deletedAt: null } });
    let synced = false;
    if (client) {
      await prisma.client.update({ where: { id: client.id }, data: { online: enabled } });
      synced = true;
    }
    audit(req, "pppoe.toggle", `server=${s.id} user=${name} enabled=${enabled} synced=${synced}`);
    res.json({ ...result, syncedClient: synced });
  } catch (e) {
    res.status(400).json({ ...adapterError(e), simulated: s.mode !== "real" });
  }
}
r.post("/servers/:id/pppoe/:name/enable", (req, res) => togglePppoe(req, res, true));
r.post("/servers/:id/pppoe/:name/disable", (req, res) => togglePppoe(req, res, false));

// ---------- Import From MikroTik ----------
// Preview: router user + existing client duplicate detection
r.get("/servers/:id/import/preview", async (req, res) => {
  const s = await prisma.netDevice.findUnique({ where: { id: Number(req.params.id) } });
  if (!s) return res.status(404).json({ error: "Server nei" });
  try {
    const users = await getAdapter(s).listPppoe();
    const names = users.map((u) => u.name);
    const existing = await prisma.client.findMany({ where: { pppoe: { in: names } }, select: { pppoe: true } });
    const dupeSet = new Set(existing.map((c) => c.pppoe));
    res.json({
      simulated: s.mode !== "real",
      users: users.map((u) => ({ name: u.name, password: u.password || "", service: u.service || "", profile: u.profile, callerId: u.callerId || "", disabled: u.disabled, lastLoggedOut: u.lastLoggedOut || "", comment: u.comment, duplicate: dupeSet.has(u.name) })),
    });
  } catch (e) {
    res.status(400).json({ ...adapterError(e), simulated: s.mode !== "real" });
  }
});

// Confirm import — selected pppoe user der Client banai.
// MOCK mode: kichu persist kori NA (simulation) — production DB safe.
r.post("/servers/:id/import", async (req, res) => {
  const s = await prisma.netDevice.findUnique({ where: { id: Number(req.params.id) } });
  if (!s) return res.status(404).json({ error: "Server nei" });
  const want = Array.isArray(req.body?.names) ? req.body.names.map(String) : null;
  try {
    const users = await getAdapter(s).listPppoe();
    const pick = users.filter((u) => (want ? want.includes(u.name) : true));
    const names = pick.map((u) => u.name);
    const existing = await prisma.client.findMany({ where: { pppoe: { in: names } }, select: { pppoe: true } });
    const dupeSet = new Set(existing.map((c) => c.pppoe));
    const fresh = pick.filter((u) => !dupeSet.has(u.name));

    if (s.mode !== "real") {
      // SIMULATION — kono real client toiri hoy na
      audit(req, "import.simulated", `server=${s.id} would=${fresh.length}`);
      return res.json({
        simulated: true, imported: 0, wouldImport: fresh.length, duplicates: dupeSet.size,
        message: "Simulation mode — kono data save hoyni (production DB safe)",
      });
    }
    // REAL mode — asol client toiri (duplicate skip, existing customer overwrite NA)
    let imported = 0;
    for (const u of fresh) {
      await prisma.client.create({
        data: { name: u.comment || u.name, pppoe: u.name, phone: "", status: "active", online: !u.disabled },
      });
      imported++;
    }
    audit(req, "import.real", `server=${s.id} imported=${imported} dupes=${dupeSet.size}`);
    res.json({ simulated: false, imported, duplicates: dupeSet.size, skipped: dupeSet.size });
  } catch (e) {
    res.status(400).json({ ...adapterError(e), simulated: s.mode !== "real" });
  }
});

// ---------- Bulk Clients Import (paste korelist: pppoe,name,phone,package) ----------
r.post("/servers/:id/bulk-import", async (req, res) => {
  const s = await prisma.netDevice.findUnique({ where: { id: Number(req.params.id) } });
  if (!s) return res.status(404).json({ error: "Server nei" });
  const text = String(req.body?.text || "");
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows = [];
  const errors = [];
  for (let i = 0; i < lines.length; i++) {
    const [pppoe, name, phone, pkg] = lines[i].split(",").map((x) => (x || "").trim());
    if (!pppoe) { errors.push(`Line ${i + 1}: pppoe nei`); continue; }
    rows.push({ pppoe, name: name || pppoe, phone: phone || "", package: pkg || "" });
  }
  const names = rows.map((r) => r.pppoe);
  const existing = await prisma.client.findMany({ where: { pppoe: { in: names } }, select: { pppoe: true } });
  const dupeSet = new Set(existing.map((c) => c.pppoe));
  // Same-file duplicate detect
  const seen = new Set();
  const fresh = [];
  for (const row of rows) {
    if (dupeSet.has(row.pppoe) || seen.has(row.pppoe)) continue;
    seen.add(row.pppoe); fresh.push(row);
  }

  if (s.mode !== "real") {
    audit(req, "bulk.simulated", `server=${s.id} would=${fresh.length}`);
    return res.json({
      simulated: true, total: rows.length, wouldImport: fresh.length,
      duplicates: dupeSet.size, invalid: errors.length, errors: errors.slice(0, 10),
      message: "Simulation mode — kono data save hoyni (production DB safe)",
    });
  }
  let imported = 0;
  for (const row of fresh) {
    let packageId;
    if (row.package) {
      const pkg = await prisma.package.findFirst({ where: { name: row.package } });
      if (pkg) packageId = pkg.id;
    }
    await prisma.client.create({
      data: { name: row.name, pppoe: row.pppoe, phone: row.phone, packageId, status: "active", online: true },
    });
    imported++;
  }
  audit(req, "bulk.real", `server=${s.id} imported=${imported}`);
  res.json({ simulated: false, total: rows.length, imported, duplicates: dupeSet.size, invalid: errors.length, errors: errors.slice(0, 10) });
});

// ---------- Server Backup ----------
r.get("/servers/:id/backups", async (req, res) => {
  const list = await prisma.mikrotikBackup.findMany({
    where: { serverId: Number(req.params.id) }, orderBy: { id: "desc" },
    select: { id: true, name: true, type: true, size: true, note: true, createdAt: true, routerFile: true },
  });
  res.json(list);
});

r.post("/servers/:id/backups", async (req, res) => {
  const s = await prisma.netDevice.findUnique({ where: { id: Number(req.params.id) } });
  if (!s) return res.status(404).json({ error: "Server nei" });
  try {
    const result = await getAdapter(s).createBackup(clean(req.body?.name, 80));
    const row = await prisma.mikrotikBackup.create({
      data: {
        serverId: s.id, name: result.name,
        type: s.mode === "real" ? "real" : "simulated",
        size: result.size || 0, content: result.content || null, routerFile: result.routerFile || null,
        note: s.mode === "real" ? "Real router backup" : "SIMULATED backup — real router noy",
      },
    });
    audit(req, "backup.create", `server=${s.id} backup=${row.id} type=${row.type}`);
    res.status(201).json({ id: row.id, name: row.name, type: row.type, size: row.size, note: row.note, createdAt: row.createdAt });
  } catch (e) {
    res.status(400).json({ ...adapterError(e), simulated: s.mode !== "real" });
  }
});

r.get("/servers/:id/backups/:bid/download", async (req, res) => {
  const b = await prisma.mikrotikBackup.findUnique({ where: { id: Number(req.params.bid) } });
  if (!b || b.serverId !== Number(req.params.id)) return res.status(404).json({ error: "Backup nei" });
  if (b.type !== "simulated" || !b.content) {
    return res.status(400).json({ error: "Real router backup direct download API-te hoy na — router theke FTP/Winbox diye nin" });
  }
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Content-Disposition", `attachment; filename="${b.name}.rsc"`);
  res.send(b.content);
});

r.delete("/servers/:id/backups/:bid", async (req, res) => {
  try {
    await prisma.mikrotikBackup.delete({ where: { id: Number(req.params.bid) } });
    audit(req, "backup.delete", `backup=${req.params.bid}`);
    res.json({ ok: true });
  } catch { res.status(400).json({ error: "Delete failed" }); }
});

export default r;

