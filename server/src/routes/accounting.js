import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { schemas, parse } from "../validate.js";
import { ymd } from "../dates.js";

const r = Router();
r.use(requireAuth);

const shape = (t) => ({
  id: t.id, type: t.type, head: t.head, amount: t.amount,
  note: t.note || "", date: ymd(t.date),
});

// Income/expense sobai dekhte pabe na — collector/reseller er kache financials bondho
r.get("/", requireRole("admin"), async (_req, res) => {
  // List to 200, kintu total SOB transaction theke (age list-i theke sum korchilo — 200+ hole bhul net profit dey)
  const [list, incomeAgg, expenseAgg] = await Promise.all([
    prisma.transaction.findMany({ orderBy: { id: "desc" }, take: 200 }),
    prisma.transaction.aggregate({ where: { type: "income" }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "expense" }, _sum: { amount: true } }),
  ]);
  const income = incomeAgg._sum.amount || 0;
  const expense = expenseAgg._sum.amount || 0;
  res.json({ items: list.map(shape), income, expense, net: income - expense });
});

r.post("/", requireRole("admin"), async (req, res) => {
  const v = parse(schemas.transaction, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { type, head, amount, note, date } = v.data;
  const t = await prisma.transaction.create({
    data: {
      type, head, amount: Number(amount), note: note || null,
      date: date ? new Date(date) : new Date(),
    },
  });
  res.status(201).json(shape(t));
});

r.delete("/:id", requireRole("admin"), async (req, res) => {
  await prisma.transaction.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

export default r;
