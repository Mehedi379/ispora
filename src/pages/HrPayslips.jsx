import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, Trash2, Receipt } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";
import Dropdown from "../components/Dropdown";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function HrPayslips() {
  const { notify } = useStore();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await api.hrList("payslips", { month, year })); }
    catch (e) { notify(e.message); }
    finally { setLoading(false); }
  }, [month, year, notify]);
  useEffect(() => { load(); }, [load]);

  const pay = async (p) => { setBusy(p.id); try { await api.hrPaySlip(p.id); await load(); } catch (e) { notify(e.message); } finally { setBusy(null); } };
  const del = async (p) => { setBusy(p.id); try { await api.hrDelete("payslips", p.id); await load(); } catch (e) { notify(e.message); } finally { setBusy(null); } };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Payslips</h2><p className="text-sm text-slate-400">Generated payslip — mark paid / delete</p></div>
        <div className="flex items-end gap-2">
          <Dropdown value={month} options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))} onChange={(v) => setMonth(v)} />
          <input className={`${input} w-24`} type="number" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
      </div>
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : rows.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><Receipt className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Ei mash e kono payslip nei. Payroll page theke generate korun.</p></div>
      ) : (
        <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
            <th className="px-5 py-3 font-semibold">Employee</th><th className="px-5 py-3 font-semibold">Dept</th>
            <th className="px-5 py-3 font-semibold">Basic</th><th className="px-5 py-3 font-semibold">Earnings</th>
            <th className="px-5 py-3 font-semibold">Deduction</th><th className="px-5 py-3 font-semibold">Net</th>
            <th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 text-right font-semibold">Action</th></tr></thead>
          <tbody>
            {rows.map((p, i) => (
              <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="border-t border-slate-100 dark:border-white/5">
                <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{p.employee}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{p.department || "—"}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">৳{p.basic}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">৳{p.earnings}</td>
                <td className="px-5 py-3 text-rose-500">৳{p.deductions}</td>
                <td className="px-5 py-3 font-bold text-slate-800 dark:text-white">৳{p.net}</td>
                <td className="px-5 py-3"><span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${p.status === "paid" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>{p.status}</span></td>
                <td className="px-5 py-3"><div className="flex justify-end gap-1.5">
                  {p.status !== "paid" && <button onClick={() => pay(p)} disabled={busy === p.id} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20 disabled:opacity-50">{busy === p.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Pay</button>}
                  <button onClick={() => del(p)} disabled={busy === p.id} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={14} /></button>
                </div></td>
              </motion.tr>
            ))}
          </tbody>
        </table></div></div>
      )}
    </div>
  );
}
