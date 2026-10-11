import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2, PackageX, RotateCcw, Boxes } from "lucide-react";
import Modal from "../components/Modal";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

const empty = { name: "", category: "", qty: 1, value: "", purchaseDate: "", note: "" };

// view: "active" | "destroyed"
export default function Assets({ view = "active" }) {
  const { notify } = useStore();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await api.assetsList(view)); setErr(""); } catch (e) { setErr(e?.message || "Load fail"); } finally { setLoading(false); }
  }, [view]);
  useEffect(() => { load(); }, [load]);

  const total = rows.reduce((s, a) => s + a.value * a.qty, 0);
  const openNew = () => { setForm(empty); setErr(""); setEditing({}); };
  const openEdit = (a) => { setForm({ name: a.name, category: a.category, qty: a.qty, value: a.value, purchaseDate: a.purchaseDate || "", note: a.note }); setErr(""); setEditing(a); };
  const save = async () => { setErr(""); try { if (editing.id) await api.assetsUpdate(editing.id, form); else await api.assetsCreate(form); setEditing(null); await load(); } catch (e) { setErr(e.message); } };
  const act = async (fn, id, ok) => { setBusy(id); try { await fn(id); await load(); if (ok) notify(ok, "success"); } catch (e) { notify(e.message); } finally { setBusy(null); } };

  const title = view === "destroyed" ? "Destroyed Items" : "Asset List";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">{title}</h2><p className="text-sm text-slate-400">{view === "destroyed" ? "Nosto/baatil asset" : "Company asset — mot value ৳" + total.toLocaleString()}</p></div>
        {view === "active" && <button onClick={openNew} className="btn-gold"><Plus size={16} /> Add Asset</button>}
      </div>
      {err && !editing && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : rows.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><Boxes className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono {title.toLowerCase()} nei.</p></div>
      ) : (
        <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
            <th className="px-5 py-3 font-semibold">Asset</th><th className="px-5 py-3 font-semibold">Category</th>
            <th className="px-5 py-3 font-semibold">Qty</th><th className="px-5 py-3 font-semibold">Value</th>
            <th className="px-5 py-3 font-semibold">Purchase</th><th className="px-5 py-3 text-right font-semibold">Action</th></tr></thead>
          <tbody>
            {rows.map((a, i) => (
              <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="border-t border-slate-100 dark:border-white/5">
                <td className="px-5 py-3"><p className="font-medium text-slate-700 dark:text-slate-200">{a.name}</p>{a.note && <p className="text-xs text-slate-400">{a.note}</p>}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{a.category || "—"}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{a.qty}</td>
                <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-200">৳{a.value.toLocaleString()}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{a.purchaseDate || "—"}</td>
                <td className="px-5 py-3"><div className="flex justify-end gap-1.5">
                  {view === "active" ? (<>
                    <button onClick={() => openEdit(a)} className="rounded-lg p-2 text-slate-400 hover:bg-gold-500/10 hover:text-gold-500"><Pencil size={15} /></button>
                    <button onClick={() => act(api.assetsDestroy, a.id, "Destroyed e sorano holo")} disabled={busy === a.id} className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-500/20 disabled:opacity-50"><PackageX size={13} /> Destroy</button>
                  </>) : (<>
                    <button onClick={() => act(api.assetsRestore, a.id, "Restore holo")} disabled={busy === a.id} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20 disabled:opacity-50">{busy === a.id ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Restore</button>
                    <button onClick={() => act(api.assetsDelete, a.id)} disabled={busy === a.id} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={14} /></button>
                  </>)}
                </div></td>
              </motion.tr>
            ))}
          </tbody>
        </table></div></div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Asset" : "Add Asset"}
        footer={<><button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {err && <p className="col-span-full rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Name</span>
            <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Category</span>
            <input className={input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Vehicle, Furniture..." /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Qty</span>
            <input className={input} type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Value (৳)</span>
            <input className={input} type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Purchase Date</span>
            <input className={input} type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} /></label>
        </div>
      </Modal>
    </div>
  );
}
