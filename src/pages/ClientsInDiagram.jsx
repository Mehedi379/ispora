import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, MapPin, UserPlus, Users } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";
import Dropdown from "../components/Dropdown";
import { clientLabel } from "../data";

export default function ClientsInDiagram() {
  const { user, notify, clients } = useStore();
  const isAdmin = user?.role === "admin";
  const [data, setData] = useState(null);
  const [pops, setPops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState("");
  const [popId, setPopId] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const [d, p] = await Promise.all([api.netClientsInDiagram(), api.netPops()]); setData(d); setPops(p); }
    catch (e) { notify(e.message); } finally { setLoading(false); }
  }, [notify]);
  useEffect(() => { load(); }, [load]);

  const assign = async () => {
    if (!clientId) return;
    setBusy(true);
    try { await api.netAssignClient(Number(clientId), popId ? Number(popId) : null); setClientId(""); setPopId(""); await load(); notify("Client assign holo", "success"); }
    catch (e) { notify(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Clients in Diagram</h2><p className="text-sm text-slate-400">Kon client kon POP er niche — assign korun</p></div>

      {isAdmin && (
        <div className="card flex flex-wrap items-end gap-3 p-4">
          <label className="block flex-1 min-w-[200px]"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Client</span>
            <Dropdown value={clientId} options={clients.map((c) => ({ value: c.id, label: clientLabel(c) }))} onChange={(v) => setClientId(v || "")} placeholder="Client" /></label>
          <label className="block flex-1 min-w-[160px]"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">POP</span>
            <Dropdown value={popId} options={pops.map((p) => ({ value: p.id, label: p.name }))} onChange={(v) => setPopId(v || "")} placeholder="Unassign" /></label>
          <button onClick={assign} disabled={!clientId || busy} className="btn-gold">{busy ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />} Assign</button>
        </div>
      )}

      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : data && (
        <>
          <p className="text-sm text-slate-400"><Users size={14} className="mr-1 inline" /> {data.unassigned} client kono POP e assign kora nei</p>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {data.pops.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
                <div className="flex items-center gap-2"><MapPin size={16} className="text-gold-500" /><p className="font-semibold text-slate-800 dark:text-white">{p.name}</p>
                  <span className="ml-auto rounded-lg bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-500">{p.clients.length}</span></div>
                <div className="mt-3 space-y-1.5">
                  {p.clients.slice(0, 8).map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-300">{c.name}</span>
                      <span className="text-xs text-slate-400">{c.pppoe}</span>
                    </div>
                  ))}
                  {p.clients.length === 0 && <p className="text-xs text-slate-400">Kono client nei</p>}
                  {p.clients.length > 8 && <p className="text-xs text-slate-400">+{p.clients.length - 8} aro</p>}
                </div>
              </motion.div>
            ))}
            {data.pops.length === 0 && <p className="col-span-full py-12 text-center text-sm text-slate-400">Age POP banan.</p>}
          </div>
        </>
      )}
    </div>
  );
}
