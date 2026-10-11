import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2, RefreshCw, Repeat } from "lucide-react";
import Modal from "../components/Modal";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";
import Dropdown from "../components/Dropdown";

export default function BwRecurring() {
  const { notify } = useStore();
  const [rows, setRows] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [gen, setGen] = useState(false);
  const [form, setForm] = useState({ buyerId: "", amount: "", note: "" });
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const [r, b] = await Promise.all([api.crudList("bwsale", "recurring"), api.crudList("bwsale", "resellers")]); setRows(r); setBuyers(b); setErr(""); }
    catch (e) { setErr(e?.message || "Load fail"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({ buyerId: buyers[0]?.id || "", amount: "", note: "" }); setErr(""); setAdding(true); };
  const save = async () => { setErr(""); try { await api.crudCreate("bwsale", "recurring", form); setAdding(false); await load(); } catch (e) { setErr(e.message); } };
  const toggle = async (x) => { try { await api.crudUpdate("bwsale", "recurring", x.id, { active: !x.active }); await load(); } catch (e) { notify(e.message); } };
  const del = async (x) => { try { await api.crudDelete("bwsale", "recurring", x.id); await load(); } catch (e) { notify(e.message); } };
  const generate = async () => { setGen(true); try { const res = await api.bwSaleGenerateRecurring(); notify(`${res.created} ta invoice generate holo (${res.period})`, "success"); } catch (e) { notify(e.message); } finally { setGen(false); } };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Recurring Invoice</h2><p className="text-sm text-slate-400">Protyek mash auto sales invoice generate</p></div>
        <div className="flex gap-2">
          <button onClick={generate} disabled={gen || rows.length === 0} className="btn-ghost">{gen ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Generate This Month</button>
          <button onClick={openNew} disabled={buyers.length === 0} className="btn-gold"><Plus size={16} /> Add</button>
        </div>
      </div>
      {err && !adding && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : rows.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><Repeat className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono recurring nei. {buyers.length === 0 && "Age Reseller banan."}</p></div>
      ) : (
        <div className="card overflow-hidden"><table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
            <th className="px-5 py-3 font-semibold">Reseller</th><th className="px-5 py-3 font-semibold">Monthly Amount</th>
            <th className="px-5 py-3 font-semibold">Active</th><th className="px-5 py-3 text-right font-semibold">Action</th></tr></thead>
          <tbody>
            {rows.map((x, i) => (
              <motion.tr key={x.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.03, 0.3) }} className="border-t border-slate-100 dark:border-white/5">
                <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{x.buyer}</td>
                <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-200">৳{x.amount.toLocaleString()}</td>
                <td className="px-5 py-3"><button onClick={() => toggle(x)} className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${x.active ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-400/10 text-slate-400"}`}>{x.active ? "Active" : "Off"}</button></td>
                <td className="px-5 py-3"><div className="flex justify-end"><button onClick={() => del(x)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={14} /></button></div></td>
              </motion.tr>
            ))}
          </tbody>
        </table></div>
      )}
      <Modal open={adding} onClose={() => setAdding(false)} title="Add Recurring"
        footer={<><button onClick={() => setAdding(false)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Reseller</span>
            <Dropdown value={form.buyerId} options={buyers.map((b) => ({ value: b.id, label: b.name }))} onChange={(v) => setForm({ ...form, buyerId: v })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Monthly Amount (৳)</span>
            <input className={input} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
        </div>
      </Modal>
    </div>
  );
}
