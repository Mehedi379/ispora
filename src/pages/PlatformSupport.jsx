import { useState, useEffect, useCallback } from "react";
import { Loader2, LifeBuoy, Send } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";

// Owner support inbox — tenant-der message dekhe reply dey
export default function PlatformSupport() {
  const { notify } = useStore();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyMap, setReplyMap] = useState({});
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setTickets(await api.platformSupport()); } catch (e) { notify(e.message); } finally { setLoading(false); }
  }, [notify]);
  useEffect(() => { load(); }, [load]);

  const sendReply = async (t) => {
    const reply = (replyMap[t.id] || "").trim();
    if (!reply) { notify("Reply likhun"); return; }
    setBusy(t.id);
    try { await api.platformSupportReply(t.id, reply, true); notify("Reply pathano holo", "success"); setReplyMap((m) => ({ ...m, [t.id]: "" })); await load(); }
    catch (e) { notify(e.message); } finally { setBusy(null); }
  };

  if (loading) return <div className="grid place-items-center py-24"><Loader2 className="animate-spin text-gold-500" /></div>;
  const open = tickets.filter((t) => t.status !== "closed");
  const closed = tickets.filter((t) => t.status === "closed");

  const Card = ({ t }) => (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-800 dark:text-white">{t.subject}</p>
          <p className="text-xs text-slate-400">{t.tenant} · {t.tenantEmail} · {new Date(t.createdAt).toLocaleString()}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${t.status === "closed" ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500"}`}>{t.status}</span>
      </div>
      <p className="mt-2 rounded-lg bg-slate-50 dark:bg-navy-800 px-3 py-2 text-sm text-slate-600 dark:text-slate-300">{t.message}</p>
      {t.reply && <p className="mt-2 rounded-lg bg-gold-500/10 px-3 py-2 text-sm text-gold-600 dark:text-gold-300"><b>Apnar reply:</b> {t.reply}</p>}
      {t.status !== "closed" && (
        <div className="mt-3 flex gap-2">
          <input value={replyMap[t.id] || ""} onChange={(e) => setReplyMap((m) => ({ ...m, [t.id]: e.target.value }))} placeholder="Reply likhun..."
            className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-gold-400" />
          <button onClick={() => sendReply(t)} disabled={busy === t.id} className="btn-gold">{busy === t.id ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Reply</button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><LifeBuoy size={22} className="text-gold-500" /> Support Inbox</h2>
        <p className="text-sm text-slate-400">Tenant-ra (ISP) ja message pathay — ekhane reply din.</p>
      </div>
      {tickets.length === 0 && <div className="card p-10 text-center text-sm text-slate-400">Ekhono kono support message nei.</div>}
      {open.length > 0 && <><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Open ({open.length})</p><div className="space-y-3">{open.map((t) => <Card key={t.id} t={t} />)}</div></>}
      {closed.length > 0 && <><p className="pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Closed</p><div className="space-y-3">{closed.map((t) => <Card key={t.id} t={t} />)}</div></>}
    </div>
  );
}
