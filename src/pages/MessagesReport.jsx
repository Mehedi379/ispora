import { useState, useEffect, useCallback } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";

const stStyle = { sent: "text-emerald-500 bg-emerald-500/10", simulated: "text-amber-500 bg-amber-500/10", queued: "text-sky-500 bg-sky-500/10", failed: "text-rose-500 bg-rose-500/10" };

export default function MessagesReport() {
  const { notify } = useStore();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); try { setRows(await api.smsMessages()); } catch (e) { notify(e.message); } finally { setLoading(false); } }, [notify]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Messages Report</h2><p className="text-sm text-slate-400">Pathano SMS log — {rows.length} ta</p></div>
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : rows.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><MessageSquare className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono SMS pathano hoyni. SMS Service → Send SMS theke pathan.</p></div>
      ) : (
        <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
            <th className="px-5 py-3 font-semibold">To</th><th className="px-5 py-3 font-semibold">Message</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Date</th></tr></thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id} className="border-t border-slate-100 dark:border-white/5">
                <td className="px-5 py-2.5 font-mono text-slate-600 dark:text-slate-300">{m.to}</td>
                <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400">{m.body}</td>
                <td className="px-5 py-2.5"><span className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${stStyle[m.status] || ""}`}>{m.status}</span></td>
                <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400">{m.date}</td>
              </tr>
            ))}
          </tbody>
        </table></div></div>
      )}
    </div>
  );
}
