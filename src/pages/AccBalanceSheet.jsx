import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";

export default function AccBalanceSheet() {
  const { notify } = useStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api.accBalanceSheet()); } catch (e) { notify(e.message); } finally { setLoading(false); }
  }, [notify]);
  useEffect(() => { load(); }, [load]);

  const Block = ({ title, rows, total, color }) => (
    <div className="card p-5">
      <h3 className={`mb-2 font-display font-bold ${color}`}>{title}</h3>
      {rows.length === 0 ? <p className="text-sm text-slate-400">—</p> : rows.map((r, i) => (
        <div key={i} className="flex items-center justify-between border-b border-slate-50 py-1.5 text-sm last:border-0 dark:border-white/5">
          <span className="text-slate-600 dark:text-slate-300">{r.name}</span><span className="font-medium text-slate-800 dark:text-white">৳{r.amount.toLocaleString()}</span>
        </div>
      ))}
      <div className="mt-2 flex justify-between border-t-2 border-slate-200 pt-2 font-bold text-slate-800 dark:border-white/10 dark:text-white"><span>Total</span><span>৳{total.toLocaleString()}</span></div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Balance Sheet</h2><p className="text-sm text-slate-400">Assets = Liabilities + Equity</p></div>
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : data && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Block title="Assets" rows={data.assets} total={data.totalAssets} color="text-sky-500" />
          <div className="space-y-4">
            <Block title="Liabilities" rows={data.liabilities} total={data.totalLiabilities} color="text-rose-500" />
            <Block title="Equity" rows={data.equity} total={data.totalEquity} color="text-indigo-500" />
          </div>
          <div className="card flex items-center justify-between p-4 lg:col-span-2">
            <span className="text-sm font-semibold text-slate-500">Assets ৳{data.totalAssets.toLocaleString()} vs Liab+Equity ৳{(data.totalLiabilities + data.totalEquity).toLocaleString()}</span>
            <span className={`text-xs font-bold ${data.totalAssets === data.totalLiabilities + data.totalEquity ? "text-emerald-500" : "text-amber-500"}`}>{data.totalAssets === data.totalLiabilities + data.totalEquity ? "Balanced ✓" : "Check entries"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
