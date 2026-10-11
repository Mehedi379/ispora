import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Server, Router, Wifi, Users } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";

export default function Network() {
  const { clients } = useStore();
  const [zones, setZones] = useState([]);
  const pins = clients.slice(0, 14);

  useEffect(() => {
    (async () => {
      try { const st = await api.stats(); setZones((st.zones || []).map((z) => z.name || z)); }
      catch (e) { console.error("Network stats load fail:", e); }
    })();
  }, []);

  return (
    <div className="space-y-5">
      <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Network & Map</h2><p className="text-sm text-slate-400">Customer location o topology</p></div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Map */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 p-4 text-slate-600 dark:text-slate-300"><MapPin size={16} className="text-gold-500" /> <span className="text-sm font-semibold">Customer Map</span></div>
          <div className="relative h-80 bg-gradient-to-br from-navy-800 to-navy-950">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(212,175,55,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(212,175,55,0.3) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
            {pins.map((c, i) => (
              <motion.div key={c.id} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05, type: "spring" }}
                className="absolute" style={{ left: `${12 + (i * 37) % 76}%`, top: `${18 + (i * 53) % 64}%` }} title={c.name}>
                <div className={`grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white/80 ${c.online ? "bg-emerald-500" : "bg-rose-500"} shadow-lg`}>
                  <Wifi size={11} className="text-white" />
                </div>
              </motion.div>
            ))}
            <div className="absolute bottom-3 left-3 flex gap-3 rounded-lg bg-navy-950/80 px-3 py-1.5 text-xs backdrop-blur">
              <span className="flex items-center gap-1.5 text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Online</span>
              <span className="flex items-center gap-1.5 text-rose-400"><span className="h-2 w-2 rounded-full bg-rose-500" /> Offline</span>
            </div>
            <span className="absolute bottom-3 right-3 rounded-lg bg-navy-950/80 px-3 py-1.5 text-xs text-slate-400 backdrop-blur">
              Schematic — GPS location na
            </span>
          </div>
        </div>

        {/* Topology */}
        <div className="card p-5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-700 dark:text-white"><Router size={16} className="text-gold-500" /> Network Diagram</h3>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 px-4 py-2.5 text-sm font-bold text-navy-950 shadow-gold"><Server size={16} /> MT-Core-01</div>
            <div className="h-6 w-px bg-slate-300 dark:bg-white/20" />
            <div className="flex gap-6">
              {zones.slice(0, 3).map((z, i) => (
                <motion.div key={z} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }} className="flex flex-col items-center">
                  <div className="h-6 w-px bg-slate-300 dark:bg-white/20" />
                  <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-navy-800 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300"><Router size={13} /> {z}</div>
                  <div className="h-4 w-px bg-slate-300 dark:bg-white/20" />
                  <div className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-500"><Users size={12} /> {clients.filter((c) => c.zone === z).length}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
