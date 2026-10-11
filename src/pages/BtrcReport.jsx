import { useState, useEffect, useCallback } from "react";
import { Loader2, FileBarChart } from "lucide-react";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function BtrcReport() {
  const { notify } = useStore();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); try { setD(await api.reportBtrc(month, year)); } catch (e) { notify(e.message); } finally { setLoading(false); } }, [month, year, notify]);
  useEffect(() => { load(); }, [load]);

  const Row = ({ label, value }) => (<div className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0 dark:border-white/5"><span className="text-slate-600 dark:text-slate-300">{label}</span><span className="font-display text-lg font-bold text-slate-800 dark:text-white">{value}</span></div>);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">BTRC Monthly Report</h2><p className="text-sm text-slate-400">Regulatory subscriber o revenue report</p></div>
        <div className="flex items-end gap-2">
          <Dropdown value={month} options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))} onChange={(v) => setMonth(v)} />
          <input className={`${input} w-24`} type="number" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
      </div>
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : d && (
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2 text-slate-500"><FileBarChart size={18} /> <span className="font-semibold">{MONTHS[d.month - 1]} {d.year}</span></div>
          <Row label="Total Subscribers" value={d.totalSubscribers} />
          <Row label="Active Subscribers" value={d.activeSubscribers} />
          <Row label="New Connections (this month)" value={d.newConnections} />
          <Row label="Disconnections (this month)" value={d.disconnections} />
          <Row label="Revenue (this month)" value={`৳${d.revenue.toLocaleString()}`} />
          <p className="mt-4 text-xs text-slate-400">* BTRC submission er jonno ei number gula use korun. Report print/export pore add kora jabe.</p>
        </div>
      )}
    </div>
  );
}
