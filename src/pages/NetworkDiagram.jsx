import { useState, useEffect, useCallback } from "react";
import { Loader2, Share2 } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";

const typeColor = { datacenter: "#f59e0b", pop: "#38bdf8", tower: "#a78bfa", switch: "#34d399" };

export default function NetworkDiagram() {
  const { notify } = useStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api.netDiagram()); } catch (e) { notify(e.message); } finally { setLoading(false); }
  }, [notify]);
  useEffect(() => { load(); }, [load]);

  const W = 760, H = 460, cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 70;
  const pops = data?.pops || [];
  const pos = {};
  pops.forEach((p, i) => {
    const a = (i / Math.max(1, pops.length)) * Math.PI * 2 - Math.PI / 2;
    pos[p.id] = pops.length === 1 ? { x: cx, y: cy } : { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });

  return (
    <div className="space-y-5">
      <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Network Diagram</h2><p className="text-sm text-slate-400">POP topology — node o connection</p></div>
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : pops.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><Share2 className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono POP nei. Network POP page theke add korun.</p></div>
      ) : (
        <div className="card overflow-x-auto p-4">
          <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-3xl" style={{ minWidth: 500 }}>
            {(data.connections || []).map((c) => {
              const a = pos[c.fromId], b = pos[c.toId];
              if (!a || !b) return null;
              return <line key={c.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={c.type === "wireless" ? "#a78bfa" : "#64748b"} strokeWidth="2" strokeDasharray={c.type === "wireless" ? "6 4" : ""} opacity="0.6" />;
            })}
            {pops.map((p) => {
              const { x, y } = pos[p.id];
              return (
                <g key={p.id}>
                  <circle cx={x} cy={y} r="26" fill={typeColor[p.type] || "#38bdf8"} opacity={p.status === "online" ? 0.9 : 0.35} />
                  <circle cx={x} cy={y} r="26" fill="none" stroke={p.status === "online" ? "#10b981" : "#ef4444"} strokeWidth="2.5" />
                  <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">{p.clients}</text>
                  <text x={x} y={y + 44} textAnchor="middle" fontSize="11" fill="currentColor" className="fill-slate-600 dark:fill-slate-300">{p.name}</text>
                </g>
              );
            })}
          </svg>
          <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs text-slate-400">
            {Object.entries(typeColor).map(([t, c]) => <span key={t} className="flex items-center gap-1.5 capitalize"><span className="h-3 w-3 rounded-full" style={{ background: c }} /> {t}</span>)}
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full ring-2 ring-emerald-500" /> online</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full ring-2 ring-rose-500" /> offline</span>
            <span>· node-er number = client count</span>
          </div>
        </div>
      )}
    </div>
  );
}
