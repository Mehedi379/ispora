import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

const monthRange = () => { const n = new Date(); return { from: new Date(n.getFullYear(), n.getMonth(), 1).toISOString().slice(0, 10), to: new Date(n.getFullYear(), n.getMonth() + 1, 0).toISOString().slice(0, 10) }; };

export default function AccProfitLoss() {
  const { notify } = useStore();
  const [range, setRange] = useState(monthRange());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api.accProfitLoss(range)); } catch (e) { notify(e.message); } finally { setLoading(false); }
  }, [range, notify]);
  useEffect(() => { load(); }, [load]);

  const Section = ({ title, rows, total, color }) => (
    <div className="card p-5">
      <h3 className="mb-2 font-display font-bold text-slate-800 dark:text-white">{title}</h3>
      {rows.length === 0 ? <p className="text-sm text-slate-400">—</p> : rows.map((r) => (
        <div key={r.name} className="flex items-center justify-between border-b border-slate-50 py-1.5 text-sm last:border-0 dark:border-white/5">
          <span className="text-slate-600 dark:text-slate-300">{r.name}</span><span className="font-medium text-slate-800 dark:text-white">৳{r.amount.toLocaleString()}</span>
        </div>
      ))}
      <div className={`mt-2 flex justify-between border-t-2 border-slate-200 pt-2 font-bold dark:border-white/10 ${color}`}><span>Total</span><span>৳{total.toLocaleString()}</span></div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Profit & Loss</h2><p className="text-sm text-slate-400">Income − Expense = Net</p></div>
        <div className="flex items-end gap-2">
          <input type="date" className={input} value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
          <input type="date" className={input} value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
        </div>
      </div>
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : data && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Section title="Income" rows={data.incomeRows} total={data.totalIncome} color="text-emerald-500" />
            <Section title="Expense" rows={data.expenseRows} total={data.totalExpense} color="text-rose-500" />
          </div>
          <div className="card flex items-center justify-between p-5">
            <span className="font-display text-lg font-bold text-slate-800 dark:text-white">Net Profit / Loss</span>
            <span className={`font-display text-2xl font-extrabold ${data.net >= 0 ? "text-emerald-500" : "text-rose-500"}`}>৳{data.net.toLocaleString()}</span>
          </div>
        </>
      )}
    </div>
  );
}
