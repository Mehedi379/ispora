import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Pencil, Trash2, Plus, Loader2, Layers, Check, X } from "lucide-react";
import Modal from "../components/Modal";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

// Platform Owner — pricing tier (plan) control. Jemon "400 user = ৳1000".
// maxUsers 0 = unlimited. features: "*" = sob, ba "sms,hr,accounting" comma list.
export default function PlatformPlans() {
  const { notify } = useStore();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [toDelete, setToDelete] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await api.platformPlans()); } catch (e) { notify(e.message); } finally { setLoading(false); }
  }, [notify]);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({ name: "", priceMonthly: 1000, maxUsers: 400, features: "*", active: true, sortOrder: 0 }); setErr(""); setEditing({}); };
  const openEdit = (p) => { setForm({ ...p }); setErr(""); setEditing(p); };

  const save = async () => {
    if (!form.name?.trim()) { setErr("Plan name din"); return; }
    setBusy(true); setErr("");
    try {
      if (editing.id) await api.platformUpdatePlan(editing.id, form);
      else await api.platformCreatePlan(form);
      setEditing(null); await load();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const doDelete = async () => {
    try { const r = await api.platformDeletePlan(toDelete.id); if (r.note) notify(r.note, "success"); setToDelete(null); await load(); }
    catch (e) { notify(e.message); setToDelete(null); }
  };
  // On/Off toggle — On hole signup/pay-e sobar kase show, Off hole hide
  const toggleActive = async (p) => {
    try { await api.platformUpdatePlan(p.id, { active: !p.active }); notify(p.active ? "Plan hide holo" : "Plan show holo", "success"); await load(); }
    catch (e) { notify(e.message); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><Layers size={22} className="text-gold-500" /> Plans &amp; Pricing</h2>
          <p className="text-sm text-slate-400">Nijer pricing tier control korun — koto user-e koto taka. maxUsers 0 = unlimited.</p>
        </div>
        <button onClick={openNew} className="btn-gold"><Plus size={16} /> Add Plan</button>
      </div>

      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy-900 text-[11px] uppercase tracking-wide text-slate-300">
                <tr>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3 text-right">Price / mo</th>
                  <th className="px-5 py-3 text-right">Max Users</th>
                  <th className="px-5 py-3">Features</th>
                  <th className="px-5 py-3 text-center">Active</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p, i) => (
                  <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.03, 0.3) }} className="border-t border-slate-100 dark:border-white/5">
                    <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{p.name}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gold-500">৳{p.priceMonthly.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">{p.maxUsers === 0 ? "Unlimited" : p.maxUsers.toLocaleString()}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{p.features === "*" ? "All features" : (p.features || "—")}</td>
                    <td className="px-5 py-3 text-center">
                      <button onClick={() => toggleActive(p)} title={p.active ? "On — sobar kase show. Off korte click." : "Off — hidden. On korte click."}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${p.active ? "bg-emerald-500" : "bg-slate-400/40"}`}>
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${p.active ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                      <div className={`mt-0.5 text-[10px] font-semibold ${p.active ? "text-emerald-500" : "text-slate-400"}`}>{p.active ? "On" : "Off"}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="rounded-lg p-2 text-slate-400 hover:bg-gold-500/10 hover:text-gold-500"><Pencil size={15} /></button>
                        <button onClick={() => setToDelete(p)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-sm text-slate-400">Kono plan nei — "Add Plan" diye toiri korun.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Plan" : "Add Plan"} subtitle={editing?.id ? editing.name : "Notun pricing tier"}
        footer={<><button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button onClick={save} disabled={busy} className="btn-gold">{busy ? <Loader2 size={15} className="animate-spin" /> : null} Save</button></>}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {err && <p className="sm:col-span-2 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Plan Name</span>
            <input className={input} value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. 400 Users" autoFocus /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Price / month (৳)</span>
            <input className={input} type="number" value={form.priceMonthly ?? 0} onChange={(e) => setForm({ ...form, priceMonthly: e.target.value })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Max Users (0 = unlimited)</span>
            <input className={input} type="number" value={form.maxUsers ?? 0} onChange={(e) => setForm({ ...form, maxUsers: e.target.value })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Sort Order</span>
            <input className={input} type="number" value={form.sortOrder ?? 0} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></label>
          <label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Features ("*" = all, ba comma list)</span>
            <input className={input} value={form.features ?? ""} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="* ba sms,hr,accounting" /></label>
          <label className="flex items-center gap-2 sm:col-span-2 text-sm text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={form.active !== false} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active (signup-e dekhabe)
          </label>
        </div>
      </Modal>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete Plan?" subtitle={toDelete?.name} size="sm"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={doDelete} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"><Trash2 size={15} /> Delete</button></>}>
        <p className="text-sm text-slate-500 dark:text-slate-300"><b className="text-slate-700 dark:text-white">{toDelete?.name}</b> delete korbo? (Tenant use korle inactive hobe)</p>
      </Modal>
    </div>
  );
}
