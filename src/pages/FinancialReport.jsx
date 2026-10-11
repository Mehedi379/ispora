import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";

export default function FinancialReport() {
  const { notify } = useStore();
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); try { setD(await api.reportFinancial()); } catch (e) { notify(e.message); } finally { setLoading(false); } }, [notify]);
  useEffect(() => { load(); }, [load]);

  const Tile = ({ label, value, color }) => (<div className="card p-5"><p className="text-xs text-slate-400">{label}</p><p className={`font-display text-xl font-bold ${color}`}>{value}</p></div>);

  return (
    <div className="space-y-5">
      <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Financial Transactions</h2><p className="text-sm text-slate-400">Collection + income/expense summary</p></div>
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : d && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Tile label="Total Collection" value={`৳${d.collection.toLocaleString()}`} color="text-emerald-500" />
          <Tile label="Collection Count" value={d.collectionCount} color="text-slate-800 dark:text-white" />
          <Tile label="Income (acctg)" value={`৳${d.income.toLocaleString()}`} color="text-emerald-500" />
          <Tile label="Expense (acctg)" value={`৳${d.expense.toLocaleString()}`} color="text-rose-500" />
          <Tile label="Net" value={`৳${d.net.toLocaleString()}`} color={d.net >= 0 ? "text-emerald-500" : "text-rose-500"} />
        </div>
      )}
    </div>
  );
}
