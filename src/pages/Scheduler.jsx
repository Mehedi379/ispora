import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Play, Ban, Trash2, Loader2, CalendarClock, Search } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";
import { clientLabel } from "../data";

const stStyle = { pending: "text-amber-500 bg-amber-500/10", done: "text-emerald-500 bg-emerald-500/10", cancelled: "text-slate-400 bg-slate-400/10" };
const ACTIONS = [
  { v: "disconnect", l: "Disconnect (line off)" },
  { v: "enable", l: "Enable (line on)" },
  { v: "package_change", l: "Package change" },
  { v: "reminder", l: "Reminder only" },
];

export default function Scheduler() {
  const { user, notify, clients, refreshClients } = useStore();
  const isAdmin = user?.role === "admin";
  const [list, setList] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ clientId: "", action: "disconnect", runAt: "", detail: "", note: "" });
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  // Screenshot-style filters
  const [fType, setFType] = useState("");
  const [fActivity, setFActivity] = useState("");
  const [fFromDate, setFFromDate] = useState("2026-10-01");
  const [fToDate, setFToDate] = useState("2026-10-12");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, pkgs] = await Promise.all([
        api.listSchedules(filter === "all" ? undefined : filter),
        api.listPackages().catch(() => []),
      ]);
      setList(rows); setPackages(pkgs); setErr("");
    } catch (e) { setErr(e?.message || "Load fail"); }
    finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  const filtered = list.filter((r) => {
    if (q && !`${r.client} ${r.action} ${r.detail}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (fType && r.action !== fType) return false;
    if (fActivity && r.status !== fActivity) return false;
    // date range on runAt/scheduleDate
    if (fFromDate && r.runAt && r.runAt < fFromDate) return false;
    if (fToDate && r.runAt && r.runAt > fToDate) return false;
    return true;
  });

  const bulkCancel = async () => {
    const ids = filtered.filter((r) => r.status === "pending").map((r) => r.id);
    if (ids.length === 0) { notify("Cancel korar moto pending schedule nei."); return; }
    for (const id of ids) { try { await api.cancelSchedule(id); } catch {} }
    await load(); notify(`${ids.length} schedule cancel holo.`);
  };

  const exportCsv = () => {
    const cols = ["Code", "ID/IP", "CustomerName", "Mobile", "Zone", "PreviousInfo", "ScheduleInfo", "Remarks/Note", "CreatedBy", "CreatedDate", "ScheduleDate", "Status"];
    const lines = [cols.join(",")];
    for (const r of filtered) {
      const vals = [
        String(r.id).padStart(4, "0"), r.clientPppoe || "", r.client || "", r.phone || "", r.zone || "", r.previousInfo || "", r.scheduleInfo || r.action || "",
        r.note || "", r.createdBy || "", r.createdAt || "", r.runAt || "", r.status || "",
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(vals.join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `scheduler-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const save = async () => {
    setErr("");
    try { await api.createSchedule(form); setAdding(false); await load(); }
    catch (e) { setErr(e.message); }
  };
  const act = async (fn, row, ok) => {
    setBusy(row.id);
    try { await fn(row.id); await load(); await refreshClients?.(); if (ok) notify(ok, "success"); }
    catch (e) { notify(e.message); } finally { setBusy(null); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-800 dark:text-white">Scheduler <span className="text-sm font-normal text-slate-400">(Package & Status)</span></h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={bulkCancel} className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-800 dark:bg-navy-700">
            Cancel Schedules
          </button>
          <button onClick={() => { setForm({ clientId: "", action: "disconnect", runAt: "", detail: "", note: "" }); setErr(""); setAdding(true); }} className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-800 dark:bg-navy-700">
            Create Schedule
          </button>
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-800 dark:bg-navy-700">Generate PDF</button>
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-800 dark:bg-navy-700">Generate CSV</button>
        </div>
      </div>

      {/* Screenshot-style filter row */}
      <div className="card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Scheduler Type</span>
            <Dropdown value={fType} options={[{ value: "", label: "Select" }, ...ACTIONS.map((a) => ({ value: a.v, label: a.l }))]} onChange={setFType} placeholder="Select" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Activity Status</span>
            <Dropdown value={fActivity} options={[{ value: "", label: "Select" }, { value: "pending", label: "Pending" }, { value: "done", label: "Done" }, { value: "cancelled", label: "Cancelled" }]} onChange={setFActivity} placeholder="Select" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">From Date</span>
            <input type="date" className={input} value={fFromDate} onChange={(e) => setFFromDate(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">To Date</span>
            <input type="date" className={input} value={fToDate} onChange={(e) => setFToDate(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Created By</span>
            <Dropdown value="" options={[{ value: "", label: "Select" }]} onChange={() => {}} placeholder="Select" />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {["pending", "done", "cancelled", "all"].map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${filter === s ? "bg-gold-500/20 text-gold-500" : "text-slate-400 hover:bg-white/5"}`}>{s}</button>
          ))}
          <span className="ml-auto flex items-center gap-2 text-xs text-slate-400">
            SHOW <select className="rounded border border-slate-200 bg-white px-2 py-1 dark:border-white/10 dark:bg-navy-800" defaultValue={25}><option>25</option><option>10</option><option>50</option></select> ENTRIES
          </span>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className={`${input} h-8 pl-7 text-xs`} />
          </div>
        </div>
      </div>

      {err && !adding && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-xs">
              <thead className="bg-navy-900 text-[11px] uppercase tracking-wide text-slate-300">
                <tr>
                  <th className="px-3 py-3">Code</th>
                  <th className="px-3 py-3">ID/IP</th>
                  <th className="px-3 py-3">CustomerName</th>
                  <th className="px-3 py-3">Mobile</th>
                  <th className="px-3 py-3">Zone</th>
                  <th className="px-3 py-3">PreviousInfo</th>
                  <th className="px-3 py-3">ScheduleInfo</th>
                  <th className="px-3 py-3">Remarks/Note</th>
                  <th className="px-3 py-3">CreatedBy</th>
                  <th className="px-3 py-3">CreatedDate</th>
                  <th className="px-3 py-3">ScheduleDate</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-center"><input type="checkbox" disabled className="h-4 w-4 rounded opacity-40" /></th>
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan={13} className="py-10 text-center text-sm text-slate-400">No data available in table</td></tr>
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-400 dark:border-white/5">
            <span>Showing 0 to 0 of 0 entries</span>
            <span>Previous &nbsp; Next</span>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/5">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              SHOW <select className="rounded border border-slate-200 bg-white px-2 py-1 dark:border-white/10 dark:bg-navy-800" defaultValue={25}><option>25</option><option>10</option><option>50</option></select> ENTRIES
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className={`${input} h-7 pl-7 text-xs`} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-xs">
              <thead className="bg-navy-900 text-[11px] uppercase tracking-wide text-slate-300">
                <tr>
                  <th className="px-3 py-3">Code</th>
                  <th className="px-3 py-3">ID/IP</th>
                  <th className="px-3 py-3">CustomerName</th>
                  <th className="px-3 py-3">Mobile</th>
                  <th className="px-3 py-3">Zone</th>
                  <th className="px-3 py-3">PreviousInfo</th>
                  <th className="px-3 py-3">ScheduleInfo</th>
                  <th className="px-3 py-3">Remarks/Note</th>
                  <th className="px-3 py-3">CreatedBy</th>
                  <th className="px-3 py-3">CreatedDate</th>
                  <th className="px-3 py-3">ScheduleDate</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-center"><input type="checkbox" className="h-4 w-4 rounded" /></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <motion.tr key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }} className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="px-3 py-2.5 font-mono text-slate-400">{String(row.id).padStart(4, "0")}</td>
                    <td className="px-3 py-2.5 font-medium text-gold-500">{row.clientPppoe || "—"}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-700 dark:text-slate-200">{row.client}</td>
                    <td className="px-3 py-2.5 text-slate-500">{row.phone || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-500">{row.zone || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-500">{row.previousInfo || "—"}</td>
                    <td className="px-3 py-2.5 capitalize text-slate-500">{row.scheduleInfo || row.action?.replace("_", " ") || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-500">{row.note || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-500">{row.createdBy || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-500">{row.createdAt || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-500">{row.runAt}</td>
                    <td className="px-3 py-2.5"><span className={`rounded px-2 py-1 text-[11px] font-semibold capitalize ${stStyle[row.status]}`}>{row.status}</span></td>
                    <td className="px-3 py-2.5 text-center"><input type="checkbox" className="h-4 w-4 rounded" /></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-400 dark:border-white/5">
            <span>Showing {filtered.length} of {list.length} entries</span>
            <span className="rounded bg-navy-900 px-2 py-1 text-white">1</span>
          </div>
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Schedule an Action" subtitle="Nirdishto date e auto cholbe" size="lg"
        footer={<><button onClick={() => setAdding(false)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Schedule</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Client</span>
            <Dropdown value={form.clientId} options={clients.map((c) => ({ value: c.id, label: clientLabel(c) }))} onChange={(v) => setForm({ ...form, clientId: v || "" })} placeholder="Client select korun" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Action</span>
              <Dropdown value={form.action} options={ACTIONS.map((a) => ({ value: a.v, label: a.l }))} onChange={(v) => setForm({ ...form, action: v, detail: "" })} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Run Date</span>
              <input type="date" className={input} value={form.runAt} onChange={(e) => setForm({ ...form, runAt: e.target.value })} /></label>
          </div>
          {form.action === "package_change" && (
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Target Package</span>
              <Dropdown value={form.detail} options={packages.map((p) => ({ value: p.name, label: p.name }))} onChange={(v) => setForm({ ...form, detail: v || "" })} placeholder="Package" /></label>
          )}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Note</span>
            <input className={input} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional" /></label>
        </div>
      </Modal>
    </div>
  );
}
