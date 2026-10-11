import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Play, Ban, Trash2, Loader2, CalendarClock } from "lucide-react";
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
  const [filter, setFilter] = useState("pending");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ clientId: "", action: "disconnect", runAt: "", detail: "", note: "" });
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");

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
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Scheduler</h2>
          <p className="text-sm text-slate-400">Bhobisshoter date e auto action (disconnect / enable / package change / reminder)</p>
        </div>
        <button onClick={() => { setForm({ clientId: "", action: "disconnect", runAt: "", detail: "", note: "" }); setErr(""); setAdding(true); }} className="btn-gold"><Plus size={16} /> Schedule Action</button>
      </div>

      <div className="flex gap-2">
        {["pending", "done", "cancelled", "all"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${filter === s ? "bg-gold-500/20 text-gold-500" : "text-slate-400 hover:bg-white/5"}`}>{s}</button>
        ))}
      </div>

      {err && !adding && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>
      ) : list.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center">
          <CalendarClock className="text-slate-300 dark:text-white/20" size={40} />
          <p className="mt-3 text-sm text-slate-400">Kono {filter !== "all" ? filter : ""} schedule nei.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Client</th>
                  <th className="px-5 py-3 font-semibold">Action</th>
                  <th className="px-5 py-3 font-semibold">Detail</th>
                  <th className="px-5 py-3 font-semibold">Run At</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row, i) => (
                  <motion.tr key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-t border-slate-100 dark:border-white/5">
                    <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{row.client}</td>
                    <td className="px-5 py-3 capitalize text-slate-500 dark:text-slate-400">{row.action.replace("_", " ")}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{row.detail || "—"}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{row.runAt}</td>
                    <td className="px-5 py-3"><span className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${stStyle[row.status]}`}>{row.status}</span></td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        {isAdmin && row.status === "pending" && (
                          <>
                            <button onClick={() => act(api.runSchedule, row, "Action cholano holo")} disabled={busy === row.id} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20 disabled:opacity-50">{busy === row.id ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />} Run now</button>
                            <button onClick={() => act(api.cancelSchedule, row)} disabled={busy === row.id} className="inline-flex items-center gap-1 rounded-lg bg-slate-400/10 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-400/20 disabled:opacity-50"><Ban size={13} /> Cancel</button>
                          </>
                        )}
                        {isAdmin && <button onClick={() => act(api.deleteSchedule, row)} disabled={busy === row.id} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Schedule an Action" subtitle="Nirdishto date e auto cholbe"
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
