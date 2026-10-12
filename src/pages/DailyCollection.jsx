import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, Banknote, Users, Receipt } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

const today = () => new Date().toISOString().slice(0, 10);

export default function DailyCollection() {
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api.billingCollection({ from, to })); setErr(""); }
    catch (e) { setErr(e?.message || "Load fail"); }
    finally { setLoading(false); }
  }, [from, to]);
  useEffect(() => { load(); }, [load]);

  const Stat = ({ icon: Icon, label, value, color }) => (
    <div className="card flex items-center gap-3 p-4">
      <div className={`grid h-11 w-11 place-items-center rounded-xl ${color}`}><Icon size={20} /></div>
      <div><p className="text-xs text-slate-400">{label}</p><p className="font-display text-lg font-bold text-slate-800 dark:text-white">{value}</p></div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Daily Bill Collection</h2>
          <p className="text-sm text-slate-400">Ek diner (ba range) collection summary — method & collector wise</p>
        </div>
        <div className="flex items-end gap-2">
          <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">From</span>
            <input type="date" className={input} value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">To</span>
            <input type="date" className={input} value={to} onChange={(e) => setTo(e.target.value)} /></label>
        </div>
      </div>

      {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>
      ) : data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat icon={Banknote} label="Total Collected" value={`৳${data.total.toLocaleString()}`} color="bg-emerald-500/15 text-emerald-500" />
            <Stat icon={Receipt} label="Transactions" value={data.count} color="bg-gold-500/15 text-gold-500" />
            <Stat icon={Users} label="Collectors" value={data.byCollector.length} color="bg-indigo-500/15 text-indigo-500" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="card p-5">
              <h3 className="mb-3 font-display font-bold text-slate-800 dark:text-white">Method wise</h3>
              {data.byMethod.length === 0 ? <p className="text-sm text-slate-400">—</p> : data.byMethod.map((m) => (
                <div key={m.method} className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0 dark:border-white/5">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{m.method}</span>
                  <span className="font-semibold text-slate-800 dark:text-white">৳{m.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="card p-5">
              <h3 className="mb-3 font-display font-bold text-slate-800 dark:text-white">Collector wise</h3>
              {data.byCollector.length === 0 ? <p className="text-sm text-slate-400">—</p> : data.byCollector.map((c) => (
                <div key={c.name} className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0 dark:border-white/5">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{c.name}</span>
                  <span className="font-semibold text-slate-800 dark:text-white">৳{c.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Date</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">C.Code</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">UserName</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Cus. Name</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Mobile</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Note / Remarks</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Method</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Received By</th>
                    <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">Received</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((p, i) => (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.015, 0.3) }}
                      className="border-t border-slate-100 dark:border-white/5">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">{p.date} <span className="text-xs text-slate-400">{p.time}</span></td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-slate-500 dark:text-slate-400">{p.code}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-700 dark:text-slate-200">{p.username || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-700 dark:text-slate-200">{p.client}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">{p.phone || "—"}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{p.note || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">{p.method}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">{p.collectedBy}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600 whitespace-nowrap">৳{p.amount.toLocaleString()}</td>
                    </motion.tr>
                  ))}
                  {data.payments.length === 0 && <tr><td colSpan={9} className="py-12 text-center text-sm text-slate-400">Ei somoye kono collection nei.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
