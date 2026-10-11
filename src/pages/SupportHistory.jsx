import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, History, Search } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

const prio = { high: "text-rose-500 bg-rose-500/10", medium: "text-amber-500 bg-amber-500/10", low: "text-sky-500 bg-sky-500/10" };

export default function SupportHistory() {
  const { notify } = useStore();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await api.listTickets()); } catch (e) { notify(e.message); } finally { setLoading(false); }
  }, [notify]);
  useEffect(() => { load(); }, [load]);

  const closed = rows.filter((t) => t.status === "closed" && (!q || `${t.id} ${t.subject} ${t.client} ${t.category}`.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="space-y-5">
      <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Support History</h2><p className="text-sm text-slate-400">Closed/resolve kora ticket gula</p></div>
      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className={`${input} pl-9`} placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : closed.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><History className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono closed ticket nei.</p></div>
      ) : (
        <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
            <th className="px-5 py-3 font-semibold">Ticket</th><th className="px-5 py-3 font-semibold">Subject</th>
            <th className="px-5 py-3 font-semibold">Client</th><th className="px-5 py-3 font-semibold">Category</th>
            <th className="px-5 py-3 font-semibold">Priority</th><th className="px-5 py-3 font-semibold">Closed</th></tr></thead>
          <tbody>
            {closed.map((t, i) => (
              <motion.tr key={t._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="border-t border-slate-100 dark:border-white/5">
                <td className="px-5 py-3 font-semibold text-gold-500">{t.id}</td>
                <td className="px-5 py-3 text-slate-700 dark:text-slate-200">{t.subject}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{t.client}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{t.category || "—"}</td>
                <td className="px-5 py-3"><span className={`rounded-md px-2 py-0.5 text-[10px] font-bold capitalize ${prio[t.priority]}`}>{t.priority}</span></td>
                <td className="px-5 py-3 text-slate-400">{t.time}</td>
              </motion.tr>
            ))}
          </tbody>
        </table></div></div>
      )}
    </div>
  );
}
