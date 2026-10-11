import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";
import Dropdown from "../components/Dropdown";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function HrSalarySheet() {
  const { notify } = useStore();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api.hrSalarySheet(month, year)); }
    catch (e) { notify(e.message); }
    finally { setLoading(false); }
  }, [month, year, notify]);
  useEffect(() => { load(); }, [load]);

  const t = data?.totals;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Salary Sheet</h2><p className="text-sm text-slate-400">Mash onujayi puro salary report</p></div>
        <div className="flex items-end gap-2">
          <Dropdown value={month} options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))} onChange={(v) => setMonth(v)} />
          <input className={`${input} w-24`} type="number" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
      </div>

      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : data && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[["Total Net", t.net, "text-gold-500"], ["Total Earnings", t.earnings, "text-emerald-500"], ["Total Deduction", t.deductions, "text-rose-500"], ["Employees", t.count, "text-indigo-500"]].map(([l, v, c]) => (
              <div key={l} className="card p-4"><p className="text-xs text-slate-400">{l}</p><p className={`font-display text-xl font-bold ${c}`}>{l === "Employees" ? v : `৳${v.toLocaleString()}`}</p></div>
            ))}
          </div>
          <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
              <th className="px-5 py-3 font-semibold">Employee</th><th className="px-5 py-3 font-semibold">Dept</th>
              <th className="px-5 py-3 font-semibold">Basic</th><th className="px-5 py-3 font-semibold">Earnings</th>
              <th className="px-5 py-3 font-semibold">Deduction</th><th className="px-5 py-3 font-semibold">Net</th>
              <th className="px-5 py-3 font-semibold">Status</th></tr></thead>
            <tbody>
              {data.rows.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 dark:border-white/5">
                  <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{p.employee}</td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{p.department || "—"}</td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">৳{p.basic}</td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">৳{p.earnings}</td>
                  <td className="px-5 py-3 text-rose-500">৳{p.deductions}</td>
                  <td className="px-5 py-3 font-bold text-slate-800 dark:text-white">৳{p.net}</td>
                  <td className="px-5 py-3"><span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${p.status === "paid" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>{p.status}</span></td>
                </tr>
              ))}
              {data.rows.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-400">Ei mash e payslip nei. Payroll generate korun.</td></tr>}
            </tbody>
          </table></div></div>
        </>
      )}
    </div>
  );
}
