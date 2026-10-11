import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2, ArrowDownCircle, ArrowUpCircle, Boxes } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

export default function InventoryStock() {
  const { notify } = useStore();
  const [levels, setLevels] = useState([]);
  const [moves, setMoves] = useState([]);
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ itemId: "", locationId: "", qty: "", type: "in", note: "" });
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [lv, mv, it, loc] = await Promise.all([
        api.invStockLevels(), api.crudList("inventory", "stock"),
        api.crudList("inventory", "items"), api.crudList("inventory", "locations"),
      ]);
      setLevels(lv); setMoves(mv); setItems(it); setLocations(loc); setErr("");
    } catch (e) { setErr(e?.message || "Load fail"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({ itemId: items[0]?.id || "", locationId: "", qty: "", type: "in", note: "" }); setErr(""); setAdding(true); };
  const save = async () => { setErr(""); try { await api.crudCreate("inventory", "stock", form); setAdding(false); await load(); } catch (e) { setErr(e.message); } };
  const del = async (m) => { try { await api.crudDelete("inventory", "stock", m.id); await load(); } catch (e) { notify(e.message); } };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Stock</h2><p className="text-sm text-slate-400">Stock in/out movement + current level</p></div>
        <button onClick={openNew} disabled={items.length === 0} className="btn-gold"><Plus size={16} /> Stock Movement</button>
      </div>
      {err && !adding && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : (
        <>
          <h3 className="text-sm font-semibold text-slate-500">Current Stock Level</h3>
          {levels.length === 0 ? <div className="card py-10 text-center text-sm text-slate-400">Kono item nei. Age Item banan.</div> : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {levels.map((l) => (
                <div key={l.id} className="card p-4">
                  <div className="flex items-center gap-2"><Boxes size={16} className="text-gold-500" /><p className="text-sm font-medium text-slate-700 dark:text-slate-200">{l.name}</p></div>
                  <p className={`mt-2 font-display text-2xl font-bold ${l.level > 0 ? "text-emerald-500" : l.level < 0 ? "text-rose-500" : "text-slate-400"}`}>{l.level}</p>
                  <p className="text-xs text-slate-400">{l.unit || "unit"}</p>
                </div>
              ))}
            </div>
          )}
          <h3 className="text-sm font-semibold text-slate-500">Movement History</h3>
          {moves.length === 0 ? <div className="card py-8 text-center text-sm text-slate-400">Kono movement nei.</div> : (
            <div className="card overflow-hidden"><table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
                <th className="px-5 py-3 font-semibold">Item</th><th className="px-5 py-3 font-semibold">Location</th>
                <th className="px-5 py-3 font-semibold">Type</th><th className="px-5 py-3 font-semibold">Qty</th>
                <th className="px-5 py-3 font-semibold">Date</th><th className="px-5 py-3 text-right font-semibold">Action</th></tr></thead>
              <tbody>
                {moves.map((m) => (
                  <tr key={m.id} className="border-t border-slate-100 dark:border-white/5">
                    <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{m.item}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{m.location || "—"}</td>
                    <td className="px-5 py-3">{m.type === "in" ? <span className="inline-flex items-center gap-1 text-emerald-500"><ArrowDownCircle size={14} /> in</span> : <span className="inline-flex items-center gap-1 text-rose-500"><ArrowUpCircle size={14} /> out</span>}</td>
                    <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-200">{m.qty}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{m.date}</td>
                    <td className="px-5 py-3"><div className="flex justify-end"><button onClick={() => del(m)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={14} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </>
      )}
      <Modal open={adding} onClose={() => setAdding(false)} title="Stock Movement"
        footer={<><button onClick={() => setAdding(false)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Item</span>
            <Dropdown value={form.itemId} options={items.map((i) => ({ value: i.id, label: i.name }))} onChange={(v) => setForm({ ...form, itemId: v })} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Type</span>
              <Dropdown value={form.type} options={[{ value: "in", label: "Stock In" }, { value: "out", label: "Stock Out" }]} onChange={(v) => setForm({ ...form, type: v })} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Qty</span>
              <input className={input} type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></label>
          </div>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Location (opt)</span>
            <Dropdown value={form.locationId} options={locations.map((l) => ({ value: l.id, label: l.name }))} onChange={(v) => setForm({ ...form, locationId: v || "" })} placeholder="Location" /></label>
        </div>
      </Modal>
    </div>
  );
}
