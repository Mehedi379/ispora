import { useState, useEffect, useCallback } from "react";
import { Loader2, MessageSquare, Phone } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";

// view: "list" (Due customers report) | "sms" (Due Customer SMS)
export default function DueCustomers({ view = "list" }) {
  const { notify } = useStore();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState(false);
  const load = useCallback(async () => { setLoading(true); try { setRows(await api.reportDueCustomers()); } catch (e) { notify(e.message); } finally { setLoading(false); } }, [notify]);
  useEffect(() => { load(); }, [load]);

  const totalDue = rows.reduce((s, c) => s + c.due, 0);
  // Due Customer SMS: ekhane preview; asol SMS pathano SMS Service module er gateway diye hobe
  const sendAll = () => { setSent(true); notify(`${rows.length} jon ke due reminder SMS queue holo (SMS gateway integrate korle actually pathabe)`, "success"); };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">{view === "sms" ? "Due Customer SMS" : "Due Customers"}</h2><p className="text-sm text-slate-400">{rows.length} jon · total due <b className="text-amber-500">৳{totalDue.toLocaleString()}</b></p></div>
        {view === "sms" && <button onClick={sendAll} disabled={rows.length === 0 || sent} className="btn-gold"><MessageSquare size={16} /> {sent ? "Queued" : "Send Due Reminder to All"}</button>}
      </div>
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : rows.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><Phone className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono due customer nei 🎉</p></div>
      ) : (
        <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
            <th className="px-5 py-3 font-semibold">Customer</th><th className="px-5 py-3 font-semibold">Phone</th>
            <th className="px-5 py-3 font-semibold">Zone</th><th className="px-5 py-3 font-semibold">Package</th>
            <th className="px-5 py-3 font-semibold">Expiry</th><th className="px-5 py-3 text-right font-semibold">Due</th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-slate-100 dark:border-white/5">
                <td className="px-5 py-2.5 font-medium text-slate-700 dark:text-slate-200">{c.name}</td>
                <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400">{c.phone}</td>
                <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400">{c.zone || "—"}</td>
                <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400">{c.package || "—"}</td>
                <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400">{c.expiry || "—"}</td>
                <td className="px-5 py-2.5 text-right font-semibold text-amber-500">৳{c.due.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table></div></div>
      )}
    </div>
  );
}
