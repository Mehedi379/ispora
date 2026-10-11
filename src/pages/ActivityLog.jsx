import { useState, useEffect, useCallback } from "react";
import { Loader2, ScrollText } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";

const methodColor = { POST: "text-emerald-500 bg-emerald-500/10", PUT: "text-amber-500 bg-amber-500/10", DELETE: "text-rose-500 bg-rose-500/10" };

export default function ActivityLog() {
  const { notify } = useStore();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); try { setRows(await api.sysActivity()); } catch (e) { notify(e.message); } finally { setLoading(false); } }, [notify]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Activity Loggers</h2><p className="text-sm text-slate-400">System e ke ki kaj korlo (audit log) — password log hoy na</p></div>
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : rows.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><ScrollText className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono activity nei.</p></div>
      ) : (
        <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
            <th className="px-5 py-3 font-semibold">User</th><th className="px-5 py-3 font-semibold">Role</th>
            <th className="px-5 py-3 font-semibold">Action</th><th className="px-5 py-3 font-semibold">Time</th></tr></thead>
          <tbody>
            {rows.map((a) => {
              const method = a.action.split(" ")[0];
              return (
                <tr key={a.id} className="border-t border-slate-100 dark:border-white/5">
                  <td className="px-5 py-2.5 font-medium text-slate-700 dark:text-slate-200">{a.user}</td>
                  <td className="px-5 py-2.5 capitalize text-slate-500 dark:text-slate-400">{a.role}</td>
                  <td className="px-5 py-2.5"><span className={`mr-2 rounded px-1.5 py-0.5 text-[10px] font-bold ${methodColor[method] || "text-slate-400 bg-slate-400/10"}`}>{method}</span><span className="font-mono text-xs text-slate-500 dark:text-slate-400">{a.action.split(" ").slice(1).join(" ")}</span></td>
                  <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400">{new Date(a.at).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table></div></div>
      )}
    </div>
  );
}
