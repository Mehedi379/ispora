import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { nextTicketNumber } from "../numbering.js";
import { schemas, parse } from "../validate.js";

const r = Router();
r.use(requireAuth);

// "2h ago" type relative time
const ago = (date) => {
  const sec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
};

const shape = (t) => ({
  id: t.number, _id: t.id, subject: t.subject, priority: t.priority,
  status: t.status, client: t.client?.name || "—", clientId: t.clientId,
  categoryId: t.categoryId, category: t.category?.name || "",
  time: ago(t.updatedAt), createdAt: t.createdAt,
});

// Reseller hole shudhu nijer client-er ticket dekhbe/edit parbe —
// age kono scoping chilo na, reseller onno reseller-er ticket muche dito
const scope = (req) => (req.user.role === "reseller" ? { client: { resellerId: req.user.id } } : {});

async function ownsTicket(req, id) {
  if (req.user.role !== "reseller") return true;
  const t = await prisma.ticket.findUnique({ where: { id }, include: { client: true } });
  return !!t && t.client?.resellerId === req.user.id;
}

r.get("/", async (req, res) => {
  const list = await prisma.ticket.findMany({
    where: scope(req), include: { client: true, category: true }, orderBy: { updatedAt: "desc" }, take: 500,
  });
  res.json(list.map(shape));
});

r.post("/", async (req, res) => {
  const v = parse(schemas.ticketCreate, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { subject, priority, clientId } = v.data;
  const prio = priority || "medium";
  // Reseller nijer client-er jonno-i ticket khulte parbe
  if (clientId && req.user.role === "reseller") {
    const own = await prisma.client.findFirst({ where: { id: Number(clientId), resellerId: req.user.id }, select: { id: true } });
    if (!own) return res.status(403).json({ error: "Ei client apnar under e nei" });
  }
  // TK-101 sequence — delete korleo duplicate number hobe na
  const number = await nextTicketNumber();
  try {
    const t = await prisma.ticket.create({
      data: { number, subject, priority: prio, status: "open", clientId: clientId ? Number(clientId) : null, categoryId: req.body?.categoryId ? Number(req.body.categoryId) : null },
      include: { client: true, category: true },
    });
    res.status(201).json(shape(t));
  } catch {
    res.status(400).json({ error: "Ticket create failed" });
  }
});

r.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!(await ownsTicket(req, id))) return res.status(403).json({ error: "Permission nei" });
  const v = parse(schemas.ticketUpdate, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { subject, priority, status } = v.data;
  const data = {};
  // Collector shudhu status badalte parbe (open/pending/closed) —
  // subject/priority admin/reseller likhbe
  const canEditDetail = req.user.role !== "collector";
  if (subject != null && canEditDetail) data.subject = subject;
  if (priority != null && canEditDetail) data.priority = priority;
  if (status != null) data.status = status;
  if (req.body?.categoryId !== undefined && canEditDetail) data.categoryId = req.body.categoryId ? Number(req.body.categoryId) : null;
  try {
    const t = await prisma.ticket.update({ where: { id }, data, include: { client: true, category: true } });
    res.json(shape(t));
  } catch {
    res.status(400).json({ error: "Update failed" });
  }
});

r.delete("/:id", requireRole("admin", "reseller"), async (req, res) => {
  const id = Number(req.params.id);
  if (!(await ownsTicket(req, id))) return res.status(403).json({ error: "Permission nei" });
  try { await prisma.ticket.delete({ where: { id } }); res.json({ ok: true }); }
  catch { res.status(400).json({ error: "Delete failed" }); }
});

export default r;
