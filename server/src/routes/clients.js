import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { getEntitlements } from "../entitlements.js";
import { ymd } from "../dates.js";

const r = Router();
r.use(requireAuth);

// Frontend je shape expect kore sei shape e client ta banai
const shape = (c) => ({
  id: c.id,
  name: c.name,
  phone: c.phone,
  pppoe: c.pppoe,
  address: c.address || "",
  email: c.email || "",
  occupation: c.occupation || "",
  remarks: c.remarks || "",
  nid: c.nid || "",
  gender: c.gender || "",
  dob: c.dob ? ymd(c.dob) : null,
  fatherName: c.fatherName || "",
  motherName: c.motherName || "",
  photo: c.photo || "",
  presentAddress: c.presentAddress || "",
  permanentAddress: c.permanentAddress || "",
  district: c.district || "",
  upazila: c.upazila || "",
  roadNo: c.roadNo || "",
  houseNo: c.houseNo || "",
  mapLat: c.mapLat || "",
  mapLng: c.mapLng || "",
  facebook: c.facebook || "",
  deviceMac: c.deviceMac || "",
  referenceBy: c.referenceBy || "",
  isVip: !!c.isVip,
  monthlyBill: c.monthlyBill ?? null,
  joiningDate: c.joiningDate ? ymd(c.joiningDate) : null,
  zone: c.zone?.name || "",
  package: c.package?.name || "",
  speed: c.package?.speed || "",
  bill: c.package?.price || 0,
  status: c.status,
  online: c.online,
  due: c.due,
  expiry: c.expiry ? ymd(c.expiry) : null,
  reseller: c.reseller?.name || null,
  // Configuration relations (Phase 2)
  connectionType: c.connectionType?.name || "",
  connectionTypeId: c.connectionTypeId || null,
  clientType: c.clientType?.name || "",
  clientTypeId: c.clientTypeId || null,
  protocolType: c.protocolType?.name || "",
  protocolTypeId: c.protocolTypeId || null,
  box: c.box?.name || "",
  boxId: c.boxId || null,
  subZone: c.subZone?.name || "",
  subZoneId: c.subZoneId || null,
  leftAt: c.leftAt ? ymd(c.leftAt) : null,
});

// include block — shob relation ekbare load (duplicate kom rakhte)
const REL = { zone: true, package: true, reseller: true, connectionType: true, clientType: true, protocolType: true, box: true, subZone: true };

// reseller hole shudhu nijer clients dekhbe
const scope = (req) => (req.user.role === "reseller" ? { resellerId: req.user.id } : {});

const STATUSES = ["active", "due", "expired", "suspended"];
const clean = (v, max) => (v == null ? null : String(v).trim().slice(0, max));

async function resolveRefs(body, role = "admin") {
  const data = {};
  if (body.name != null) data.name = clean(body.name, 120);
  if (body.phone != null) data.phone = clean(body.phone, 20);
  if (body.pppoe != null) data.pppoe = clean(body.pppoe, 60);
  if (body.address != null) data.address = clean(body.address, 200);
  // Personal / contact / extra fields (sob optional)
  for (const [key, max] of [
    ["email", 120], ["occupation", 80], ["remarks", 500], ["nid", 40],
    ["fatherName", 120], ["motherName", 120], ["photo", 300],
    ["presentAddress", 300], ["permanentAddress", 300], ["district", 80], ["upazila", 80],
    ["roadNo", 60], ["houseNo", 60], ["mapLat", 40], ["mapLng", 40], ["facebook", 200],
    ["deviceMac", 60], ["referenceBy", 120],
  ]) {
    if (body[key] !== undefined) data[key] = clean(body[key], max);
  }
  if (body.gender !== undefined) data.gender = ["Male", "Female", "Other"].includes(body.gender) ? body.gender : null;
  if (body.isVip !== undefined) data.isVip = !!body.isVip;
  if (body.monthlyBill !== undefined) {
    const m = Number(body.monthlyBill);
    data.monthlyBill = Number.isFinite(m) && m >= 0 ? Math.round(m) : null;
  }
  for (const key of ["dob", "joiningDate"]) {
    if (body[key] !== undefined) {
      const d = body[key] ? new Date(body[key]) : null;
      if (d && Number.isNaN(d.getTime())) return null;
      data[key] = d;
    }
  }
  if (body.status != null && STATUSES.includes(body.status)) data.status = body.status;
  // online direct shudhu admin set korte pare — reseller toggle endpoint use korbe
  // (tarpor o expired/suspended e ON hobe na, niche guard + toggle e ache)
  if (body.online != null && role === "admin") data.online = !!body.online;
  // due shudhu admin badalay — reseller/collector due-much-korte parbe na
  if (body.due != null && role === "admin") {
    const d = Number(body.due);
    if (Number.isFinite(d) && d >= 0) data.due = d;
  }
  if (body.expiry != null) {
    const d = body.expiry ? new Date(body.expiry) : null;
    if (d && Number.isNaN(d.getTime())) return null; // signal bad input
    data.expiry = d;
  }
  // Admin client-ke reseller assign/transfer korte pare — null mane Direct (admin-er nijer)
  if (body.resellerId !== undefined) data.resellerId = body.resellerId ? Number(body.resellerId) : null;

  // Configuration FK gula (Phase 2) — id ashe form er dropdown theke, null = unset
  for (const key of ["connectionTypeId", "clientTypeId", "protocolTypeId", "boxId", "subZoneId"]) {
    if (body[key] !== undefined) data[key] = body[key] ? Number(body[key]) : null;
  }

  const zoneName = clean(body.zone, 60);
  if (zoneName) {
    // name ekhon tenant-scoped composite unique — findFirst (auto tenant-scoped) + create
    let zone = await prisma.zone.findFirst({ where: { name: zoneName } });
    if (!zone) zone = await prisma.zone.create({ data: { name: zoneName } });
    data.zoneId = zone.id;
  }
  if (body.package) {
    const pkg = await prisma.package.findFirst({ where: { name: body.package } });
    if (pkg) data.packageId = pkg.id;
  }
  // Auto-sync: package expired/suspended hole line auto OFF
  if (data.status === "expired" || data.status === "suspended") data.online = false;
  return data;
}

// List (search / zone / status filter)
r.get("/", async (req, res) => {
  const { q, zone, status } = req.query;
  // Active list = deleted-o na, left-o na
  const where = { deletedAt: null, leftAt: null, ...scope(req) };
  if (status) where.status = String(status);
  if (zone) where.zone = { name: String(zone) };
  if (q) {
    const s = String(q);
    where.OR = [
      { name: { contains: s, mode: "insensitive" } },
      { phone: { contains: s, mode: "insensitive" } },
      { pppoe: { contains: s, mode: "insensitive" } },
    ];
  }
  const clients = await prisma.client.findMany({
    where,
    include: REL,
    orderBy: { id: "desc" },
  });
  // Per-client received total + last payment date (ek groupBy — N+1 na)
  const ids = clients.map((c) => c.id);
  const pays = ids.length
    ? await prisma.payment.groupBy({ by: ["clientId"], where: { clientId: { in: ids } }, _sum: { amount: true }, _max: { paidAt: true } })
    : [];
  const pmap = {};
  for (const p of pays) pmap[p.clientId] = { received: p._sum.amount || 0, lastPayment: p._max.paidAt };
  res.json(clients.map((c) => ({
    ...shape(c),
    received: pmap[c.id]?.received || 0,
    lastPayment: pmap[c.id]?.lastPayment ? ymd(pmap[c.id].lastPayment) : null,
  })));
});

// List LEFT clients (churn) — recycle bin theke alada
r.get("/left", async (req, res) => {
  const clients = await prisma.client.findMany({
    where: { leftAt: { not: null }, deletedAt: null, ...scope(req) },
    include: REL,
    orderBy: { leftAt: "desc" },
  });
  res.json(clients.map(shape));
});

// List deleted clients (recycle bin) — admin only
r.get("/deleted", requireRole("admin"), async (req, res) => {
  const clients = await prisma.client.findMany({
    where: { deletedAt: { not: null }, ...scope(req) },
    include: REL,
    orderBy: { deletedAt: "desc" },
  });
  res.json(clients.map((c) => ({ ...shape(c), deletedAt: c.deletedAt ? ymd(c.deletedAt) : null })));
});

// Create
// Create — shudhu admin/reseller (collector = shudhu collection, likhte parbe na)
r.post("/", requireRole("admin", "reseller"), async (req, res) => {
  if (!clean(req.body?.name, 120)) return res.status(400).json({ error: "Client name din" });
  if (!clean(req.body?.pppoe, 60)) return res.status(400).json({ error: "PPPoE username din" });
  // Seat limit (SaaS plan) — tenant-er plan-er maxUsers cross korle block + upsell
  const ent = await getEntitlements(req.user.tenantId);
  if (!ent.unlimited) {
    const used = await prisma.client.count({ where: { deletedAt: null, leftAt: null } });
    if (used >= ent.maxUsers) {
      return res.status(403).json({ error: `User limit (${ent.maxUsers}) sesh — notun customer add korte plan upgrade korun`, code: "SEAT_LIMIT" });
    }
  }
  try {
    const data = await resolveRefs(req.body, req.user.role);
    if (!data) return res.status(400).json({ error: "Tottho thik na — expiry date check korun" });
    const pkg = data.packageId ? await prisma.package.findUnique({ where: { id: data.packageId } }) : null;
    if ((req.body.status === "due" || req.body.status === "expired") && data.due == null)
      data.due = pkg?.price || 0;
    if (req.user.role === "reseller") data.resellerId = req.user.id;
    const c = await prisma.client.create({
      data, include: REL,
    });
    res.status(201).json(shape(c));
  } catch (e) {
    if (e.code === "P2002") {
      // pppoe unique constraint soft-deleted row o cover kore — recycle bin-e
      // thakle bujhiye dite hobe, nahole user bujbena keno create hocche na
      const dupe = await prisma.client.findFirst({ where: { pppoe: clean(req.body?.pppoe, 60) } });
      return res.status(409).json({
        error: dupe?.deletedAt
          ? "Ei PPPoE user recycle bin-e ache — age oita restore/permanently delete korun"
          : "Ei PPPoE user age thekei ache",
      });
    }
    res.status(400).json({ error: "Create failed" });
  }
});

// Update
r.put("/:id", requireRole("admin", "reseller"), async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.client.findFirst({ where: { id, ...scope(req) } });
  if (!existing) return res.status(404).json({ error: "Client nei" });
  try {
    const data = await resolveRefs(req.body, req.user.role);
    if (!data) return res.status(400).json({ error: "Tottho thik na — expiry date check korun" });
    // Reseller onno reseller-e client transfer korte parbe na — shudhu admin pare
    if (req.user.role === "reseller") delete data.resellerId;
    // Billing bypass guard: reseller expired/suspended line ke taka charai active korte parbe na,
    // ar "suspended" admin-er manual niyom — tarpor toggle diye line ON kora jabe na
    if (req.user.role !== "admin") {
      if (data.status === "suspended") delete data.status;
      // expired/suspended client er status badle korte parbe na (due-o, nahole toggle diye bypass)
      // — renew (payment) naki admin, duitar-i poth ache
      if (["expired", "suspended"].includes(existing.status) && data.status && data.status !== existing.status) {
        return res.status(403).json({ error: "Renew (payment) korle line active hobe — reseller eta korte parbe na" });
      }
    }
    // Final status expired/suspended hole line OFF — body theke online:true dileo
    const finalStatus = data.status || existing.status;
    if (finalStatus === "expired" || finalStatus === "suspended") data.online = false;
    const c = await prisma.client.update({
      where: { id }, data, include: REL,
    });
    res.json(shape(c));
  } catch (e) {
    res.status(400).json({ error: e.code === "P2002" ? "PPPoE user duplicate" : "Update failed" });
  }
});

// Line on/off (auto connect/disconnect er base)
r.post("/:id/toggle", requireRole("admin", "reseller"), async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.client.findFirst({ where: { id, ...scope(req) } });
  if (!existing) return res.status(404).json({ error: "Client nei" });
  // Expired/suspended customer er line ON kora jabe na — age renew korte hobe
  if (!existing.online && (existing.status === "expired" || existing.status === "suspended")) {
    return res.status(400).json({ error: `Package ${existing.status} — age renew korun, tarpor line on hobe` });
  }
  const c = await prisma.client.update({
    where: { id }, data: { online: !existing.online },
    include: REL,
  });
  res.json(shape(c));
});

// Soft delete (deleted customers e thakbe)
r.delete("/:id", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  await prisma.client.update({ where: { id }, data: { deletedAt: new Date(), online: false } });
  res.json({ ok: true });
});

// Mark as LEFT (churn) — line off, status untouched; recycle bin e jay na
r.post("/:id/left", requireRole("admin", "reseller"), async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.client.findFirst({ where: { id, ...scope(req) } });
  if (!existing) return res.status(404).json({ error: "Client nei" });
  const c = await prisma.client.update({
    where: { id }, data: { leftAt: new Date(), online: false }, include: REL,
  });
  res.json(shape(c));
});

// Rejoin — left client ke abar active list e firiye ano
r.post("/:id/rejoin", requireRole("admin", "reseller"), async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.client.findFirst({ where: { id, ...scope(req) } });
  if (!existing) return res.status(404).json({ error: "Client nei" });
  const c = await prisma.client.update({ where: { id }, data: { leftAt: null }, include: REL });
  res.json(shape(c));
});

// Restore from recycle bin
r.post("/:id/restore", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  const c = await prisma.client.update({
    where: { id }, data: { deletedAt: null },
    include: REL,
  });
  res.json(shape(c));
});

// Permanent delete — database theke puro muche jay
r.delete("/:id/permanent", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.$transaction([
      prisma.payment.deleteMany({ where: { clientId: id } }),
      prisma.invoice.deleteMany({ where: { clientId: id } }),
      prisma.ticket.deleteMany({ where: { clientId: id } }),
      prisma.client.delete({ where: { id } }),
    ]);
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: "Permanent delete failed" });
  }
});

export default r;
