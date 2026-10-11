import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2, UserMinus, RotateCcw, Search } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

// view: "list" | "resignation" | "rejoin"
export default function HrEmployees({ view = "list" }) {
  const { notify } = useStore();
  const [rows, setRows] = useState([]);
  const [depts, setDepts] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [toDelete, setToDelete] = useState(null);
  const [resignTarget, setResignTarget] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");
  const [params, setParams] = useSearchParams();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const statusFilter = view === "rejoin" ? "resigned" : view === "resignation" ? undefined : undefined;
      const [emps, d, p] = await Promise.all([
        api.hrList("employees", statusFilter ? { status: statusFilter } : {}),
        api.hrList("departments").catch(() => []),
        api.hrList("positions").catch(() => []),
      ]);
      setRows(emps); setDepts(d); setPositions(p); setErr("");
    } catch (e) { setErr(e?.message || "Load fail"); }
    finally { setLoading(false); }
  }, [view]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (params.get("new") && view === "list") { setForm({}); setEditing({}); params.delete("new"); setParams(params, { replace: true }); }
  }, [params, view, setParams]);

  const openNew = () => { setForm({}); setErr(""); setEditing({}); };
  const openEdit = (e) => { setForm({ name: e.name, phone: e.phone, email: e.email, address: e.address, nid: e.nid, basicSalary: e.basicSalary, departmentId: e.departmentId || "", positionId: e.positionId || "", joinDate: e.joinDate }); setErr(""); setEditing(e); };
  const save = async () => {
    setErr("");
    try { if (editing.id) await api.hrUpdate("employees", editing.id, form); else await api.hrCreate("employees", form); setEditing(null); await load(); }
    catch (e) { setErr(e.message); }
  };
  const doResign = async () => {
    setBusy(resignTarget.id);
    try { await api.hrResign(resignTarget.id, reason); setResignTarget(null); setReason(""); await load(); notify("Employee resigned", "success"); }
    catch (e) { notify(e.message); } finally { setBusy(null); }
  };
  const rejoin = async (e) => {
    setBusy(e.id);
    try { await api.hrRejoin(e.id); await load(); notify("Employee rejoined", "success"); }
    catch (er) { notify(er.message); } finally { setBusy(null); }
  };
  const doDelete = async () => {
    try { await api.hrDelete("employees", toDelete.id); setToDelete(null); await load(); }
    catch (e) { notify(e.message); setToDelete(null); }
  };

  const base = view === "rejoin" ? rows.filter((e) => e.status === "resigned")
    : view === "resignation" ? rows.filter((e) => e.status === "active")
    : rows;
  const filtered = base.filter((e) => !q || `${e.name} ${e.phone} ${e.department} ${e.position}`.toLowerCase().includes(q.toLowerCase()));
  const title = view === "resignation" ? "Resignation" : view === "rejoin" ? "Rejoin" : "Employees";
  const sub = view === "resignation" ? "Active employee resign koran" : view === "rejoin" ? "Resigned employee abar rejoin koran" : "Shob employee";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">{title}</h2><p className="text-sm text-slate-400">{sub}</p></div>
        {view === "list" && <button onClick={openNew} className="btn-gold"><Plus size={16} /> Add Employee</button>}
      </div>
      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className={`${input} pl-9`} placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {err && !editing && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : (
        <div className="card overflow-hidden"><div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
              <th className="px-5 py-3 font-semibold">Name</th><th className="px-5 py-3 font-semibold">Department</th>
              <th className="px-5 py-3 font-semibold">Position</th><th className="px-5 py-3 font-semibold">Basic</th>
              <th className="px-5 py-3 font-semibold">Join</th><th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 text-right font-semibold">Action</th></tr></thead>
            <tbody>
              {filtered.map((e, i) => (
                <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="border-t border-slate-100 dark:border-white/5">
                  <td className="px-5 py-3"><p className="font-medium text-slate-700 dark:text-slate-200">{e.name}</p><p className="text-xs text-slate-400">{e.phone}</p></td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{e.department || "—"}</td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{e.position || "—"}</td>
                  <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-200">৳{e.basicSalary}</td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{e.joinDate}</td>
                  <td className="px-5 py-3"><span className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${e.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-400/10 text-slate-400"}`}>{e.status}</span></td>
                  <td className="px-5 py-3"><div className="flex justify-end gap-1.5">
                    {view === "rejoin" ? (
                      <button onClick={() => rejoin(e)} disabled={busy === e.id} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20 disabled:opacity-50">{busy === e.id ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Rejoin</button>
                    ) : view === "resignation" ? (
                      <button onClick={() => { setResignTarget(e); setReason(""); }} className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-500/20"><UserMinus size={13} /> Resign</button>
                    ) : (
                      <>
                        <button onClick={() => openEdit(e)} className="rounded-lg p-2 text-slate-400 hover:bg-gold-500/10 hover:text-gold-500"><Pencil size={15} /></button>
                        <button onClick={() => setToDelete(e)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={15} /></button>
                      </>
                    )}
                  </div></td>
                </motion.tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-400">Kono employee nei.</td></tr>}
            </tbody>
          </table>
        </div></div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Employee" : "Add Employee"} subtitle={editing?.id ? editing.name : "Notun employee"} size="lg"
        footer={<><button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {err && <p className="col-span-full rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          {[["name", "Full Name"], ["phone", "Phone"], ["email", "Email"], ["nid", "NID"]].map(([k, l]) => (
            <label key={k} className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">{l}</span>
              <input className={input} value={form[k] || ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></label>
          ))}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Department</span>
            <Dropdown value={form.departmentId || ""} options={depts.map((d) => ({ value: d.id, label: d.name }))} onChange={(v) => setForm({ ...form, departmentId: v || "" })} placeholder="Department" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Position</span>
            <Dropdown value={form.positionId || ""} options={positions.map((p) => ({ value: p.id, label: p.name }))} onChange={(v) => setForm({ ...form, positionId: v || "" })} placeholder="Position" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Basic Salary (৳)</span>
            <input className={input} type="number" value={form.basicSalary ?? ""} onChange={(e) => setForm({ ...form, basicSalary: e.target.value })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Join Date</span>
            <input className={input} type="date" value={form.joinDate || ""} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} /></label>
          <label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Address</span>
            <input className={input} value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
        </div>
      </Modal>

      <Modal open={!!resignTarget} onClose={() => setResignTarget(null)} title="Resign Employee?" subtitle={resignTarget?.name} size="sm"
        footer={<><button onClick={() => setResignTarget(null)} className="btn-ghost">Cancel</button><button onClick={doResign} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"><UserMinus size={15} /> Resign</button></>}>
        <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Reason</span>
          <input className={input} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" /></label>
      </Modal>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete Employee?" subtitle={toDelete?.name} size="sm"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={doDelete} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"><Trash2 size={15} /> Delete</button></>}>
        <p className="text-sm text-slate-500 dark:text-slate-300"><b className="text-slate-700 dark:text-white">{toDelete?.name}</b> ebong er attendance/payslip delete hobe. Nishchit?</p>
      </Modal>
    </div>
  );
}
