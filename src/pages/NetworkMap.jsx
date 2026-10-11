import { useState, useEffect, useCallback } from "react";
import { Loader2, MapPin } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";

const typeColor = { datacenter: "#f59e0b", pop: "#38bdf8", tower: "#a78bfa", switch: "#34d399" };

export default function NetworkMap() {
  const { notify } = useStore();
  const [pops, setPops] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setPops(await api.netPops()); } catch (e) { notify(e.message); } finally { setLoading(false); }
  }, [notify]);
  useEffect(() => { load(); }, [load]);

  const geo = pops.filter((p) => p.lat != null && p.lng != null);
  const noGeo = pops.filter((p) => p.lat == null || p.lng == null);
  // Normalize lat/lng to 0-100% (lat inverted: beshi lat = upore)
  const lats = geo.map((p) => p.lat), lngs = geo.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const px = (p) => (maxLng === minLng ? 50 : ((p.lng - minLng) / (maxLng - minLng)) * 90 + 5);
  const py = (p) => (maxLat === minLat ? 50 : (1 - (p.lat - minLat) / (maxLat - minLat)) * 90 + 5);

  return (
    <div className="space-y-5">
      <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Network View in Map</h2><p className="text-sm text-slate-400">POP location (lat/lng) map-e</p></div>
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : (
        <>
          <div className="card relative overflow-hidden" style={{ height: 460, backgroundImage: "radial-gradient(circle, rgba(100,116,139,0.15) 1px, transparent 1px)", backgroundSize: "28px 28px" }}>
            {geo.length === 0 ? (
              <div className="grid h-full place-items-center text-center"><div><MapPin className="mx-auto text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono POP e lat/lng set kora nei. Network POP page e coordinate din.</p></div></div>
            ) : geo.map((p) => (
              <div key={p.id} className="absolute -translate-x-1/2 -translate-y-full" style={{ left: `${px(p)}%`, top: `${py(p)}%` }}>
                <div className="flex flex-col items-center">
                  <MapPin size={30} style={{ color: typeColor[p.type] || "#38bdf8" }} className="drop-shadow" fill="currentColor" fillOpacity={0.25} />
                  <span className="mt-0.5 whitespace-nowrap rounded bg-navy-900/90 px-1.5 py-0.5 text-[10px] font-medium text-white">{p.name}</span>
                </div>
              </div>
            ))}
          </div>
          {noGeo.length > 0 && <p className="text-xs text-slate-400">Coordinate nei: {noGeo.map((p) => p.name).join(", ")}</p>}
        </>
      )}
    </div>
  );
}
