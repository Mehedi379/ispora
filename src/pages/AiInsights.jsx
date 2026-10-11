import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingDown, UserMinus, AlertCircle, ArrowUpRight } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";

export default function AiInsights() {
  const { clients } = useStore();
  const [acc, setAcc] = useState({ income: 0, expense: 0, net: 0 });

  useEffect(() => {
    (async () => {
      try { setAcc(await api.accounting()); }
      catch (e) { console.error("AiInsights data load fail:", e); }
    })();
  }, []);

  // simple heuristics as "AI" insight (honest: rule-based, not ML)
  const churnRisk = clients.filter((c) => c.status === "expired" || c.status === "suspended").slice(0, 5);
  const leakage = clients.filter((c) => c.status === "active" && c.due > 0).slice(0, 4);
  const totalDue = clients.reduce((s, c) => s + (c.due || 0), 0);

  const cards = [
    { title: "Net Profit", icon: TrendingDown, color: "from-sky-400 to-blue-600",
      stat: `৳ ${(acc.net || 0).toLocaleString()}`, sub: "Income − Expense (actual)", trend: acc.net >= 0 ? "healthy" : "loss" },
    { title: "Revenue Leakage", icon: AlertCircle, color: "from-rose-400 to-red-600",
      stat: `৳ ${totalDue.toLocaleString()}`, sub: `${leakage.length} active accounts e due`, trend: "collect korun" },
    { title: "Churn Prediction", icon: UserMinus, color: "from-amber-400 to-orange-600",
      stat: `${churnRisk.length}`, sub: "Customers likely to leave", trend: churnRisk.length ? "high risk" : "stable" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-slate-800 dark:text-white">
            AI Insights <Sparkles size={20} className="text-gold-500" />
          </h2>
          <p className="text-sm text-slate-400">Smart bisleshon — data theke poramorsho</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {cards.map((c, i) => (
          <motion.div key={c.title} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="card relative overflow-hidden p-6">
            <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${c.color} opacity-20 blur-2xl`} />
            <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${c.color} text-white shadow-lg`}><c.icon size={22} /></div>
            <h3 className="mt-4 font-display font-semibold text-slate-800 dark:text-white">{c.title}</h3>
            <p className="mt-2 font-display text-3xl font-extrabold text-slate-800 dark:text-white">{c.stat}</p>
            <p className="text-sm text-slate-400">{c.sub}</p>
            <span className="mt-3 inline-flex items-center gap-1 rounded-lg bg-gold-500/10 px-2.5 py-1 text-xs font-semibold text-gold-600 dark:text-gold-400">
              <ArrowUpRight size={13} /> {c.trend}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-3 font-display font-semibold text-slate-800 dark:text-white">⚠️ Churn Risk — attention din</h3>
          <div className="space-y-2">
            {churnRisk.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-sm">
                <span className="text-slate-600 dark:text-slate-300">{c.name} <span className="text-xs text-slate-400">· {c.zone}</span></span>
                <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-500 capitalize">{c.status}</span>
              </div>
            ))}
            {churnRisk.length === 0 && <p className="py-4 text-center text-xs text-slate-400">Kono risk nei 🎉</p>}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="mb-3 font-display font-semibold text-slate-800 dark:text-white">💸 Revenue Leakage — bill miss</h3>
          <div className="space-y-2">
            {leakage.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-sm">
                <span className="text-slate-600 dark:text-slate-300">{c.name} <span className="text-xs text-slate-400">· {c.package}</span></span>
                <span className="font-semibold text-rose-500">৳ {c.bill}</span>
              </div>
            ))}
            {leakage.length === 0 && <p className="py-4 text-center text-xs text-slate-400">Sob thik ache 🎉</p>}
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400">
        * Ei insight gula apnar current data'r upor vitti kore. Beshi data jomle prediction aro nikhut hobe.
      </p>
    </div>
  );
}
