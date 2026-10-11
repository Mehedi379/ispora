import { useState, useEffect, useCallback } from "react";
import { NavLink } from "react-router-dom";
import { Loader2, Receipt } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";

// Pay Processing Fee report
export function PgwFeeReport() {
  const { notify } = useStore();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); try { setRows(await api.reportPgwFees()); } catch (e) { notify(e.message); } finally { setLoading(false); } }, [notify]);
  useEffect(() => { load(); }, [load]);
  const totalFee = rows.reduce((s, r) => s + r.fee, 0);
  return (
    <div className="space-y-5">
      <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Pay Processing Fee</h2><p className="text-sm text-slate-400">PGW payment gateway fee (~1.5%) — total <b className="text-rose-500">৳{totalFee.toLocaleString()}</b></p></div>
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : rows.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><Receipt className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono PGW payment nei.</p></div>
      ) : (
        <div className="card overflow-hidden"><table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
            <th className="px-5 py-3 font-semibold">Gateway</th><th className="px-5 py-3 font-semibold">Amount</th><th className="px-5 py-3 font-semibold">Fee (1.5%)</th><th className="px-5 py-3 font-semibold">Date</th></tr></thead>
          <tbody>
            {rows.map((r) => (<tr key={r.id} className="border-t border-slate-100 dark:border-white/5">
              <td className="px-5 py-2.5 text-slate-700 dark:text-slate-200">{r.gateway}</td>
              <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400">৳{r.amount.toLocaleString()}</td>
              <td className="px-5 py-2.5 font-semibold text-rose-500">৳{r.fee.toLocaleString()}</td>
              <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400">{r.date}</td></tr>))}
          </tbody>
        </table></div>
      )}
    </div>
  );
}

const ALL = [
  { to: "/report/bill-collection", label: "Bill Collection", desc: "Daily/range collection" },
  { to: "/report/discount", label: "Discount Report", desc: "Diye deya discount" },
  { to: "/report/customer", label: "Customer Report", desc: "Customer base summary" },
  { to: "/report/messages", label: "Messages Report", desc: "SMS log" },
  { to: "/report/due-sms", label: "Due Customer SMS", desc: "Due customer reminder" },
  { to: "/report/pgw-fee", label: "Pay. Processing Fee", desc: "Gateway fee" },
  { to: "/report/btrc", label: "BTRC Monthly Report", desc: "Regulatory" },
  { to: "/report/financial", label: "Financial Transactions", desc: "Income/expense" },
];
export function ReportsHub() {
  return (
    <div className="space-y-5">
      <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">All Reports</h2><p className="text-sm text-slate-400">Shob report ek jaygay</p></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ALL.map((r) => (
          <NavLink key={r.to} to={r.to} className="card p-5 transition hover:border-gold-400 hover:shadow-gold">
            <p className="font-display font-bold text-slate-800 dark:text-white">{r.label}</p>
            <p className="text-sm text-slate-400">{r.desc}</p>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

// Discount + Messages — data source pending (graceful note)
export function ReportNote({ title, note }) {
  return (
    <div className="space-y-5">
      <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">{title}</h2></div>
      <div className="card grid place-items-center py-16 text-center"><Receipt className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 max-w-md text-sm text-slate-400">{note}</p></div>
    </div>
  );
}
