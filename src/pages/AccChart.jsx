import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2, Download } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

const TYPES = ["asset", "liability", "equity", "income", "expense"];
const typeColor = { asset: "text-sky-500 bg-sky-500/10", liability: "text-rose-500 bg-rose-500/10", equity: "text-indigo-500 bg-indigo-500/10", income: "text-emerald-500 bg-emerald-500/10", expense: "text-amber-500 bg-amber-500/10" };
const empty = { code: "", name: "", type: "asset", note: "" };

export default function AccChart() {
  const { notify } = useStore();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [toDelete, setToDelete] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await api.accAccounts()); setErr(""); } catch (e) { setErr(e?.message || "Load fail"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(empty); setErr(""); setEditing({}); };
  const openEdit = (a) => { setForm({ code: a.code, name: a.name, type: a.type, note: a.note }); setErr(""); setEditing(a); };
  const save = async () => { setErr(""); try { if (editing.id) await api.accUpdateAccount(editing.id, form); else await api.accCreateAccount(form); setEditing(null); await load(); } catch (e) { setErr(e.message); } };
  const doDelete = async () => { try { await api.accDeleteAccount(toDelete.id); setToDelete(null); await load(); } catch (e) { notify(e.message); setToDelete(null); } };
  const seed = async () => { try { await api.accSeedDefaults(); await load(); notify("Default accounts load holo", "success"); } catch (e) { notify(e.message); } };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Chart of Accounts</h2><p className="text-sm text-slate-400">Account head — double-entry er base</p></div>
        <div className="flex gap-2">
          {rows.length === 0 && <button onClick={seed} className="btn-ghost"><Download size={15} /> Load Defaults</button>}
          <button onClick={openNew} className="btn-gold"><Plus size={16} /> Add Account</button>
        </div>
      </div>
      {err && !editing && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : (
        <div className="card overflow-hidden"><table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
            <th className="px-5 py-3 font-semibold">Code</th><th className="px-5 py-3 font-semibold">Name</th>
            <th className="px-5 py-3 font-semibold">Type</th><th className="px-5 py-3 text-right font-semibold">Action</th></tr></thead>
          <tbody>
            {rows.map((a, i) => (
              <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="border-t border-slate-100 dark:border-white/5">
                <td className="px-5 py-3 font-mono text-slate-500 dark:text-slate-400">{a.code}</td>
                <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{a.name}</td>
                <td className="px-5 py-3"><span className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${typeColor[a.type]}`}>{a.type}</span></td>
                <td className="px-5 py-3"><div className="flex justify-end gap-1">
                  <button onClick={() => openEdit(a)} className="rounded-lg p-2 text-slate-400 hover:bg-gold-500/10 hover:text-gold-500"><Pencil size={15} /></button>
                  <button onClick={() => setToDelete(a)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={15} /></button>
                </div></td>
              </motion.tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="py-12 text-center text-sm text-slate-400">Kono account nei. "Load Defaults" diye standard chart boshan.</td></tr>}
          </tbody>
        </table></div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Account" : "Add Account"}
        footer={<><button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Code</span>
              <input className={input} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="1000" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Type</span>
              <Dropdown value={form.type} options={TYPES} onChange={(v) => setForm({ ...form, type: v })} /></label>
          </div>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Name</span>
            <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Cash" /></label>
        </div>
      </Modal>
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete Account?" subtitle={toDelete?.name} size="sm"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={doDelete} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"><Trash2 size={15} /> Delete</button></>}>
        <p className="text-sm text-slate-500 dark:text-slate-300"><b className="text-slate-700 dark:text-white">{toDelete?.name}</b> delete korbo?</p>
      </Modal>
    </div>
  );
}
