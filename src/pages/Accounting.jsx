import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, TrendingUp, TrendingDown, Scale, Trash2, Loader2 } from "lucide-react";
import Dropdown from "../components/Dropdown";
import Modal from "../components/Modal";
import { useStore } from "../store";
import { api } from "../api";

import { input } from "../ui";

export default function Accounting() {
  const { user, notify } = useStore();
  const isAdmin = user?.role === "admin";
  const [data, setData] = useState({ items: [], income: 0, expense: 0, net: 0 });
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("expense");
  const [head, setHead] = useState("");
  const [amount, setAmount] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api.accounting()); setErr(""); }
    catch (e) { setErr(e?.message || "Accounting load fail holo"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!head || !amount) return;
    try {
      await api.addTransaction({ type, head, amount: Number(amount) });
      setOpen(false); setHead(""); setAmount("");
      await load();
    } catch (e) { notify(e?.message || "Entry add fail holo"); }
  };

  const del = async (id) => {
    try { await api.deleteTransaction(id); await load(); }
    catch (e) { notify(e?.message || "Entry delete fail holo"); }
  };

  const tiles = [
    { label: "Total Income", value: data.income, icon: TrendingUp, color: "from-emerald-400 to-green-600" },
    { label: "Total Expense", value: data.expense, icon: TrendingDown, color: "from-rose-400 to-red-600" },
    { label: "Net Profit", value: data.net, icon: Scale, color: "from-gold-400 to-gold-600" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Accounting</h2>
          <p className="text-sm text-slate-400">Income, expense o profit/loss</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-gold"><Plus size={16} /> Add Entry</button>
      </div>

      {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {tiles.map((t, i) => (
          <motion.div key={t.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="card flex items-center gap-4 p-5">
            <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${t.color} text-white shadow-lg`}><t.icon size={22} /></div>
            <div><p className={`text-xl font-bold ${t.label === "Net Profit" ? (data.net >= 0 ? "text-emerald-500" : "text-rose-500") : "text-slate-800 dark:text-white"}`}>৳ {t.value.toLocaleString()}</p><p className="text-sm text-slate-400">{t.label}</p></div>
          </motion.div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="p-5"><h3 className="font-display font-semibold text-slate-800 dark:text-white">Transactions</h3></div>
        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="animate-spin text-gold-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 text-xs uppercase text-slate-400">
                <tr><th className="px-5 py-3">Head</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3 text-right">Action</th></tr>
              </thead>
              <tbody>
                {data.items.map((r, i) => (
                  <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.03, 0.3) }} className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{r.head}</td>
                    <td className="px-5 py-3 text-slate-500">{r.date}</td>
                    <td className="px-5 py-3"><span className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${r.type === "income" ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"}`}>{r.type}</span></td>
                    <td className={`px-5 py-3 font-semibold ${r.type === "income" ? "text-emerald-500" : "text-rose-500"}`}>{r.type === "income" ? "+" : "−"} ৳ {r.amount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right">{isAdmin && <button onClick={() => del(r.id)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={15} /></button>}</td>
                  </motion.tr>
                ))}
                {data.items.length === 0 && <tr><td colSpan={5} className="py-12 text-center text-sm text-slate-400">Kono entry nei.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Entry" subtitle="Income ba expense add korun"
        footer={<><button onClick={() => setOpen(false)} className="btn-ghost">Cancel</button><button onClick={add} className="btn-gold">Save</button></>}>
        <div className="space-y-4">
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Type</span><Dropdown value={type} options={["income", "expense"]} onChange={setType} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Head / Description</span><input className={input} value={head} onChange={(e) => setHead(e.target.value)} placeholder="e.g. Bandwidth Bill" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Amount (৳)</span><input className={input} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" /></label>
        </div>
      </Modal>
    </div>
  );
}
