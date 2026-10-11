import { useState } from "react";
import { Loader2, Cog } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";
import Dropdown from "../components/Dropdown";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function HrPayroll() {
  const { notify } = useStore();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    setBusy(true); setResult(null);
    try { const res = await api.hrGeneratePayroll(Number(month), Number(year)); setResult(res); notify(`${res.created} ta payslip toiri holo`, "success"); }
    catch (e) { notify(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Payroll</h2><p className="text-sm text-slate-400">Mash onujayi shob active employee er payslip generate korun (basic + payhead)</p></div>
      <div className="card max-w-lg space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Month</span>
            <Dropdown value={month} options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))} onChange={(v) => setMonth(v)} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Year</span>
            <input className={input} type="number" value={year} onChange={(e) => setYear(e.target.value)} /></label>
        </div>
        <button onClick={run} disabled={busy} className="btn-gold w-full justify-center">{busy ? <Loader2 size={16} className="animate-spin" /> : <Cog size={16} />} Generate Payroll</button>
        <p className="rounded-lg bg-gold-500/10 px-3 py-2 text-xs text-gold-600 dark:text-gold-400">Payslip = Basic + active earning payheads − deduction payheads. Je mash e already payslip ache ta skip hobe (double-pay guard).</p>
      </div>
      {result && (
        <div className="card max-w-lg p-5 text-sm">
          <p className="font-semibold text-slate-800 dark:text-white">{MONTHS[result.month - 1]} {result.year} — Payroll Result</p>
          <ul className="mt-2 space-y-1 text-slate-500 dark:text-slate-400">
            <li>✅ Created: <b className="text-emerald-500">{result.created}</b> payslip</li>
            <li>⏭ Skipped (already existed): {result.skipped}</li>
          </ul>
          <p className="mt-2 text-xs text-slate-400">Payslip page e dekhun / mark paid korun.</p>
        </div>
      )}
    </div>
  );
}
