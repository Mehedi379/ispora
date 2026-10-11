import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Loader2, UserMinus } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";

export default function LeftClients() {
  const { user, notify, refreshClients } = useStore();
  const canManage = user?.role === "admin" || user?.role === "reseller";
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setList(await api.listLeftClients()); setErr(""); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const rejoin = async (c) => {
    setBusy(c.id);
    try { await api.rejoinClient(c.id); await load(); await refreshClients?.(); notify("Customer abar active list e fire gelo", "success"); }
    catch (e) { notify(e.message); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Left Customers</h2>
        <p className="text-sm text-slate-400">Connection chere jawa customer — chaile rejoin korate paren</p>
      </div>

      {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>
      ) : list.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center">
          <UserMinus className="text-slate-300 dark:text-white/20" size={40} />
          <p className="mt-3 text-sm text-slate-400">Kono left customer nei 🎉</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">PPPoE</th>
                  <th className="px-5 py-3 font-semibold">Zone</th>
                  <th className="px-5 py-3 font-semibold">Package</th>
                  <th className="px-5 py-3 font-semibold">Due</th>
                  <th className="px-5 py-3 font-semibold">Left On</th>
                  {canManage && <th className="px-5 py-3 text-right font-semibold">Action</th>}
                </tr>
              </thead>
              <tbody>
                {list.map((c, i) => (
                  <motion.tr key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    className="border-t border-slate-100 dark:border-white/5">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-700 dark:text-slate-200">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.phone}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{c.pppoe}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{c.zone || "—"}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{c.package || "—"}</td>
                    <td className="px-5 py-3 font-semibold text-rose-500">{c.due ? `৳ ${c.due.toLocaleString()}` : "—"}</td>
                    <td className="px-5 py-3 text-xs text-slate-400">{c.leftAt || "—"}</td>
                    {canManage && (
                      <td className="px-5 py-3">
                        <div className="flex justify-end">
                          <button onClick={() => rejoin(c)} disabled={busy === c.id}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-500/20 disabled:opacity-50">
                            {busy === c.id ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Rejoin
                          </button>
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
