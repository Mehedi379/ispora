import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Trash2, RotateCcw, UserX, Loader2, AlertTriangle } from "lucide-react";
import Modal from "../components/Modal";
import { useStore } from "../store";
import { api } from "../api";

export default function DeletedCustomers() {
  const { user, refreshClients } = useStore();
  const isAdmin = user?.role === "admin";
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toPurge, setToPurge] = useState(null);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setList(await api.listDeletedClients()); setErr(""); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { if (isAdmin) load(); else setLoading(false); }, [isAdmin, load]);

  const restore = async (c) => {
    setBusy(c.id);
    try { await api.restoreClient(c.id); await load(); await refreshClients?.(); }
    catch (e) { setErr(e.message); }
    finally { setBusy(null); }
  };

  const purge = async () => {
    setBusy(toPurge.id);
    try { await api.purgeClient(toPurge.id); setToPurge(null); await load(); }
    catch (e) { setErr(e.message); setToPurge(null); }
    finally { setBusy(null); }
  };

  if (!isAdmin) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="card max-w-sm p-8 text-center">
          <UserX className="mx-auto text-slate-400" size={32} />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">Ei page shudhu admin dekhte pare.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Deleted Customers</h2>
        <p className="text-sm text-slate-400">Delete kora customer recycle bin — restore korun ba permanent delete korun</p>
      </div>

      {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>
      ) : list.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center">
          <Trash2 className="text-slate-300 dark:text-white/20" size={40} />
          <p className="mt-3 text-sm text-slate-400">Recycle bin khali — kono deleted customer nei 🎉</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">PPPoE</th>
                  <th className="px-5 py-3 font-semibold">Zone</th>
                  <th className="px-5 py-3 font-semibold">Package</th>
                  <th className="px-5 py-3 font-semibold">Due</th>
                  <th className="px-5 py-3 font-semibold">Deleted</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c, i) => (
                  <motion.tr key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }}
                    className="border-b border-slate-50 dark:border-white/5 last:border-0">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-700 dark:text-slate-200">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.phone}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{c.pppoe}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{c.zone || "—"}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{c.package || "—"}</td>
                    <td className="px-5 py-3 font-semibold text-rose-500">{c.due ? `৳ ${c.due.toLocaleString()}` : "—"}</td>
                    <td className="px-5 py-3 text-xs text-slate-400">{c.deletedAt || "—"}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => restore(c)} disabled={busy === c.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-500/20 disabled:opacity-50">
                          {busy === c.id ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Restore
                        </button>
                        <button onClick={() => setToPurge(c)} disabled={busy === c.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-500 transition hover:bg-rose-500/20 disabled:opacity-50">
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={!!toPurge} onClose={() => setToPurge(null)} title="Permanent Delete?" subtitle={toPurge?.name} size="sm"
        footer={<><button onClick={() => setToPurge(null)} className="btn-ghost">Cancel</button>
          <button onClick={purge} disabled={busy === toPurge?.id} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50">
            {busy === toPurge?.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Permanent Delete</button></>}>
        <div className="flex gap-3 rounded-xl bg-rose-500/10 p-3.5 text-sm text-rose-600 dark:text-rose-300">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p><b className="text-slate-700 dark:text-white">{toPurge?.name}</b> ebong er shob invoice, payment o ticket database theke <b>puro muche jabe</b>. Eta ar firiye ana jabe na.</p>
        </div>
      </Modal>
    </div>
  );
}
