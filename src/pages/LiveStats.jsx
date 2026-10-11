import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Wifi, WifiOff, Activity, ArrowDown, ArrowUp } from "lucide-react";
import { useStore } from "../store";

function useLiveSpeed(seed) {
  const [v, setV] = useState(seed);
  useEffect(() => {
    const t = setInterval(() => setV(Math.max(2, seed + (Math.random() * 16 - 8))), 1500);
    return () => clearInterval(t);
  }, [seed]);
  return v.toFixed(1);
}

function Row({ c, i }) {
  const down = useLiveSpeed(8 + (i % 5) * 6);
  const up = useLiveSpeed(2 + (i % 3) * 2);
  return (
    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.03, 0.4) }}
      className="flex items-center gap-4 border-t border-slate-100 dark:border-white/5 px-5 py-3">
      <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-navy-700 to-navy-900 text-xs font-bold text-gold-400">
        {c.name.slice(0, 2).toUpperCase()}
        <span className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-navy-900 ${c.online ? "bg-emerald-500" : "bg-slate-400"}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{c.name}</p>
        <p className="text-xs text-slate-400">{c.pppoe} · {c.zone}</p>
      </div>
      {c.online ? (
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1 font-semibold text-sky-500"><ArrowDown size={13} /> {down} <span className="text-slate-400">Mbps</span></span>
          <span className="flex items-center gap-1 font-semibold text-emerald-500"><ArrowUp size={13} /> {up} <span className="text-slate-400">Mbps</span></span>
        </div>
      ) : (
        <span className="text-xs font-medium text-slate-400">Offline</span>
      )}
    </motion.div>
  );
}

export default function LiveStats() {
  const { clients } = useStore();
  const online = clients.filter((c) => c.online);
  const totalDown = online.reduce((s, _, i) => s + 8 + (i % 5) * 6, 0);

  const tiles = [
    { label: "Online Now", value: online.length, icon: Wifi, color: "from-emerald-400 to-green-600" },
    { label: "Offline", value: clients.length - online.length, icon: WifiOff, color: "from-rose-400 to-red-600" },
    { label: "Total Download", value: `${totalDown} Mbps`, icon: Activity, color: "from-sky-400 to-blue-600" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Live Stats</h2>
          <p className="text-sm text-slate-400">Real-time connection monitor · online/offline live, bandwidth demo (MikroTik integration pending)</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
          <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
          LIVE
        </span>
        <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500" title="MikroTik API integration pending — Mbps value gula simulated">
          SIMULATED
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {tiles.map((t, i) => (
          <motion.div key={t.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="card flex items-center gap-4 p-5">
            <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${t.color} text-white shadow-lg`}><t.icon size={22} /></div>
            <div><p className="text-xl font-bold text-slate-800 dark:text-white">{t.value}</p><p className="text-sm text-slate-400">{t.label}</p></div>
          </motion.div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="p-5">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white">Connected Users</h3>
          <p className="text-xs text-slate-400">Online/offline real · up/down Mbps simulated (MikroTik integration pending)</p>
        </div>
        <div className="max-h-[55vh] overflow-y-auto">
          {clients.map((c, i) => <Row key={c.id} c={c} i={i} />)}
        </div>
      </div>
    </div>
  );
}
