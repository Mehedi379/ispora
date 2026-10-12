import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";

const r = Router();
r.use(requireAuth);

// Configuration module — shob lookup table ekta-i generic CRUD diye cholbe.
// parent = ekta single relation (dropdown): SubZone->Zone, Upazila->District.
const ENTITIES = {
  zones:              { model: "zone",           title: "Zone" },
  "sub-zones":        { model: "subZone",        title: "Sub Zone",        parent: { key: "zoneId",     rel: "zone",     label: "Zone" } },
  boxes:              { model: "box",            title: "Box",             extra: ["code", "capacity"], parent: { key: "subZoneId", rel: "subZone", label: "Sub Zone" }, grand: { rel: "zone", label: "Zone" } },
  "connection-types": { model: "connectionType", title: "Connection Type", hasActive: true },
  "client-types":     { model: "clientType",     title: "Client Type" },
  "protocol-types":   { model: "protocolType",   title: "Protocol Type",   hasActive: true },
  "billing-statuses": { model: "billingStatus",  title: "Billing Status" },
  districts:          { model: "district",       title: "District" },
  upazilas:           { model: "upazila",        title: "Upazila",         parent: { key: "districtId", rel: "district", label: "District" } },
};

function cfg(req, res, next) {
  const e = ENTITIES[req.params.entity];
  if (!e) return res.status(404).json({ error: "Unknown config type" });
  req.cfg = e;
  next();
}

const clean = (v, max = 120) => (v == null ? "" : String(v).trim().slice(0, max));

// Box-er moto grandparent (SubZone->Zone) hole nested include lage
const incl = (e) => {
  if (!e.parent) return undefined;
  return e.grand ? { [e.parent.rel]: { include: { [e.grand.rel]: true } } } : { [e.parent.rel]: true };
};

const shape = (e) => (row) => {
  const out = { id: row.id, name: row.name, details: row.details || "" };
  if (e.parent) {
    out[e.parent.key] = row[e.parent.key] ?? null;
    out[e.parent.rel] = row[e.parent.rel]?.name ?? null;
  }
  if (e.grand) out[e.grand.rel] = row[e.parent.rel]?.[e.grand.rel]?.name ?? null;
  if (e.extra?.includes("code")) out.code = row.code || "";
  if (e.extra?.includes("capacity")) out.capacity = row.capacity ?? 0;
  if (e.hasActive) out.active = row.active ?? true;
  return out;
};

const buildData = (e, body) => {
  const data = {};
  if (body.name != null) data.name = clean(body.name);
  if (body.details !== undefined) data.details = clean(body.details, 300) || null;
  if (e.parent) data[e.parent.key] = body[e.parent.key] ? Number(body[e.parent.key]) : null;
  if (e.extra?.includes("code")) data.code = clean(body.code, 60) || null;
  if (e.extra?.includes("capacity")) data.capacity = Number(body.capacity) || 0;
  if (e.hasActive && body.active !== undefined) data.active = !!body.active;
  return data;
};

// List
r.get("/:entity", cfg, async (req, res) => {
  const e = req.cfg;
  const list = await prisma[e.model].findMany({
    include: incl(e),
    orderBy: { name: "asc" },
  });
  res.json(list.map(shape(e)));
});

// Create — admin only
r.post("/:entity", cfg, requireRole("admin"), async (req, res) => {
  const e = req.cfg;
  if (!clean(req.body?.name)) return res.status(400).json({ error: `${e.title} name din` });
  try {
    const row = await prisma[e.model].create({
      data: buildData(e, req.body),
      include: incl(e),
    });
    res.status(201).json(shape(e)(row));
  } catch (err) {
    res.status(400).json({ error: err.code === "P2002" ? `Ei ${e.title} age thekei ache` : "Create failed" });
  }
});

// Update — admin only (partial o cholbe, jemon shudhu active toggle)
r.put("/:entity/:id", cfg, requireRole("admin"), async (req, res) => {
  const e = req.cfg;
  try {
    const row = await prisma[e.model].update({
      where: { id: Number(req.params.id) },
      data: buildData(e, req.body),
      include: incl(e),
    });
    res.json(shape(e)(row));
  } catch (err) {
    res.status(400).json({ error: err.code === "P2002" ? `Ei ${e.title} age thekei ache` : "Update failed" });
  }
});

// Delete — admin only. FK e use thakle (jemon Zone-e client) friendly error.
r.delete("/:entity/:id", cfg, requireRole("admin"), async (req, res) => {
  const e = req.cfg;
  try {
    await prisma[e.model].delete({ where: { id: Number(req.params.id) } });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === "P2003" || err.code === "P2014")
      return res.status(400).json({ error: `Ei ${e.title} use e ache — age related data soriye nin` });
    res.status(400).json({ error: "Delete failed" });
  }
});

export default r;
