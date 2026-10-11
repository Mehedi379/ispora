import { useState, useCallback } from "react";
import { Loader2, GitCompare } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

const mStart = (off = 0) => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth() + off, 1).toISOString().slice(0, 10); };
const mEnd = (off = 0) => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth() + off + 1, 0).toISOString().slice(0, 10); };

export default function AccCompare() {
  const { notify } = useStore();
  const [p1, setP1] = useState({ from: mStart(-1), to: mEnd(-1) });
  const [p2, setP2] = useState({ from: mStart(0), to: mEnd(0) });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    try { const [a, b] = await Promise.all([api.accProfitLoss(p1), api.accProfitLoss(p2)]); setData({ a, b }); }
    catch (e) { notify(e.message); } finally { setLoading(false); }
  }, [p1, p2, notify]);

  const Row = ({ label, a, b, color }) => (
    <tr className="border-t border-slate-100 dark:border-white/5">
      <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{label}</td>
      <td className={`px-5 py-3 text-right ${color}`}>৳{a.toLocaleString()}</td>
      <td className={`px-5 py-3 text-right ${color}`}>৳{b.toLocaleString()}</td>
      <td className={`px-5 py-3 text-right font-semibold ${b - a >= 0 ? "text-emerald-500" : "text-rose-500"}`}>{b - a >= 0 ? "+" : ""}৳{(b - a).toLocaleString()}</td>
    </tr>
  );

  return (
    <div className="space-y-5">
      <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Compare Profit & Loss</h2><p className="text-sm text-slate-400">Dui period er P/L pasha-pashi</p></div>
      <div className="card flex flex-wrap items-end gap-4 p-4">
        <div><p className="mb-1 text-xs font-semibold uppercase text-slate-400">Period A</p><div className="flex gap-2"><input type="date" className={input} value={p1.from} onChange={(e) => setP1({ ...p1, from: e.target.value })} /><input type="date" className={input} value={p1.to} onChange={(e) => setP1({ ...p1, to: e.target.value })} /></div></div>
        <div><p className="mb-1 text-xs font-semibold uppercase text-slate-400">Period B</p><div className="flex gap-2"><input type="date" className={input} value={p2.from} onChange={(e) => setP2({ ...p2, from: e.target.value })} /><input type="date" className={input} value={p2.to} onChange={(e) => setP2({ ...p2, to: e.target.value })} /></div></div>
        <button onClick={run} disabled={loading} className="btn-gold">{loading ? <Loader2 size={16} className="animate-spin" /> : <GitCompare size={16} />} Compare</button>
      </div>
      {data && (
        <div className="card overflow-hidden"><table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
            <th className="px-5 py-3 font-semibold"></th><th className="px-5 py-3 text-right font-semibold">Period A</th><th className="px-5 py-3 text-right font-semibold">Period B</th><th className="px-5 py-3 text-right font-semibold">Change</th></tr></thead>
          <tbody>
            <Row label="Total Income" a={data.a.totalIncome} b={data.b.totalIncome} color="text-emerald-600" />
            <Row label="Total Expense" a={data.a.totalExpense} b={data.b.totalExpense} color="text-rose-500" />
            <Row label="Net Profit" a={data.a.net} b={data.b.net} color="text-slate-700 dark:text-slate-200 font-semibold" />
          </tbody>
        </table></div>
      )}
    </div>
  );
}
