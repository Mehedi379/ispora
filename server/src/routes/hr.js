import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { ymd } from "../dates.js";
import { getTenantId } from "../tenantContext.js";

const r = Router();
r.use(requireAuth);
r.use(requireRole("admin")); // HR & Payroll admin-only

const clean = (v, max = 120) => (v == null ? null : String(v).trim().slice(0, max) || null);
const inUseError = (res, title) => res.status(400).json({ error: `${title} use e ache — age related data soriye nin` });

// ---------- Departments ----------
r.get("/departments", async (_q, res) => {
  const list = await prisma.department.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { employees: true } } } });
  res.json(list.map((d) => ({ id: d.id, name: d.name, employees: d._count.employees })));
});
r.post("/departments", async (req, res) => {
  const name = clean(req.body?.name, 80);
  if (!name) return res.status(400).json({ error: "Department name din" });
  try { res.status(201).json(await prisma.department.create({ data: { name } })); }
  catch (e) { res.status(400).json({ error: e.code === "P2002" ? "Ei department ache" : "Create failed" }); }
});
r.put("/departments/:id", async (req, res) => {
  try { res.json(await prisma.department.update({ where: { id: Number(req.params.id) }, data: { name: clean(req.body?.name, 80) } })); }
  catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/departments/:id", async (req, res) => {
  try { await prisma.department.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); }
  catch (e) { e.code === "P2003" ? inUseError(res, "Department") : res.status(400).json({ error: "Delete failed" }); }
});

// ---------- Positions ----------
r.get("/positions", async (_q, res) => {
  const list = await prisma.position.findMany({ orderBy: { name: "asc" }, include: { department: true } });
  res.json(list.map((p) => ({ id: p.id, name: p.name, departmentId: p.departmentId, department: p.department?.name || "" })));
});
r.post("/positions", async (req, res) => {
  const name = clean(req.body?.name, 80);
  if (!name) return res.status(400).json({ error: "Position name din" });
  const data = { name, departmentId: req.body?.departmentId ? Number(req.body.departmentId) : null };
  try { const p = await prisma.position.create({ data, include: { department: true } }); res.status(201).json({ id: p.id, name: p.name, departmentId: p.departmentId, department: p.department?.name || "" }); }
  catch (e) { res.status(400).json({ error: e.code === "P2002" ? "Ei position ache" : "Create failed" }); }
});
r.put("/positions/:id", async (req, res) => {
  const data = {};
  if (req.body?.name != null) data.name = clean(req.body.name, 80);
  if (req.body?.departmentId !== undefined) data.departmentId = req.body.departmentId ? Number(req.body.departmentId) : null;
  try { const p = await prisma.position.update({ where: { id: Number(req.params.id) }, data, include: { department: true } }); res.json({ id: p.id, name: p.name, departmentId: p.departmentId, department: p.department?.name || "" }); }
  catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/positions/:id", async (req, res) => {
  try { await prisma.position.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); }
  catch (e) { e.code === "P2003" ? inUseError(res, "Position") : res.status(400).json({ error: "Delete failed" }); }
});

// ---------- Payheads (salary components) ----------
r.get("/payheads", async (_q, res) => res.json(await prisma.payhead.findMany({ orderBy: { name: "asc" } })));
r.post("/payheads", async (req, res) => {
  const name = clean(req.body?.name, 80);
  if (!name) return res.status(400).json({ error: "Payhead name din" });
  const type = req.body?.type === "deduction" ? "deduction" : "earning";
  try { res.status(201).json(await prisma.payhead.create({ data: { name, type, amount: Math.max(0, Math.round(Number(req.body?.amount) || 0)) } })); }
  catch (e) { res.status(400).json({ error: e.code === "P2002" ? "Ei payhead ache" : "Create failed" }); }
});
r.put("/payheads/:id", async (req, res) => {
  const data = {};
  if (req.body?.name != null) data.name = clean(req.body.name, 80);
  if (req.body?.type != null) data.type = req.body.type === "deduction" ? "deduction" : "earning";
  if (req.body?.amount != null) data.amount = Math.max(0, Math.round(Number(req.body.amount) || 0));
  if (req.body?.active != null) data.active = !!req.body.active;
  try { res.json(await prisma.payhead.update({ where: { id: Number(req.params.id) }, data })); }
  catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/payheads/:id", async (req, res) => {
  try { await prisma.payhead.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); }
  catch { res.status(400).json({ error: "Delete failed" }); }
});

// ---------- Resign Rules ----------
r.get("/resign-rules", async (_q, res) => res.json(await prisma.resignRule.findMany({ orderBy: { name: "asc" } })));
r.post("/resign-rules", async (req, res) => {
  const name = clean(req.body?.name, 80);
  if (!name) return res.status(400).json({ error: "Rule name din" });
  try { res.status(201).json(await prisma.resignRule.create({ data: { name, noticeDays: Number(req.body?.noticeDays) || 30, note: clean(req.body?.note, 300) } })); }
  catch (e) { res.status(400).json({ error: e.code === "P2002" ? "Ei rule ache" : "Create failed" }); }
});
r.put("/resign-rules/:id", async (req, res) => {
  const data = {};
  if (req.body?.name != null) data.name = clean(req.body.name, 80);
  if (req.body?.noticeDays != null) data.noticeDays = Number(req.body.noticeDays) || 30;
  if (req.body?.note != null) data.note = clean(req.body.note, 300);
  try { res.json(await prisma.resignRule.update({ where: { id: Number(req.params.id) }, data })); }
  catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/resign-rules/:id", async (req, res) => {
  try { await prisma.resignRule.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); }
  catch { res.status(400).json({ error: "Delete failed" }); }
});

// ---------- Employees ----------
const empShape = (e) => ({
  id: e.id, name: e.name, phone: e.phone || "", email: e.email || "", address: e.address || "", nid: e.nid || "",
  basicSalary: e.basicSalary, joinDate: ymd(e.joinDate), status: e.status,
  resignDate: e.resignDate ? ymd(e.resignDate) : null, resignReason: e.resignReason || "",
  departmentId: e.departmentId, department: e.department?.name || "",
  positionId: e.positionId, position: e.position?.name || "",
});

r.get("/employees", async (req, res) => {
  const where = {};
  if (req.query.status) where.status = String(req.query.status);
  const list = await prisma.employee.findMany({ where, include: { department: true, position: true }, orderBy: { id: "desc" } });
  res.json(list.map(empShape));
});
r.post("/employees", async (req, res) => {
  const name = clean(req.body?.name, 120);
  if (!name) return res.status(400).json({ error: "Employee name din" });
  const data = {
    name, phone: clean(req.body?.phone, 20), email: clean(req.body?.email, 120),
    address: clean(req.body?.address, 200), nid: clean(req.body?.nid, 40),
    basicSalary: Math.max(0, Math.round(Number(req.body?.basicSalary) || 0)),
    departmentId: req.body?.departmentId ? Number(req.body.departmentId) : null,
    positionId: req.body?.positionId ? Number(req.body.positionId) : null,
  };
  if (req.body?.joinDate) { const d = new Date(req.body.joinDate); if (!Number.isNaN(d.getTime())) data.joinDate = d; }
  const e = await prisma.employee.create({ data, include: { department: true, position: true } });
  res.status(201).json(empShape(e));
});
r.put("/employees/:id", async (req, res) => {
  const data = {};
  for (const k of ["name", "phone", "email", "address", "nid"]) if (req.body?.[k] != null) data[k] = clean(req.body[k], 200);
  if (req.body?.basicSalary != null) data.basicSalary = Math.max(0, Math.round(Number(req.body.basicSalary) || 0));
  if (req.body?.departmentId !== undefined) data.departmentId = req.body.departmentId ? Number(req.body.departmentId) : null;
  if (req.body?.positionId !== undefined) data.positionId = req.body.positionId ? Number(req.body.positionId) : null;
  if (req.body?.joinDate) { const d = new Date(req.body.joinDate); if (!Number.isNaN(d.getTime())) data.joinDate = d; }
  try { const e = await prisma.employee.update({ where: { id: Number(req.params.id) }, data, include: { department: true, position: true } }); res.json(empShape(e)); }
  catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/employees/:id", async (req, res) => {
  try { await prisma.employee.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); }
  catch { res.status(400).json({ error: "Delete failed" }); }
});
r.post("/employees/:id/resign", async (req, res) => {
  const e = await prisma.employee.update({
    where: { id: Number(req.params.id) },
    data: { status: "resigned", resignDate: new Date(), resignReason: clean(req.body?.reason, 300) },
    include: { department: true, position: true },
  });
  res.json(empShape(e));
});
r.post("/employees/:id/rejoin", async (req, res) => {
  const e = await prisma.employee.update({
    where: { id: Number(req.params.id) },
    data: { status: "active", resignDate: null, resignReason: null },
    include: { department: true, position: true },
  });
  res.json(empShape(e));
});

// ---------- Attendance ----------
// ?date=YYYY-MM-DD -> shob active employee + oi diner status
r.get("/attendance", async (req, res) => {
  const day = /^\d{4}-\d{2}-\d{2}$/;
  const date = day.test(String(req.query.date)) ? String(req.query.date) : ymd(new Date());
  const employees = await prisma.employee.findMany({ where: { status: "active" }, include: { department: true }, orderBy: { name: "asc" } });
  const marks = await prisma.attendance.findMany({ where: { date: new Date(`${date}T00:00:00`) } });
  const map = {}; for (const m of marks) map[m.employeeId] = m.status;
  res.json({ date, rows: employees.map((e) => ({ employeeId: e.id, name: e.name, department: e.department?.name || "", status: map[e.id] || "" })) });
});
// bulk mark: { date, records:[{employeeId,status}] }
r.post("/attendance", async (req, res) => {
  const day = /^\d{4}-\d{2}-\d{2}$/;
  if (!day.test(String(req.body?.date))) return res.status(400).json({ error: "Date YYYY-MM-DD din" });
  const date = new Date(`${req.body.date}T00:00:00`);
  const records = Array.isArray(req.body?.records) ? req.body.records : [];
  const valid = ["present", "absent", "leave", "late"];
  let saved = 0;
  const tid = getTenantId() ?? null;
  for (const rec of records) {
    if (!valid.includes(rec.status)) continue;
    await prisma.attendance.upsert({
      where: { tenantId_employeeId_date: { tenantId: tid, employeeId: Number(rec.employeeId), date } },
      update: { status: rec.status },
      create: { employeeId: Number(rec.employeeId), date, status: rec.status },
    });
    saved++;
  }
  res.json({ ok: true, saved });
});

// ---------- Payroll generate ----------
r.post("/payroll/generate", async (req, res) => {
  const month = Number(req.body?.month), year = Number(req.body?.year);
  if (!(month >= 1 && month <= 12) || !year) return res.status(400).json({ error: "Month (1-12) o year din" });
  const [employees, payheads] = await Promise.all([
    prisma.employee.findMany({ where: { status: "active" } }),
    prisma.payhead.findMany({ where: { active: true } }),
  ]);
  const earnAdd = payheads.filter((p) => p.type === "earning").reduce((s, p) => s + p.amount, 0);
  const deduct = payheads.filter((p) => p.type === "deduction").reduce((s, p) => s + p.amount, 0);
  let created = 0, skipped = 0;
  for (const e of employees) {
    const earnings = e.basicSalary + earnAdd;
    const net = Math.max(0, earnings - deduct);
    try {
      await prisma.payslip.create({ data: { employeeId: e.id, month, year, basic: e.basicSalary, earnings, deductions: deduct, net } });
      created++;
    } catch (err) { if (err.code === "P2002") skipped++; else throw err; }
  }
  res.json({ ok: true, created, skipped, month, year });
});

// ---------- Payslips ----------
const slipShape = (p) => ({
  id: p.id, employeeId: p.employeeId, employee: p.employee?.name || "",
  department: p.employee?.department?.name || "", month: p.month, year: p.year,
  basic: p.basic, earnings: p.earnings, deductions: p.deductions, net: p.net, status: p.status, note: p.note || "",
});
r.get("/payslips", async (req, res) => {
  const where = {};
  if (req.query.month) where.month = Number(req.query.month);
  if (req.query.year) where.year = Number(req.query.year);
  if (req.query.employeeId) where.employeeId = Number(req.query.employeeId);
  const list = await prisma.payslip.findMany({ where, include: { employee: { include: { department: true } } }, orderBy: { id: "desc" } });
  res.json(list.map(slipShape));
});
r.post("/payslips/:id/pay", async (req, res) => {
  try { const p = await prisma.payslip.update({ where: { id: Number(req.params.id) }, data: { status: "paid" }, include: { employee: { include: { department: true } } } }); res.json(slipShape(p)); }
  catch { res.status(400).json({ error: "Update failed" }); }
});
r.delete("/payslips/:id", async (req, res) => {
  try { await prisma.payslip.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); }
  catch { res.status(400).json({ error: "Delete failed" }); }
});

// ---------- Salary Sheet (month report) ----------
r.get("/salary-sheet", async (req, res) => {
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const year = Number(req.query.year) || new Date().getFullYear();
  const list = await prisma.payslip.findMany({ where: { month, year }, include: { employee: { include: { department: true } } }, orderBy: { employeeId: "asc" } });
  const rows = list.map(slipShape);
  res.json({
    month, year, rows,
    totals: {
      basic: rows.reduce((s, x) => s + x.basic, 0),
      earnings: rows.reduce((s, x) => s + x.earnings, 0),
      deductions: rows.reduce((s, x) => s + x.deductions, 0),
      net: rows.reduce((s, x) => s + x.net, 0),
      paid: rows.filter((x) => x.status === "paid").length,
      count: rows.length,
    },
  });
});

export default r;

