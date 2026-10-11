import { useState, useEffect, useCallback } from "react";
import { Loader2, Wallet, Landmark, TrendingUp, TrendingDown, Scale, HandCoins } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";

export default function AccDashboard() {
  const { notify } = useStore();
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setD(await api.accDashboard()); } catch (e) { notify(e.message); } finally { setLoading(false); }
  }, [notify]);
  useEffect(() => { load(); }, [load]);

  const Tile = ({ icon: Icon, label, value, color }) => (
    <div className="card p-5">
      <div className={`grid h-11 w-11 place-items-center rounded-xl ${color}`}><Icon size={20} /></div>
      <p className="mt-3 text-xs text-slate-400">{label}</p>
      <p className="font-display text-xl font-bold text-slate-800 dark:text-white">৳{(value || 0).toLocaleString()}</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Accounting Dashboard</h2><p className="text-sm text-slate-400">Financial summary</p></div>
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : d && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Tile icon={Wallet} label="Cash" value={d.cash} color="bg-emerald-500/15 text-emerald-500" />
            <Tile icon={Landmark} label="Bank" value={d.bank} color="bg-sky-500/15 text-sky-500" />
            <Tile icon={HandCoins} label="Receivable" value={d.receivable} color="bg-amber-500/15 text-amber-500" />
            <Tile icon={Scale} label="Net Profit" value={d.net} color="bg-gold-500/15 text-gold-500" />
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Tile icon={TrendingUp} label="Total Income" value={d.income} color="bg-emerald-500/15 text-emerald-500" />
            <Tile icon={TrendingDown} label="Total Expense" value={d.expense} color="bg-rose-500/15 text-rose-500" />
            <Tile icon={TrendingUp} label="Income (This Month)" value={d.incomeThisMonth} color="bg-emerald-500/15 text-emerald-500" />
            <Tile icon={TrendingDown} label="Expense (This Month)" value={d.expenseThisMonth} color="bg-rose-500/15 text-rose-500" />
          </div>
        </>
      )}
    </div>
  );
}
