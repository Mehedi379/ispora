import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Download, Send, Search, Pencil, Loader2, Plus } from "lucide-react";
import Dropdown from "../components/Dropdown";
import Modal from "../components/Modal";
import { statusStyle, BRAND, clientLabel } from "../data";
import { api } from "../api";
import { useStore } from "../store";

import { input } from "../ui";

// Ekta invoice-er proper printable document (notun window) — normal ISP invoice layout, Save as PDF
function printInvoice(inv) {
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const statusColor = { paid: "#10b981", unpaid: "#ef4444", partial: "#f59e0b" }[inv.status] || "#64748b";
  const prevDue = Math.max(0, (inv.outstanding || 0) - (inv.amount || 0)); // age-r bokeya (ei bill bade)
  const totalPayable = (inv.amount || 0) + prevDue;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(inv.id)}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif}
    body{color:#1e293b;padding:40px;max-width:800px;margin:0 auto}
    .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0f1f3d;padding-bottom:20px}
    .brand{font-size:28px;font-weight:800;color:#0f1f3d}
    .brand span{color:#c99a2e}
    .tag{font-size:12px;color:#64748b;margin-top:2px}
    .inv-no{text-align:right}
    .inv-no h2{font-size:22px;color:#c99a2e;letter-spacing:1px}
    .inv-no .period{font-size:13px;color:#64748b;margin-top:4px}
    .badge{display:inline-block;margin-top:6px;padding:4px 14px;border-radius:8px;color:#fff;font-size:12px;font-weight:700;text-transform:uppercase;background:${statusColor}}
    .meta{display:flex;justify-content:space-between;margin-top:28px;font-size:14px;gap:30px}
    .meta .col{flex:1}
    .meta .label{color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
    .meta .line{margin-bottom:10px}
    .meta b{font-size:14px}
    table{width:100%;border-collapse:collapse;margin-top:30px}
    th{background:#0f1f3d;color:#fff;text-align:left;padding:12px 14px;font-size:12px;text-transform:uppercase}
    td{padding:14px;border-bottom:1px solid #e2e8f0;font-size:14px}
    .right{text-align:right}
    .total{margin-top:20px;display:flex;justify-content:flex-end}
    .total .box{width:280px}
    .total .row{display:flex;justify-content:space-between;padding:7px 0;font-size:14px;color:#475569}
    .total .grand{border-top:2px solid #0f1f3d;margin-top:6px;padding-top:12px;font-size:20px;font-weight:800;color:#0f1f3d}
    .note{margin-top:28px;padding:14px;background:#f8fafc;border-left:3px solid #c99a2e;font-size:13px;color:#475569}
    .foot{margin-top:46px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:16px}
  </style></head><body onload="window.print()">
    <div class="top">
      <div><div class="brand">${esc(BRAND.name)}<span>.</span></div><div class="tag">${esc(BRAND.tagline)}</div></div>
      <div class="inv-no"><h2>${esc(inv.id)}</h2><div class="period">Bill Period: ${esc(inv.period || "")}</div><span class="badge">${esc(inv.status)}</span></div>
    </div>
    <div class="meta">
      <div class="col">
        <div class="label">Billed To</div>
        <div class="line"><b>${esc(inv.client)}</b></div>
        ${inv.pppoe ? `<div class="line"><span class="label">User ID</span>${esc(inv.pppoe)}</div>` : ""}
        ${inv.phone ? `<div class="line"><span class="label">Phone</span>${esc(inv.phone)}</div>` : ""}
        ${inv.address || inv.zone ? `<div class="line"><span class="label">Address</span>${esc([inv.address, inv.zone].filter(Boolean).join(", "))}</div>` : ""}
      </div>
      <div class="col right">
        <div class="line"><div class="label">Issue Date</div><b>${esc(inv.date)}</b></div>
        ${inv.due ? `<div class="line"><div class="label">Due Date</div><b>${esc(inv.due)}</b></div>` : ""}
        ${inv.package ? `<div class="line"><div class="label">Package</div><b>${esc(inv.package)}${inv.speed ? ` · ${esc(inv.speed)}` : ""}</b></div>` : ""}
      </div>
    </div>
    <table>
      <thead><tr><th>Description</th><th class="right">Amount</th></tr></thead>
      <tbody>
        <tr><td>Internet Service — ${esc(inv.package || "Monthly Bill")}${inv.speed ? ` (${esc(inv.speed)})` : ""} · ${esc(inv.period || "")}</td><td class="right">৳ ${esc(inv.amount)}</td></tr>
        ${prevDue > 0 ? `<tr><td>Previous Due (arrears)</td><td class="right">৳ ${esc(prevDue)}</td></tr>` : ""}
      </tbody>
    </table>
    <div class="total"><div class="box">
      <div class="row"><span>Current Bill</span><span>৳ ${esc(inv.amount)}</span></div>
      ${prevDue > 0 ? `<div class="row"><span>Previous Due</span><span>৳ ${esc(prevDue)}</span></div>` : ""}
      <div class="row grand"><span>Total Payable</span><span>৳ ${esc(totalPayable)}</span></div>
    </div></div>
    ${inv.note ? `<div class="note"><b>Note:</b> ${esc(inv.note)}</div>` : ""}
    <div class="foot">${esc(BRAND.name)} — ${esc(BRAND.tagline)} · This is a computer-generated invoice.</div>
  </body></html>`;
  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

// Filtered invoice gulo CSV te export
function exportCSV(rows) {
  const head = ["Invoice", "Client", "Zone", "Date", "Due", "Amount", "Status", "Note"];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [head.join(",")].concat(
    rows.map((r) => [r.id, r.client, r.zone, r.date, r.due || "", r.amount, r.status, r.note || ""].map(esc).join(","))
  );
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// BD phone ke international (880...) format e ani wa.me er jonno
function waNumber(phone) {
  const d = String(phone || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("880")) return d;
  if (d.startsWith("0")) return "88" + d;      // 01810... -> 8801810...
  if (d.length === 10) return "880" + d;        // 1810... -> 8801810...
  return d;
}

export default function Invoices() {
  const { notify, user } = useStore();
  // Backend-e collector invoice create/edit/delete korte pare na (role gate) —
  // UI-teo dekhalei 403 toast ashto
  const canWrite = user?.role === "admin" || user?.role === "reseller";
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zone, setZone] = useState("All Zones");
  const [status, setStatus] = useState("All Status");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ amount: "", status: "unpaid", note: "" });
  const [creating, setCreating] = useState(false);
  const [clients, setClients] = useState([]);
  const [cForm, setCForm] = useState({ clientId: null, amount: "", dueDate: "", note: "" });
  const [cErr, setCErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadErr, setLoadErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setInvoices(await api.listInvoices());
      setLoadErr("");
    } catch (e) {
      // Age catch chilona → load fail hole "0 invoice" dekhay, bhul bujhato
      setLoadErr(e?.message || "Invoice load fail holo");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  // Create Invoice modal khullei client list ani (dropdown er jonno)
  const openCreate = async () => {
    setCErr(""); setCForm({ clientId: null, amount: "", dueDate: "", note: "" }); setCreating(true);
    try {
      const list = await api.listClients();
      setClients(list);
    } catch (e) { setCErr(e?.message || "Client list ana jayni"); }
  };

  const createInvoice = async () => {
    setCErr("");
    const c = clients.find((x) => x.id === cForm.clientId);
    if (!c) { setCErr("Client select korun"); return; }
    if (!cForm.amount || Number(cForm.amount) <= 0) { setCErr("Thik amount din"); return; }
    setSaving(true);
    try {
      await api.createInvoice({
        clientId: c.id,
        amount: Number(cForm.amount),
        dueDate: cForm.dueDate || undefined,
        note: cForm.note || undefined,
      });
      setCreating(false);
      await load();
    } catch (e) { setCErr(e.message); } finally { setSaving(false); }
  };

  // client select korle oi client er package price auto bHorai (id diye select — duplicate naamio bhul hoy na)
  const pickClient = (label) => {
    const c = clients.find((x) => clientLabel(x) === label);
    setCForm((f) => ({ ...f, clientId: c?.id ?? null, amount: c?.bill ? String(c.bill) : f.amount }));
  };

  const pickedClient = clients.find((x) => x.id === cForm.clientId) || null;

  // Zone list dynamic — notun zone client create korlei dropdown e ashbe
  const zoneOptions = useMemo(
    () => ["All Zones", ...Array.from(new Set(invoices.map((i) => i.zone).filter(Boolean)))],
    [invoices]
  );

  const rows = useMemo(() => invoices.filter((inv) => {
    if (zone !== "All Zones" && inv.zone !== zone) return false;
    if (status !== "All Status" && inv.status !== status.toLowerCase()) return false;
    if (q && !inv.client.toLowerCase().includes(q.toLowerCase()) && !String(inv.id).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [invoices, zone, status, q]);

  const openEdit = (inv) => { setForm({ amount: inv.amount, status: inv.status, note: inv.note || "" }); setEditing(inv); };
  const save = async () => {
    try {
      await api.updateInvoice(editing._id, { amount: Number(form.amount), status: form.status, note: form.note });
      setEditing(null);
      await load();
    } catch (e) { notify(e?.message || "Invoice update fail holo"); }
  };

  const waText = (inv) => encodeURIComponent(`Priyo ${inv.client}, apnar invoice ${inv.id} — bill ৳${inv.amount} (${inv.status}). Dhonnobad. — ISPora`);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Invoices</h2>
          <p className="text-sm text-slate-400">{rows.length} invoice</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportCSV(rows)} className="btn-ghost"><Download size={16} /> Export</button>
          {canWrite && <button onClick={openCreate} className="btn-gold"><Plus size={16} /> New Invoice</button>}
        </div>
      </div>

      {loadErr && (
        <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{loadErr}</p>
      )}

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Invoice / client..."
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-navy-800 py-2.5 pl-10 pr-4 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-gold-400" />
          </div>
          <Dropdown value={zone} options={zoneOptions} onChange={setZone} className="w-40" />
          <Dropdown value={status} options={["All Status", "Paid", "Unpaid", "Partial"]} onChange={setStatus} className="w-40" />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="animate-spin text-gold-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-5 py-3">Invoice</th><th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Period</th><th className="px-5 py-3">Issue Date</th>
                  <th className="px-5 py-3">Due Date</th><th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((inv, i) => (
                  <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{inv.id}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {inv.client}
                      {inv.zone && <span className="block text-xs text-slate-400">{inv.zone}</span>}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{inv.period}</td>
                    <td className="px-5 py-3 text-slate-500">{inv.date}</td>
                    <td className="px-5 py-3 text-slate-500">{inv.due || "—"}</td>
                    <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-200">৳ {inv.amount}</td>
                    <td className="px-5 py-3"><span className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle[inv.status]}`}>{inv.status}</span></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {canWrite && (
                          <button onClick={() => openEdit(inv)} title="Edit" className="rounded-lg p-2 text-slate-400 hover:bg-gold-500/10 hover:text-gold-500"><Pencil size={15} /></button>
                        )}
                        <a href={`https://wa.me/${waNumber(inv.phone)}?text=${waText(inv)}`} target="_blank" rel="noreferrer" title="WhatsApp" className="rounded-lg p-2 text-emerald-500 hover:bg-emerald-500/10"><Send size={15} /></a>
                        <button onClick={() => printInvoice(inv)} title="Download / Print" className="rounded-lg p-2 text-slate-400 hover:bg-gold-500/10 hover:text-gold-500"><Download size={15} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-sm text-slate-400">Kono invoice nei.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Invoice" subtitle={editing?.id}
        footer={<><button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save Changes</button></>}>
        <div className="space-y-4">
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Amount (৳)</span>
            <input className={input} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Status</span>
            <Dropdown value={form.status} options={["unpaid", "partial", "paid"]} onChange={(v) => setForm({ ...form, status: v })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Note</span>
            <input className={input} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional" /></label>
        </div>
      </Modal>

      <Modal open={creating} onClose={() => setCreating(false)} title="New Invoice" subtitle="Manual bill toiri korun"
        footer={<><button onClick={() => setCreating(false)} className="btn-ghost">Cancel</button>
          <button onClick={createInvoice} disabled={saving} className="btn-gold">{saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Create</button></>}>
        <div className="space-y-4">
          {cErr && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{cErr}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Client</span>
            <Dropdown value={pickedClient ? clientLabel(pickedClient) : "Client select korun"} options={clients.map(clientLabel)} onChange={pickClient} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Amount (৳)</span>
            <input className={input} type="number" value={cForm.amount} onChange={(e) => setCForm({ ...cForm, amount: e.target.value })} placeholder="e.g. 800" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Due Date <span className="text-slate-500 normal-case">(khali rakhle +5 din)</span></span>
            <input className={input} type="date" value={cForm.dueDate} onChange={(e) => setCForm({ ...cForm, dueDate: e.target.value })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Note</span>
            <input className={input} value={cForm.note} onChange={(e) => setCForm({ ...cForm, note: e.target.value })} placeholder="Optional" /></label>
        </div>
      </Modal>
    </div>
  );
}
