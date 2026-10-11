import { useState, useEffect, useCallback } from "react";
import { Loader2, Send, LifeBuoy, CheckCircle2 } from "lucide-react";
import Modal from "./Modal";
import { useStore } from "../store";
import { api } from "../api";

// Tenant (ISP) ISPora owner-er sathe contact kore — support ticket
export default function ContactSupportModal({ open, onClose }) {
  const { notify } = useStore();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setTickets(await api.saasSupportList()); } catch { /* ignore */ }
  }, []);
  useEffect(() => { if (open) load(); }, [open, load]);

  const submit = async () => {
    if (!subject.trim() || !message.trim()) { notify("Subject ar message din"); return; }
    setBusy(true);
    try {
      await api.saasSupportCreate({ subject: subject.trim(), message: message.trim() });
      setSubject(""); setMessage("");
      notify("Message pathano holo — owner reply dibe", "success");
      await load();
    } catch (e) { notify(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Contact ISPora Support" subtitle="Amader sathe jogajog korun" size="md"
      footer={<button onClick={onClose} className="btn-ghost">Close</button>}>
      <div className="space-y-3">
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject"
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-800 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-gold-400" />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Apnar shomossa / proshno likhun..."
          className="h-28 w-full resize-none rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-800 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-gold-400" />
        <button onClick={submit} disabled={busy} className="btn-gold w-full justify-center">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Pathan
        </button>

        {tickets.length > 0 && (
          <div className="mt-2 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Agের message</p>
            {tickets.map((t) => (
              <div key={t.id} className="rounded-xl border border-slate-100 dark:border-white/5 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-200">{t.subject}</span>
                  <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${t.status === "closed" ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500"}`}>{t.status}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.message}</p>
                {t.reply && <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-gold-500/10 px-2.5 py-1.5 text-xs text-gold-600 dark:text-gold-300"><LifeBuoy size={13} className="mt-0.5 shrink-0" /> <span><b>Owner:</b> {t.reply}</span></p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
