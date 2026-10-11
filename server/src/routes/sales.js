import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { ymd } from "../dates.js";

const r = Router();
r.use(requireAuth);
const admin = requireRole("admin");
const clean = (v, max = 120) => (v == null ? null : String(v).trim().slice(0, max) || null);
const KINDS = ["product", "service", "installation"];

const shape = (s) => ({ id: s.id, kind: s.kind, clientId: s.clientId, clientName: s.clientName || "", item: s.item || "", qty: s.qty, unitPrice: s.unitPrice, amount: s.amount, status: s.status, note: s.note || "", date: ymd(s.date) });

r.get("/", async (req, res) => {
  const where = {};
  if (KINDS.includes(req.query.kind)) where.kind = req.query.kind;
  if (req.query.status) where.status = String(req.query.status);
  res.json((await prisma.saleEntry.findMany({ where, orderBy: { id: "desc" } })).map(shape));
});

r.post("/", admin, async (req, res) => {
  const kind = KINDS.includes(req.body?.kind) ? req.body.kind : "product";
  const qty = Number(req.body?.qty) || 1;
  const unitPrice = Math.round(Number(req.body?.unitPrice) || 0);
  // product hole qty*unit, baki gula direct amount
  let amount = Math.round(Number(req.body?.amount) || 0);
  if (kind === "product") amount = qty * unitPrice;
  if (amount <= 0) return res.status(400).json({ error: "Amount din" });
  const s = await prisma.saleEntry.create({
    data: {
      kind, qty, unitPrice, amount,
      clientId: req.body?.clientId ? Number(req.body.clientId) : null,
      clientName: clean(req.body?.clientName, 120),
      item: clean(req.body?.item, 120),
      status: req.body?.status === "paid" ? "paid" : "unpaid",
      note: clean(req.body?.note, 200),
    },
  });
  res.status(201).json(shape(s));
});

r.post("/:id/pay", admin, async (req, res) => {
  try { res.json(shape(await prisma.saleEntry.update({ where: { id: Number(req.params.id) }, data: { status: "paid" } }))); }
  catch { res.status(400).json({ error: "Update failed" }); }
});

r.delete("/:id", admin, async (req, res) => {
  try { await prisma.saleEntry.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); }
  catch { res.status(400).json({ error: "Delete failed" }); }
});

export default r;
