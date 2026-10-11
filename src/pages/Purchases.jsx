import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2, ShoppingCart } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

const empty = { vendorId: "", item: "", qty: 1, unitPrice: "", note: "" };

export default function Purchases() {
  const { notify } = useStore();
  const [rows, setRows] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(empty);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const [p, v] = await Promise.all([api.crudList("purchase", "purchases"), api.crudList("purchase", "vendors")]); setRows(p); setVendors(v); setErr(""); }
    catch (e) { setErr(e?.message || "Load fail"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const total = rows.reduce((s, p) => s + p.total, 0);
  const openNew = () => { setForm({ ...empty, vendorId: vendors[0]?.id || "" }); setErr(""); setAdding(true); };
  const save = async () => { setErr(""); try { await api.crudCreate("purchase", "purchases", form); setAdding(false); await load(); } catch (e) { setErr(e.message); } };
  const del = async (p) => { try { await api.crudDelete("purchase", "purchases", p.id); await load(); } catch (e) { notify(e.message); } };
  const liveTotal = (Number(form.qty) || 0) * (Number(form.unitPrice) || 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Purchase</h2><p className="text-sm text-slate-400">Procurement log — mot <b className="text-gold-500">৳{total.toLocaleString()}</b></p></div>
        <button onClick={openNew} disabled={vendors.length === 0} className="btn-gold"><Plus size={16} /> Add Purchase</button>
      </div>
      {err && !adding && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : rows.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><ShoppingCart className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono purchase nei. {vendors.length === 0 && "Age Vendor banan."}</p></div>
      ) : (
        <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
            <th className="px-5 py-3 font-semibold">Item</th><th className="px-5 py-3 font-semibold">Vendor</th>
            <th className="px-5 py-3 font-semibold">Qty</th><th className="px-5 py-3 font-semibold">Unit</th>
            <th className="px-5 py-3 font-semibold">Total</th><th className="px-5 py-3 font-semibold">Date</th>
            <th className="px-5 py-3 text-right font-semibold">Action</th></tr></thead>
          <tbody>
            {rows.map((p, i) => (
              <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="border-t border-slate-100 dark:border-white/5">
                <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{p.item}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{p.vendor}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{p.qty}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">৳{p.unitPrice}</td>
                <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-200">৳{p.total.toLocaleString()}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{p.date}</td>
                <td className="px-5 py-3"><div className="flex justify-end"><button onClick={() => del(p)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={14} /></button></div></td>
              </motion.tr>
            ))}
          </tbody>
        </table></div></div>
      )}
      <Modal open={adding} onClose={() => setAdding(false)} title="Add Purchase"
        footer={<><button onClick={() => setAdding(false)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Vendor</span>
            <Dropdown value={form.vendorId} options={vendors.map((v) => ({ value: v.id, label: v.name }))} onChange={(v) => setForm({ ...form, vendorId: v })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Item</span>
            <input className={input} value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Qty</span>
              <input className={input} type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Unit Price (৳)</span>
              <input className={input} type="number" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} /></label>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total: <b className="text-gold-500">৳{liveTotal.toLocaleString()}</b></p>
        </div>
      </Modal>
    </div>
  );
}
