import { z } from "zod";

// Money: finite, positive. (Age kono validation chilo na — negative amount
// dile due bartho, NaN dile Prisma 500 dito.)
const amount = z.coerce
  .number({ invalid_type_error: "Amount thik na" })
  .finite("Amount thik na")
  .positive("Amount 0 er boro hote hobe")
  // Schema e amount Int — 10.5 dile Prisma validation diye 500 dito
  .transform((v) => Math.round(v));
const posInt = z.coerce.number().int().positive("Id thik na");
const ymd = /^\d{4}-\d{2}-\d{2}$/;

export const schemas = {
  login: z.object({
    email: z.string().min(3).max(200),
    password: z.string().min(1).max(200),
  }),

  payment: z.object({
    clientId: posInt,
    amount,
    method: z.string().max(30).optional(),
    invoiceId: posInt.optional(),
    note: z.string().max(500).optional(),
  }),

  invoice: z.object({
    clientId: posInt,
    amount,
    dueDate: z.string().regex(ymd, "Due date YYYY-MM-DD hote hobe").optional(),
    note: z.string().max(500).optional(),
  }),

  invoiceUpdate: z.object({
    amount: amount.optional(),
    status: z.enum(["unpaid", "partial", "paid"], { errorMap: () => ({ message: "Status thik na" }) }).optional(),
    note: z.string().max(500).optional(),
    dueDate: z.union([z.string().regex(ymd, "Due date YYYY-MM-DD hote hobe"), z.null()]).optional(),
  }),

  transaction: z.object({
    type: z.enum(["income", "expense"], { errorMap: () => ({ message: "Type income/expense hote hobe" }) }),
    head: z.string().min(1, "Head din").max(120),
    amount,
    note: z.string().max(500).optional(),
    date: z.string().max(40).optional(),
  }),

  packageCreate: z.object({
    name: z.string().min(1, "Name din").max(60),
    speed: z.string().min(1, "Speed din").max(40),
    price: amount,
    validity: z.coerce.number().int().positive().max(3650).optional(),
  }),

  packageUpdate: z.object({
    name: z.string().min(1).max(60).optional(),
    speed: z.string().min(1).max(40).optional(),
    price: amount.optional(),
    validity: z.coerce.number().int().positive().max(3650).optional(),
    active: z.boolean().optional(),
  }),

  ticketCreate: z.object({
    subject: z.string().min(1, "Subject din").max(300),
    priority: z.enum(["high", "medium", "low"]).optional(),
    clientId: posInt.optional(),
  }),

  ticketUpdate: z.object({
    subject: z.string().min(1).max(300).optional(),
    priority: z.enum(["high", "medium", "low"]).optional(),
    status: z.enum(["open", "pending", "closed"]).optional(),
  }),
};

// Safe parse — fail hole { ok:false, error } (route 400 diye dey)
export function parse(schema, body) {
  const r = schema.safeParse(body ?? {});
  if (r.success) return { ok: true, data: r.data };
  return { ok: false, error: r.error.issues?.[0]?.message || "Valid input din" };
}
