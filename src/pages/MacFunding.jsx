import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Loader2, Wallet } from "lucide-react";
import Modal from "../components/Modal";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";
import Dropdown from "../components/Dropdown";

export default function MacFunding() {
  const { notify } = useStore();
  const [rows, setRows] = useState([]);
  const [resellers, setResellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ resellerId: "", amount: "", method: "Cash", note: "" });
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const [f, rs] = await Promise.all([api.crudList("mac", "funding"), api.crudList("mac", "resellers")]); setRows(f); setResellers(rs); setErr(""); }
    catch (e) { setErr(e?.message || "Load fail"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({ resellerId: resellers[0]?.id || "", amount: "", method: "Cash", note: "" }); setErr(""); setAdding(true); };
  const save = async () => { setErr(""); try { await api.crudCreate("mac", "funding", form); setAdding(false); await load(); notify("Funding add holo — balance barlo", "success"); } catch (e) { setErr(e.message); } };

  const total = rows.reduce((s, f) => s + f.amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Reseller Funding</h2><p className="text-sm text-slate-400">Reseller-ke balance deya — mot <b className="text-gold-500">৳{total.toLocaleString()}</b></p></div>
        <button onClick={openNew} disabled={resellers.length === 0} className="btn-gold"><Plus size={16} /> Add Funding</button>
      </div>
      {err && !adding && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : rows.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><Wallet className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono funding nei. {resellers.length === 0 && "Age MAC reseller banan."}</p></div>
      ) : (
        <div className="card overflow-hidden"><table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
            <th className="px-5 py-3 font-semibold">Reseller</th><th className="px-5 py-3 font-semibold">Amount</th>
            <th className="px-5 py-3 font-semibold">Method</th><th className="px-5 py-3 font-semibold">Date</th><th className="px-5 py-3 font-semibold">Note</th></tr></thead>
          <tbody>
            {rows.map((f, i) => (
              <motion.tr key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="border-t border-slate-100 dark:border-white/5">
                <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{f.reseller}</td>
                <td className="px-5 py-3 font-semibold text-emerald-600">৳{f.amount.toLocaleString()}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{f.method}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{f.date}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{f.note || "—"}</td>
              </motion.tr>
            ))}
          </tbody>
        </table></div>
      )}
      <Modal open={adding} onClose={() => setAdding(false)} title="Add Funding" subtitle="Reseller balance baran"
        footer={<><button onClick={() => setAdding(false)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Reseller</span>
            <Dropdown value={form.resellerId} options={resellers.map((r) => ({ value: r.id, label: `${r.name} (৳${r.balance})` }))} onChange={(v) => setForm({ ...form, resellerId: v })} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Amount (৳)</span>
              <input className={input} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Method</span>
              <Dropdown value={form.method} options={["Cash", "bKash", "Nagad", "Bank"]} onChange={(v) => setForm({ ...form, method: v })} /></label>
          </div>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Note</span>
            <input className={input} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
        </div>
      </Modal>
    </div>
  );
}
