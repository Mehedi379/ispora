import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { nextInvoiceNumber } from "../numbering.js";
import { schemas, parse } from "../validate.js";
import { ymd } from "../dates.js";

const r = Router();
r.use(requireAuth);

const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const shape = (i) => ({
  id: i.number,
  _id: i.id,
  client: i.client?.name || "",
  phone: i.client?.phone || "",
  address: i.client?.address || "",
  pppoe: i.client?.pppoe || "",
  zone: i.client?.zone?.name || "",
  package: i.client?.package?.name || "",
  speed: i.client?.package?.speed || "",
  amount: i.amount,
  status: i.status,
  date: ymd(i.issuedAt),
  period: `${MONTHS[i.issuedAt.getMonth()]} ${i.issuedAt.getFullYear()}`,
  due: i.dueDate ? ymd(i.dueDate) : null,
  outstanding: i.client?.due ?? 0,
  note: i.note || "",
});

r.get("/", async (req, res) => {
  const { q, zone, status, clientId, open } = req.query;
  const where = {};
  if (clientId) where.clientId = Number(clientId);
  if (status) where.status = String(status);
  // open=1 -> shudhu baki thaka invoice (payment modal er jonno)
  else if (open === "1") where.status = { in: ["unpaid", "partial"] };
  // zone + reseller duita-i client relation er upor filter — merge kore rakhi
  const clientWhere = {};
  if (zone) clientWhere.zone = { name: String(zone) };
  if (req.user.role === "reseller") clientWhere.resellerId = req.user.id;
  if (Object.keys(clientWhere).length) where.client = clientWhere;
  if (q) where.OR = [
    { number: { contains: String(q), mode: "insensitive" } },
    { client: { name: { contains: String(q), mode: "insensitive" } } },
  ];
  const take = q ? 500 : 1000; // search results chhoto, default list capped
  const list = await prisma.invoice.findMany({
    where, include: { client: { include: { zone: true, package: true } } }, orderBy: { id: "desc" }, take,
  });
  res.json(list.map(shape));
});

// Reseller hole invoice-er client ta tar nijer kina check kore
async function ownsInvoiceClient(req, clientId) {
  if (req.user.role !== "reseller") return true;
  const own = await prisma.client.findFirst({ where: { id: Number(clientId), resellerId: req.user.id } });
  return !!own;
}

r.post("/", requireRole("admin", "reseller"), async (req, res) => {
  const v = parse(schemas.invoice, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { clientId, amount, dueDate, note } = v.data;
  if (!(await ownsInvoiceClient(req, clientId))) return res.status(403).json({ error: "Ei client apnar under e nei" });
  const number = await nextInvoiceNumber();
  // dueDate na dile normal ISP niyom e issue date theke grace din (settings.dueAfterDays, default 5) por
  let due = dueDate ? new Date(dueDate) : null;
  if (!due) {
    const row = await prisma.setting.findFirst({ where: { key: "dueAfterDays" } });
    let graceDays = 5;
    try { graceDays = Number(JSON.parse(row?.value ?? "5")) || 5; } catch { /* keep default */ }
    due = new Date();
    due.setDate(due.getDate() + graceDays);
  }
  // Invoice = baki bill, tai client er due o barbe (auto-bill er sathe same niyom)
  const inv = await prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        number, amount: Number(amount), note: note || null,
        dueDate: due, clientId: Number(clientId),
      },
      include: { client: { include: { zone: true, package: true } } },
    });
    await tx.client.update({
      where: { id: Number(clientId) },
      data: { due: { increment: Number(amount) } },
    });
    return created;
  });
  res.status(201).json(shape(inv));
});

// Invoice edit (amount/status/note)
r.put("/:id", requireRole("admin", "reseller"), async (req, res) => {
  const id = Number(req.params.id);
  const v = parse(schemas.invoiceUpdate, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "Invoice nei" });
  if (!(await ownsInvoiceClient(req, existing.clientId))) return res.status(403).json({ error: "Permission nei" });
  const { amount, status, note, dueDate } = v.data;
  const data = {};
  if (amount != null) data.amount = Number(amount);
  if (status != null) data.status = status;
  if (note != null) data.note = note;
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;

  // Due = open invoice er baki amount — amount/status change hole due o sync rakhi
  const paidAgg = await prisma.payment.aggregate({ where: { invoiceId: id }, _sum: { amount: true } });
  const paid = paidAgg._sum.amount || 0;
  const oldRemaining = existing.status === "paid" ? 0 : Math.max(0, existing.amount - paid);
  const newStatus = status ?? existing.status;
  const newAmount = amount ?? existing.amount;
  const newRemaining = newStatus === "paid" ? 0 : Math.max(0, newAmount - paid);
  const delta = newRemaining - oldRemaining;

  try {
    const inv = await prisma.$transaction(async (tx) => {
      const updated = await tx.invoice.update({
        where: { id }, data, include: { client: { include: { zone: true, package: true } } },
      });
      if (delta !== 0) {
        const c = await tx.client.findUnique({ where: { id: existing.clientId } });
        await tx.client.update({
          where: { id: existing.clientId },
          data: { due: Math.max(0, (c?.due || 0) + delta) },
        });
      }
      return updated;
    });
    res.json(shape(inv));
  } catch {
    res.status(400).json({ error: "Update failed" });
  }
});

r.delete("/:id", requireRole("admin", "reseller"), async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "Invoice nei" });
  if (!(await ownsInvoiceClient(req, existing.clientId))) return res.status(403).json({ error: "Permission nei" });

  // Payment history muche felbo na (invoiceId relation e SetNull hoy) —
  // ar due theke baki (unpaid) amount-ta komai dei, nahole due bhul thake
  const paidAgg = await prisma.payment.aggregate({ where: { invoiceId: id }, _sum: { amount: true } });
  const paid = paidAgg._sum.amount || 0;
  const remaining = existing.status === "paid" ? 0 : Math.max(0, existing.amount - paid);

  await prisma.$transaction(async (tx) => {
    await tx.invoice.delete({ where: { id } });
    if (remaining > 0) {
      const c = await tx.client.findUnique({ where: { id: existing.clientId } });
      await tx.client.update({
        where: { id: existing.clientId },
        data: { due: Math.max(0, (c?.due || 0) - remaining) },
      });
    }
  });
  res.json({ ok: true });
});

export default r;
