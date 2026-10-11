import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2, Boxes } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

const empty = { name: "", popId: "", qty: 1, note: "" };

export default function DistributedItems() {
  const { user, notify } = useStore();
  const isAdmin = user?.role === "admin";
  const [rows, setRows] = useState([]);
  const [pops, setPops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPop, setFilterPop] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [toDelete, setToDelete] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const [it, p] = await Promise.all([api.netItems(filterPop || undefined), api.netPops()]); setRows(it); setPops(p); setErr(""); }
    catch (e) { setErr(e?.message || "Load fail"); } finally { setLoading(false); }
  }, [filterPop]);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({ ...empty, popId: pops[0]?.id || "" }); setErr(""); setEditing({}); };
  const openEdit = (it) => { setForm({ name: it.name, popId: it.popId, qty: it.qty, note: it.note }); setErr(""); setEditing(it); };
  const save = async () => { setErr(""); try { if (editing.id) await api.netUpdateItem(editing.id, form); else await api.netCreateItem(form); setEditing(null); await load(); } catch (e) { setErr(e.message); } };
  const doDelete = async () => { try { await api.netDeleteItem(toDelete.id); setToDelete(null); await load(); } catch (e) { notify(e.message); setToDelete(null); } };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Distributed Inv. Items</h2><p className="text-sm text-slate-400">Kon POP e ki equipment deploy kora ache</p></div>
        {isAdmin && <button onClick={openNew} disabled={pops.length === 0} className="btn-gold"><Plus size={16} /> Add Item</button>}
      </div>
      <Dropdown className="w-56" value={filterPop} options={pops.map((p) => ({ value: p.id, label: p.name }))} onChange={(v) => setFilterPop(v || "")} placeholder="All POP" />
      {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : rows.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><Boxes className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono distributed item nei.</p></div>
      ) : (
        <div className="card overflow-hidden"><table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
            <th className="px-5 py-3 font-semibold">Item</th><th className="px-5 py-3 font-semibold">POP</th>
            <th className="px-5 py-3 font-semibold">Qty</th><th className="px-5 py-3 font-semibold">Note</th>
            {isAdmin && <th className="px-5 py-3 text-right font-semibold">Action</th>}</tr></thead>
          <tbody>
            {rows.map((it, i) => (
              <motion.tr key={it.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="border-t border-slate-100 dark:border-white/5">
                <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{it.name}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{it.pop}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{it.qty}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{it.note || "—"}</td>
                {isAdmin && <td className="px-5 py-3"><div className="flex justify-end gap-1">
                  <button onClick={() => openEdit(it)} className="rounded-lg p-2 text-slate-400 hover:bg-gold-500/10 hover:text-gold-500"><Pencil size={15} /></button>
                  <button onClick={() => setToDelete(it)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={15} /></button>
                </div></td>}
              </motion.tr>
            ))}
          </tbody>
        </table></div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Item" : "Add Item"}
        footer={<><button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Item Name</span>
            <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Switch 24-port" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">POP</span>
              <Dropdown value={form.popId} options={pops.map((p) => ({ value: p.id, label: p.name }))} onChange={(v) => setForm({ ...form, popId: v })} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Qty</span>
              <input className={input} type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></label>
          </div>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Note</span>
            <input className={input} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
        </div>
      </Modal>
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete Item?" subtitle={toDelete?.name} size="sm"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={doDelete} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"><Trash2 size={15} /> Delete</button></>}>
        <p className="text-sm text-slate-500 dark:text-slate-300"><b className="text-slate-700 dark:text-white">{toDelete?.name}</b> delete korbo?</p>
      </Modal>
    </div>
  );
}
