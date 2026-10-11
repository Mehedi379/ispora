import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

const today = () => new Date().toISOString().slice(0, 10);

// kind: "income" | "expense"
export default function AccQuick({ kind = "income" }) {
  const { notify } = useStore();
  const [rows, setRows] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ accountId: "", cashAccountId: "", amount: "", date: today(), memo: "" });
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const [l, a] = await Promise.all([api.accLedger(kind), api.accAccounts()]); setRows(l); setAccounts(a); setErr(""); }
    catch (e) { setErr(e?.message || "Load fail"); } finally { setLoading(false); }
  }, [kind]);
  useEffect(() => { load(); }, [load]);

  const heads = accounts.filter((a) => a.type === kind);
  const cash = accounts.filter((a) => a.type === "asset" && /cash|bank/i.test(a.name));
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const openNew = () => { setForm({ accountId: heads[0]?.id || "", cashAccountId: cash[0]?.id || "", amount: "", date: today(), memo: "" }); setErr(""); setAdding(true); };
  const save = async () => { setErr(""); try { await api.accQuick(kind, form); setAdding(false); await load(); } catch (e) { setErr(e.message); } };

  const title = kind === "income" ? "Income" : "Expense";
  const Icon = kind === "income" ? TrendingUp : TrendingDown;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">{title}</h2><p className="text-sm text-slate-400">Total {title.toLowerCase()} <b className={kind === "income" ? "text-emerald-500" : "text-rose-500"}>৳{total.toLocaleString()}</b></p></div>
        <button onClick={openNew} className="btn-gold"><Plus size={16} /> Add {title}</button>
      </div>
      {err && !adding && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : rows.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><Icon className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono {title.toLowerCase()} entry nei. {accounts.length === 0 && "Age Chart of Accounts e account banan."}</p></div>
      ) : (
        <div className="card overflow-hidden"><table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
            <th className="px-5 py-3 font-semibold">Head</th><th className="px-5 py-3 font-semibold">Amount</th>
            <th className="px-5 py-3 font-semibold">Date</th><th className="px-5 py-3 font-semibold">Memo</th></tr></thead>
          <tbody>
            {rows.map((x, i) => (
              <motion.tr key={x.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="border-t border-slate-100 dark:border-white/5">
                <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{x.account}</td>
                <td className={`px-5 py-3 font-semibold ${kind === "income" ? "text-emerald-600" : "text-rose-500"}`}>৳{x.amount.toLocaleString()}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{x.date}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{x.memo || "—"}</td>
              </motion.tr>
            ))}
          </tbody>
        </table></div>
      )}
      <Modal open={adding} onClose={() => setAdding(false)} title={`Add ${title}`}
        footer={<><button onClick={() => setAdding(false)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">{title} Head</span>
            <Dropdown value={form.accountId} options={heads.map((a) => ({ value: a.id, label: a.name }))} onChange={(v) => setForm({ ...form, accountId: v || "" })} placeholder="Head" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">{kind === "income" ? "Deposit to" : "Paid from"} (Cash/Bank)</span>
            <Dropdown value={form.cashAccountId} options={cash.map((a) => ({ value: a.id, label: a.name }))} onChange={(v) => setForm({ ...form, cashAccountId: v || "" })} placeholder="Cash/Bank" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Amount (৳)</span>
              <input className={input} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Date</span>
              <input className={input} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
          </div>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Memo</span>
            <input className={input} value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} /></label>
        </div>
      </Modal>
    </div>
  );
}
