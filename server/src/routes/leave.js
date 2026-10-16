import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { ymd } from "../dates.js";

const r = Router();
r.use(requireAuth);
const admin = requireRole("admin");
const clean = (v, max = 200) => (v == null ? null : String(v).trim().slice(0, max) || null);

// ---------- Leave Categories ----------
r.get("/categories", async (_q, res) => res.json(await prisma.leaveCategory.findMany({ orderBy: { name: "asc" } })));
r.post("/categories", admin, async (req, res) => {
  const name = clean(req.body?.name, 80);
  if (!name) return res.status(400).json({ error: "Category name din" });
  try { res.status(201).json(await prisma.leaveCategory.create({ data: { name, note: clean(req.body?.note, 200) } })); }
  catch (e) { res.status(400).json({ error: e.code === "P2002" ? "Ei category ache" : "Create failed" }); }
});
r.put("/categories/:id", admin, async (req, res) => {
  const data = {};
  if (req.body?.name != null) data.name = clean(req.body.name, 80);
  if (req.body?.note != null) data.note = clean(req.body.note, 200);
  try { res.json(await prisma.leaveCategory.update({ where: { id: Number(req.params.id) }, data })); }
  catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/categories/:id", admin, async (req, res) => {
  try { await prisma.leaveCategory.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); }
  catch (e) { res.status(400).json({ error: e.code === "P2003" ? "Category use e ache" : "Delete failed" }); }
});

// ---------- Leave Setup (per category annual quota) ----------
const setupShape = (s) => ({ id: s.id, categoryId: s.categoryId, category: s.category?.name || "", daysPerYear: s.daysPerYear, note: s.note || "" });
r.get("/setup", async (_q, res) => {
  const list = await prisma.leaveSetup.findMany({ include: { category: true }, orderBy: { id: "asc" } });
  res.json(list.map(setupShape));
});
r.post("/setup", admin, async (req, res) => {
  const categoryId = Number(req.body?.categoryId);
  if (!categoryId) return res.status(400).json({ error: "Category select korun" });
  try {
    const s = await prisma.leaveSetup.create({ data: { categoryId, daysPerYear: Number(req.body?.daysPerYear) || 0, note: clean(req.body?.note, 200) }, include: { category: true } });
    res.status(201).json(setupShape(s));
  } catch (e) { res.status(400).json({ error: e.code === "P2002" ? "Ei category-r setup already ache" : "Create failed" }); }
});
r.put("/setup/:id", admin, async (req, res) => {
  const data = {};
  if (req.body?.daysPerYear != null) data.daysPerYear = Number(req.body.daysPerYear) || 0;
  if (req.body?.note != null) data.note = clean(req.body.note, 200);
  if (req.body?.categoryId != null) data.categoryId = Number(req.body.categoryId);
  try { res.json(setupShape(await prisma.leaveSetup.update({ where: { id: Number(req.params.id) }, data, include: { category: true } }))); }
  catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/setup/:id", admin, async (req, res) => {
  try { await prisma.leaveSetup.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); }
  catch { res.status(400).json({ error: "Delete failed" }); }
});

// ---------- Applications (Apply + Approval) ----------
// Attachment: max 2 MB, shudhu ei type gula (type extension theke nei, client-er type trust kori na)
const ATTACH_TYPES = {
  pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif",
  doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};
const MAX_ATTACH = 2 * 1024 * 1024;
const noBlob = { attachmentData: true }; // list/update response-e file bytes load korbo na
const withRel = { employee: true, category: true };

// body.attachment = { name, data (base64) } -> { fields } ba { error }
function parseAttachment(att) {
  const name = clean(String(att?.name || "").split(/[\\/]/).pop(), 150);
  const type = ATTACH_TYPES[name?.split(".").pop().toLowerCase()];
  if (!name || !type) return { error: "Attachment: shudhu PDF, JPG, PNG, WEBP, GIF, DOC, DOCX file din" };
  const buf = Buffer.from(String(att?.data || ""), "base64");
  if (!buf.length) return { error: "Attachment file khali" };
  if (buf.length > MAX_ATTACH) return { error: "Attachment 2 MB-er beshi hote parbe na" };
  return { fields: { attachmentName: name, attachmentType: type, attachmentData: buf } };
}

const appShape = (a) => ({
  id: a.id, employeeId: a.employeeId, employee: a.employee?.name || "",
  categoryId: a.categoryId, category: a.category?.name || "",
  applyDate: ymd(a.createdAt), fromDate: ymd(a.fromDate), toDate: ymd(a.toDate), days: a.days,
  subject: a.subject || "", reason: a.reason || "", attachmentName: a.attachmentName || "", status: a.status,
});
r.get("/applications", async (req, res) => {
  const where = {};
  if (req.query.status) where.status = String(req.query.status);
  const list = await prisma.leaveApplication.findMany({ where, include: withRel, omit: noBlob, orderBy: { id: "desc" } });
  res.json(list.map(appShape));
});
r.post("/applications", admin, async (req, res) => {
  const employeeId = Number(req.body?.employeeId), categoryId = Number(req.body?.categoryId);
  if (!employeeId || !categoryId) return res.status(400).json({ error: "Employee o category din" });
  const from = new Date(req.body?.fromDate), to = new Date(req.body?.toDate);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return res.status(400).json({ error: "Date thik na" });
  if (to < from) return res.status(400).json({ error: "To date From-er age hote parbe na" });
  const days = Math.floor((to - from) / 86400000) + 1;
  let file = {};
  if (req.body?.attachment) {
    const p = parseAttachment(req.body.attachment);
    if (p.error) return res.status(400).json({ error: p.error });
    file = p.fields;
  }
  const a = await prisma.leaveApplication.create({
    data: { employeeId, categoryId, fromDate: from, toDate: to, days, subject: clean(req.body?.subject, 150), reason: clean(req.body?.reason, 300), ...file },
    include: withRel, omit: noBlob,
  });
  res.status(201).json(appShape(a));
});
// Attachment download — findFirst tenant-scoped, tai onno ISP-er file paowa jabe na
r.get("/applications/:id/attachment", admin, async (req, res) => {
  const a = await prisma.leaveApplication.findFirst({
    where: { id: Number(req.params.id) },
    select: { attachmentName: true, attachmentType: true, attachmentData: true },
  });
  if (!a?.attachmentData) return res.status(404).json({ error: "Attachment nei" });
  res.json({ name: a.attachmentName, type: a.attachmentType, data: Buffer.from(a.attachmentData).toString("base64") });
});
r.post("/applications/:id/approve", admin, async (req, res) => {
  try { res.json(appShape(await prisma.leaveApplication.update({ where: { id: Number(req.params.id) }, data: { status: "approved" }, include: withRel, omit: noBlob }))); }
  catch { res.status(400).json({ error: "Update failed" }); }
});
r.post("/applications/:id/reject", admin, async (req, res) => {
  try { res.json(appShape(await prisma.leaveApplication.update({ where: { id: Number(req.params.id) }, data: { status: "rejected" }, include: withRel, omit: noBlob }))); }
  catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/applications/:id", admin, async (req, res) => {
  try { await prisma.leaveApplication.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); }
  catch { res.status(400).json({ error: "Delete failed" }); }
});

export default r;
