import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2, Store } from "lucide-react";
import Modal from "../components/Modal";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

const empty = { name: "", phone: "", email: "", commission: "", balance: "" };

export default function MacResellers() {
  const { notify } = useStore();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [toDelete, setToDelete] = useState(null);
  const [err, setErr] = useState("");
  const [params, setParams] = useSearchParams();

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await api.crudList("mac", "resellers")); setErr(""); } catch (e) { setErr(e?.message || "Load fail"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (params.get("new")) { setForm(empty); setEditing({}); params.delete("new"); setParams(params, { replace: true }); } }, [params, setParams]);

  const openNew = () => { setForm(empty); setErr(""); setEditing({}); };
  const openEdit = (x) => { setForm({ name: x.name, phone: x.phone, email: x.email, commission: x.commission }); setErr(""); setEditing(x); };
  const save = async () => { setErr(""); try { if (editing.id) await api.crudUpdate("mac", "resellers", editing.id, form); else await api.crudCreate("mac", "resellers", form); setEditing(null); await load(); } catch (e) { setErr(e.message); } };
  const doDelete = async () => { try { await api.crudDelete("mac", "resellers", toDelete.id); setToDelete(null); await load(); } catch (e) { notify(e.message); setToDelete(null); } };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">MAC Resellers</h2><p className="text-sm text-slate-400">Prepaid reseller — balance o commission</p></div>
        <button onClick={openNew} className="btn-gold"><Plus size={16} /> Add Reseller</button>
      </div>
      {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : rows.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><Store className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono MAC reseller nei.</p></div>
      ) : (
        <div className="card overflow-hidden"><table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
            <th className="px-5 py-3 font-semibold">Name</th><th className="px-5 py-3 font-semibold">Phone</th>
            <th className="px-5 py-3 font-semibold">Balance</th><th className="px-5 py-3 font-semibold">Commission</th>
            <th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 text-right font-semibold">Action</th></tr></thead>
          <tbody>
            {rows.map((x, i) => (
              <motion.tr key={x.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="border-t border-slate-100 dark:border-white/5">
                <td className="px-5 py-3"><p className="font-medium text-slate-700 dark:text-slate-200">{x.name}</p><p className="text-xs text-slate-400">{x.email}</p></td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{x.phone || "—"}</td>
                <td className="px-5 py-3 font-semibold text-emerald-600">৳{x.balance.toLocaleString()}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{x.commission}%</td>
                <td className="px-5 py-3"><span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${x.active ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-400/10 text-slate-400"}`}>{x.active ? "Active" : "Off"}</span></td>
                <td className="px-5 py-3"><div className="flex justify-end gap-1">
                  <button onClick={() => openEdit(x)} className="rounded-lg p-2 text-slate-400 hover:bg-gold-500/10 hover:text-gold-500"><Pencil size={15} /></button>
                  <button onClick={() => setToDelete(x)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={15} /></button>
                </div></td>
              </motion.tr>
            ))}
          </tbody>
        </table></div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Reseller" : "Add MAC Reseller"} subtitle={editing?.id ? editing.name : "Notun prepaid reseller"}
        footer={<><button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {err && <p className="col-span-full rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Name</span>
            <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Phone</span>
            <input className={input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Email</span>
            <input className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Commission (%)</span>
            <input className={input} type="number" value={form.commission} onChange={(e) => setForm({ ...form, commission: e.target.value })} /></label>
          {!editing?.id && <label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Opening Balance (৳)</span>
            <input className={input} type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} placeholder="0" /></label>}
        </div>
      </Modal>
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete Reseller?" subtitle={toDelete?.name} size="sm"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={doDelete} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"><Trash2 size={15} /> Delete</button></>}>
        <p className="text-sm text-slate-500 dark:text-slate-300"><b className="text-slate-700 dark:text-white">{toDelete?.name}</b> ebong er funding history delete hobe. Nishchit?</p>
      </Modal>
    </div>
  );
}
