import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import Modal from "../components/Modal";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";
import Dropdown from "../components/Dropdown";

export default function LeaveSetup() {
  const { notify } = useStore();
  const [rows, setRows] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ categoryId: "", daysPerYear: "", note: "" });
  const [toDelete, setToDelete] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const [s, c] = await Promise.all([api.crudList("leave", "setup"), api.crudList("leave", "categories")]); setRows(s); setCats(c); setErr(""); }
    catch (e) { setErr(e?.message || "Load fail"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({ categoryId: cats[0]?.id || "", daysPerYear: "", note: "" }); setErr(""); setEditing({}); };
  const openEdit = (s) => { setForm({ categoryId: s.categoryId, daysPerYear: s.daysPerYear, note: s.note }); setErr(""); setEditing(s); };
  const save = async () => { setErr(""); try { if (editing.id) await api.crudUpdate("leave", "setup", editing.id, form); else await api.crudCreate("leave", "setup", form); setEditing(null); await load(); } catch (e) { setErr(e.message); } };
  const doDelete = async () => { try { await api.crudDelete("leave", "setup", toDelete.id); setToDelete(null); await load(); } catch (e) { notify(e.message); setToDelete(null); } };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Leave Setup</h2><p className="text-sm text-slate-400">Protyek category-r bochore koto din leave</p></div>
        <button onClick={openNew} disabled={cats.length === 0} className="btn-gold"><Plus size={16} /> Add Setup</button>
      </div>
      {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : (
        <div className="card overflow-hidden"><table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
            <th className="px-5 py-3 font-semibold">Category</th><th className="px-5 py-3 font-semibold">Days / Year</th>
            <th className="px-5 py-3 font-semibold">Note</th><th className="px-5 py-3 text-right font-semibold">Action</th></tr></thead>
          <tbody>
            {rows.map((s, i) => (
              <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.03, 0.3) }} className="border-t border-slate-100 dark:border-white/5">
                <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{s.category}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{s.daysPerYear}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{s.note || "—"}</td>
                <td className="px-5 py-3"><div className="flex justify-end gap-1">
                  <button onClick={() => openEdit(s)} className="rounded-lg p-2 text-slate-400 hover:bg-gold-500/10 hover:text-gold-500"><Pencil size={15} /></button>
                  <button onClick={() => setToDelete(s)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={15} /></button>
                </div></td>
              </motion.tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="py-12 text-center text-sm text-slate-400">Kono setup nei. {cats.length === 0 && "Age Leave Category banan."}</td></tr>}
          </tbody>
        </table></div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Setup" : "Add Leave Setup"}
        footer={<><button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Category</span>
            <Dropdown value={form.categoryId} options={cats.map((c) => ({ value: c.id, label: c.name }))} onChange={(v) => setForm({ ...form, categoryId: v })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Days per Year</span>
            <input className={input} type="number" value={form.daysPerYear} onChange={(e) => setForm({ ...form, daysPerYear: e.target.value })} placeholder="10" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Note</span>
            <input className={input} value={form.note || ""} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
        </div>
      </Modal>
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete Setup?" subtitle={toDelete?.category} size="sm"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={doDelete} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"><Trash2 size={15} /> Delete</button></>}>
        <p className="text-sm text-slate-500 dark:text-slate-300">{toDelete?.category} setup delete korbo?</p>
      </Modal>
    </div>
  );
}
