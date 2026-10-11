import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { ymd } from "../dates.js";

const r = Router();
r.use(requireAuth);

const ACTIONS = ["disconnect", "enable", "package_change", "reminder"];

const shape = (x) => ({
  id: x.id,
  client: x.client?.name || "",
  clientId: x.clientId,
  action: x.action,
  runAt: ymd(x.runAt),
  detail: x.detail || "",
  note: x.note || "",
  status: x.status,
  doneAt: x.doneAt ? ymd(x.doneAt) : null,
});

// Ekta schedule execute koro (manual run ba auto runner — dui jaygatei use)
export async function executeSchedule(s) {
  if (s.action === "disconnect") {
    await prisma.client.update({ where: { id: s.clientId }, data: { online: false } });
  } else if (s.action === "enable") {
    const c = await prisma.client.findUnique({ where: { id: s.clientId } });
    // expired/suspended line auto-on kora jabe na
    if (c && c.status !== "expired" && c.status !== "suspended") {
      await prisma.client.update({ where: { id: s.clientId }, data: { online: true } });
    }
  } else if (s.action === "package_change" && s.detail) {
    const pkg = await prisma.package.findFirst({ where: { name: s.detail } });
    if (pkg) await prisma.client.update({ where: { id: s.clientId }, data: { packageId: pkg.id } });
  }
  // reminder = kichu kora lage na, just done mark
  await prisma.schedule.update({ where: { id: s.id }, data: { status: "done", doneAt: new Date() } });
}

// Due (runAt <= now) pending schedule gula cholao — statusSweep theke call hoy
export async function runDueSchedules() {
  const due = await prisma.schedule.findMany({ where: { status: "pending", runAt: { lte: new Date() } } });
  for (const s of due) {
    try { await executeSchedule(s); } catch (e) { console.error("[scheduler] fail:", s.id, e.message); }
  }
  return due.length;
}

r.get("/", async (req, res) => {
  const where = {};
  if (req.query.status) where.status = String(req.query.status);
  if (req.user.role === "reseller") where.client = { resellerId: req.user.id };
  const list = await prisma.schedule.findMany({ where, include: { client: true }, orderBy: { runAt: "asc" } });
  res.json(list.map(shape));
});

r.post("/", requireRole("admin", "reseller"), async (req, res) => {
  const clientId = Number(req.body?.clientId);
  const action = req.body?.action;
  if (!clientId) return res.status(400).json({ error: "Client select korun" });
  if (!ACTIONS.includes(action)) return res.status(400).json({ error: "Action thik na" });
  const runAt = req.body?.runAt ? new Date(req.body.runAt) : null;
  if (!runAt || Number.isNaN(runAt.getTime())) return res.status(400).json({ error: "Date thik na" });
  if (req.user.role === "reseller") {
    const own = await prisma.client.findFirst({ where: { id: clientId, resellerId: req.user.id } });
    if (!own) return res.status(403).json({ error: "Ei client apnar under e nei" });
  }
  const row = await prisma.schedule.create({
    data: {
      clientId, action, runAt,
      detail: req.body?.detail ? String(req.body.detail).slice(0, 200) : null,
      note: req.body?.note ? String(req.body.note).slice(0, 500) : null,
    },
    include: { client: true },
  });
  res.status(201).json(shape(row));
});

// Ekhoni cholao (manual)
r.post("/:id/run", requireRole("admin"), async (req, res) => {
  const s = await prisma.schedule.findUnique({ where: { id: Number(req.params.id) } });
  if (!s) return res.status(404).json({ error: "Schedule nei" });
  if (s.status !== "pending") return res.status(400).json({ error: "Already " + s.status });
  await executeSchedule(s);
  res.json({ ok: true });
});

r.post("/:id/cancel", requireRole("admin", "reseller"), async (req, res) => {
  await prisma.schedule.update({ where: { id: Number(req.params.id) }, data: { status: "cancelled" } });
  res.json({ ok: true });
});

r.delete("/:id", requireRole("admin"), async (req, res) => {
  await prisma.schedule.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

export default r;
