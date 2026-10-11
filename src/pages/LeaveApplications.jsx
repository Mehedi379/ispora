import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Check, X, Trash2, Loader2, CalendarDays } from "lucide-react";
import Modal from "../components/Modal";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";
import Dropdown from "../components/Dropdown";

const stStyle = { pending: "text-amber-500 bg-amber-500/10", approved: "text-emerald-500 bg-emerald-500/10", rejected: "text-rose-500 bg-rose-500/10" };

// view: "apply" | "approval"
export default function LeaveApplications({ view = "apply" }) {
  const { notify } = useStore();
  const [rows, setRows] = useState([]);
  const [emps, setEmps] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(view === "approval" ? "pending" : "all");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ employeeId: "", categoryId: "", fromDate: "", toDate: "", reason: "" });
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [apps, e, c] = await Promise.all([
        api.crudList("leave", "applications", filter === "all" ? {} : { status: filter }),
        api.crudList("hr", "employees", { status: "active" }).catch(() => []),
        api.crudList("leave", "categories").catch(() => []),
      ]);
      setRows(apps); setEmps(e); setCats(c); setErr("");
    } catch (er) { setErr(er?.message || "Load fail"); } finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setErr("");
    try { await api.leaveApply(form); setAdding(false); setForm({ employeeId: "", categoryId: "", fromDate: "", toDate: "", reason: "" }); await load(); }
    catch (e) { setErr(e.message); }
  };
  const act = async (fn, id, ok) => { setBusy(id); try { await fn(id); await load(); if (ok) notify(ok, "success"); } catch (e) { notify(e.message); } finally { setBusy(null); } };

  const title = view === "approval" ? "Leave Approval" : "Leave Apply";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">{title}</h2><p className="text-sm text-slate-400">{view === "approval" ? "Pending leave approve/reject korun" : "Employee leave application"}</p></div>
        {view === "apply" && <button onClick={() => { setForm({ employeeId: "", categoryId: "", fromDate: "", toDate: "", reason: "" }); setErr(""); setAdding(true); }} className="btn-gold"><Plus size={16} /> Apply Leave</button>}
      </div>
      <div className="flex gap-2">
        {["pending", "approved", "rejected", "all"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${filter === s ? "bg-gold-500/20 text-gold-500" : "text-slate-400 hover:bg-white/5"}`}>{s}</button>
        ))}
      </div>
      {err && !adding && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : rows.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><CalendarDays className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono {filter !== "all" ? filter : ""} leave nei.</p></div>
      ) : (
        <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
            <th className="px-5 py-3 font-semibold">Employee</th><th className="px-5 py-3 font-semibold">Category</th>
            <th className="px-5 py-3 font-semibold">From</th><th className="px-5 py-3 font-semibold">To</th>
            <th className="px-5 py-3 font-semibold">Days</th><th className="px-5 py-3 font-semibold">Status</th>
            <th className="px-5 py-3 text-right font-semibold">Action</th></tr></thead>
          <tbody>
            {rows.map((a, i) => (
              <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="border-t border-slate-100 dark:border-white/5">
                <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{a.employee}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{a.category}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{a.fromDate}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{a.toDate}</td>
                <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-200">{a.days}</td>
                <td className="px-5 py-3"><span className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${stStyle[a.status]}`}>{a.status}</span></td>
                <td className="px-5 py-3"><div className="flex justify-end gap-1.5">
                  {a.status === "pending" && (
                    <>
                      <button onClick={() => act(api.leaveApprove, a.id, "Approved")} disabled={busy === a.id} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20 disabled:opacity-50">{busy === a.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Approve</button>
                      <button onClick={() => act(api.leaveReject, a.id)} disabled={busy === a.id} className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-500/20 disabled:opacity-50"><X size={13} /> Reject</button>
                    </>
                  )}
                  <button onClick={() => act(api.crudDelete.bind(null, "leave", "applications"), a.id)} disabled={busy === a.id} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={14} /></button>
                </div></td>
              </motion.tr>
            ))}
          </tbody>
        </table></div></div>
      )}
      <Modal open={adding} onClose={() => setAdding(false)} title="Apply Leave" subtitle="Notun leave application"
        footer={<><button onClick={() => setAdding(false)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Submit</button></>}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {err && <p className="col-span-full rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Employee</span>
            <Dropdown value={form.employeeId} options={emps.map((e) => ({ value: e.id, label: e.name }))} onChange={(v) => setForm({ ...form, employeeId: v || "" })} placeholder="Employee" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Category</span>
            <Dropdown value={form.categoryId} options={cats.map((c) => ({ value: c.id, label: c.name }))} onChange={(v) => setForm({ ...form, categoryId: v || "" })} placeholder="Category" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">From</span>
            <input type="date" className={input} value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">To</span>
            <input type="date" className={input} value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} /></label>
          <label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Reason</span>
            <input className={input} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></label>
        </div>
      </Modal>
    </div>
  );
}
