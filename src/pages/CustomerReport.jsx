import { useState, useEffect, useCallback } from "react";
import { Loader2, Users } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";

export default function CustomerReport() {
  const { notify } = useStore();
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); try { setD(await api.reportCustomer()); } catch (e) { notify(e.message); } finally { setLoading(false); } }, [notify]);
  useEffect(() => { load(); }, [load]);

  const Tile = ({ label, value, color }) => (<div className="card p-4"><p className="text-xs text-slate-400">{label}</p><p className={`font-display text-2xl font-bold ${color}`}>{value}</p></div>);
  const Breakdown = ({ title, rows }) => (
    <div className="card p-5"><h3 className="mb-2 font-display font-bold text-slate-800 dark:text-white">{title}</h3>
      {rows.map((r) => (<div key={r.name} className="flex items-center justify-between border-b border-slate-50 py-1.5 text-sm last:border-0 dark:border-white/5"><span className="text-slate-600 dark:text-slate-300">{r.name}</span><span className="font-semibold text-slate-800 dark:text-white">{r.count}</span></div>))}
    </div>
  );

  return (
    <div className="space-y-5">
      <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Customer Report</h2><p className="text-sm text-slate-400">Customer base er puro chobi</p></div>
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : d && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Tile label="Total" value={d.total} color="text-slate-800 dark:text-white" />
            <Tile label="Active" value={d.active} color="text-emerald-500" />
            <Tile label="Due" value={d.due} color="text-amber-500" />
            <Tile label="Expired" value={d.expired} color="text-rose-500" />
            <Tile label="Suspended" value={d.suspended} color="text-slate-400" />
            <Tile label="Online" value={d.online} color="text-emerald-500" />
            <Tile label="Offline" value={d.offline} color="text-rose-500" />
            <Tile label="Total Due ৳" value={d.totalDue.toLocaleString()} color="text-amber-500" />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Breakdown title="Zone wise" rows={d.byZone} />
            <Breakdown title="Package wise" rows={d.byPackage} />
          </div>
        </>
      )}
    </div>
  );
}
