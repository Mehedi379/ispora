import { useState, useEffect, useCallback } from "react";
import { Loader2, BookText } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";

export default function AccCashBook() {
  const { notify } = useStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api.accCashBook()); } catch (e) { notify(e.message); } finally { setLoading(false); }
  }, [notify]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Cash Book</h2><p className="text-sm text-slate-400">Cash/Bank account er sob transaction (running balance soho)</p></div>
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : !data || data.rows.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><BookText className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono cash/bank transaction nei.</p></div>
      ) : (
        <>
          <div className="card flex items-center justify-between p-4"><span className="text-sm text-slate-500">Current Cash+Bank Balance</span><span className="font-display text-xl font-bold text-emerald-500">৳{data.balance.toLocaleString()}</span></div>
          <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
              <th className="px-5 py-3 font-semibold">Date</th><th className="px-5 py-3 font-semibold">Account</th><th className="px-5 py-3 font-semibold">Memo</th>
              <th className="px-5 py-3 text-right font-semibold">In</th><th className="px-5 py-3 text-right font-semibold">Out</th><th className="px-5 py-3 text-right font-semibold">Balance</th></tr></thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 dark:border-white/5">
                  <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400">{r.date}</td>
                  <td className="px-5 py-2.5 text-slate-600 dark:text-slate-300">{r.account}</td>
                  <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400">{r.memo || "—"}</td>
                  <td className="px-5 py-2.5 text-right text-emerald-600">{r.debit ? `৳${r.debit.toLocaleString()}` : "—"}</td>
                  <td className="px-5 py-2.5 text-right text-rose-500">{r.credit ? `৳${r.credit.toLocaleString()}` : "—"}</td>
                  <td className="px-5 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">৳{r.balance.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table></div></div>
        </>
      )}
    </div>
  );
}
