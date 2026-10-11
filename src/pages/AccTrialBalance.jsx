import { useState, useEffect, useCallback } from "react";
import { Loader2, Scale } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";

// mode: "trial" (debit/credit cols) | "balances" (net balance col)
export default function AccTrialBalance({ mode = "trial" }) {
  const { notify } = useStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api.accTrialBalance()); } catch (e) { notify(e.message); } finally { setLoading(false); }
  }, [notify]);
  useEffect(() => { load(); }, [load]);

  const title = mode === "balances" ? "Account Balances" : "Trial Balance";

  return (
    <div className="space-y-5">
      <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">{title}</h2><p className="text-sm text-slate-400">Protyek account er {mode === "balances" ? "net balance" : "debit/credit"} total</p></div>
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : !data || data.rows.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><Scale className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono entry nei.</p></div>
      ) : (
        <div className="card overflow-hidden"><table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
            <th className="px-5 py-3 font-semibold">Code</th><th className="px-5 py-3 font-semibold">Account</th><th className="px-5 py-3 font-semibold">Type</th>
            {mode === "trial" ? <><th className="px-5 py-3 text-right font-semibold">Debit</th><th className="px-5 py-3 text-right font-semibold">Credit</th></> : <th className="px-5 py-3 text-right font-semibold">Balance</th>}
          </tr></thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.code} className="border-t border-slate-100 dark:border-white/5">
                <td className="px-5 py-2.5 font-mono text-slate-500 dark:text-slate-400">{r.code}</td>
                <td className="px-5 py-2.5 font-medium text-slate-700 dark:text-slate-200">{r.name}</td>
                <td className="px-5 py-2.5 capitalize text-slate-500 dark:text-slate-400">{r.type}</td>
                {mode === "trial" ? <>
                  <td className="px-5 py-2.5 text-right text-emerald-600">{r.debit ? `৳${r.debit.toLocaleString()}` : "—"}</td>
                  <td className="px-5 py-2.5 text-right text-rose-500">{r.credit ? `৳${r.credit.toLocaleString()}` : "—"}</td>
                </> : <td className="px-5 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">৳{(r.debit - r.credit).toLocaleString()}</td>}
              </tr>
            ))}
          </tbody>
          {mode === "trial" && <tfoot><tr className="border-t-2 border-slate-200 dark:border-white/10 font-bold">
            <td className="px-5 py-3" colSpan={3}>Total</td>
            <td className="px-5 py-3 text-right text-emerald-600">৳{data.totalDebit.toLocaleString()}</td>
            <td className="px-5 py-3 text-right text-rose-500">৳{data.totalCredit.toLocaleString()}</td>
          </tr></tfoot>}
        </table></div>
      )}
    </div>
  );
}
