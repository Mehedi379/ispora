import { useState, useEffect, useCallback } from "react";
import { Loader2, Send, FlaskConical } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";
import Dropdown from "../components/Dropdown";
import { clientLabel } from "../data";

// view: "bulk" (Send SMS) | "individual" (Individual SMS)
export default function SmsSend({ view = "bulk" }) {
  const { notify, clients } = useStore();
  const [templates, setTemplates] = useState([]);
  const [groups, setGroups] = useState([]);
  const [target, setTarget] = useState("all"); // all | group | manual
  const [groupId, setGroupId] = useState("");
  const [manual, setManual] = useState("");
  const [clientId, setClientId] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const load = useCallback(async () => {
    try { const [t, g] = await Promise.all([api.crudList("sms", "templates").catch(() => []), api.crudList("sms", "groups").catch(() => [])]); setTemplates(t); setGroups(g); }
    catch (e) { notify(e.message); }
  }, [notify]);
  useEffect(() => { load(); }, [load]);

  const send = async () => {
    setSending(true); setResult(null);
    try {
      let payload = { body };
      if (view === "individual") {
        const c = clients.find((x) => String(x.id) === String(clientId));
        if (!c?.phone) { notify("Client phone nei"); setSending(false); return; }
        payload.phones = [c.phone];
      } else if (target === "all") payload.all = true;
      else if (target === "group") payload.groupId = Number(groupId);
      else payload.phones = manual.split(/[\n,]/).map((p) => p.trim()).filter(Boolean);
      const res = await api.smsSend(payload);
      setResult(res);
    } catch (e) { notify(e.message); } finally { setSending(false); }
  };

  return (
    <div className="space-y-5">
      <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">{view === "individual" ? "Individual SMS" : "Send SMS"}</h2><p className="text-sm text-slate-400">{view === "individual" ? "Ek customer ke SMS" : "Bulk SMS — group/all/manual"}</p></div>
      <div className="card max-w-xl space-y-4 p-6">
        {view === "individual" ? (
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Customer</span>
            <Dropdown value={clientId} options={clients.map((c) => ({ value: c.id, label: `${clientLabel(c)} · ${c.phone}` }))} onChange={(v) => setClientId(v || "")} placeholder="Customer" /></label>
        ) : (
          <>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Send To</span>
              <Dropdown value={target} options={[{ value: "all", label: "All active customers" }, { value: "group", label: "SMS Group" }, { value: "manual", label: "Manual numbers" }]} onChange={(v) => setTarget(v)} /></label>
            {target === "group" && <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Group</span>
              <Dropdown value={groupId} options={groups.map((g) => ({ value: g.id, label: `${g.name} (${g.count})` }))} onChange={(v) => setGroupId(v || "")} placeholder="Group" /></label>}
            {target === "manual" && <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Numbers (comma/newline)</span>
              <textarea className={input} rows={2} value={manual} onChange={(e) => setManual(e.target.value)} placeholder="01711111111, 01822222222" /></label>}
          </>
        )}
        <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Template (optional)</span>
          <Dropdown value="" options={templates.map((t) => ({ value: t.id, label: t.name }))} onChange={(v) => { const t = templates.find((x) => String(x.id) === String(v)); if (t) setBody(t.body); }} placeholder="Template select kore body boshan" /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Message</span>
          <textarea className={input} rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="SMS body..." /></label>
        <button onClick={send} disabled={sending || !body} className="btn-gold">{sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send</button>
      </div>
      {result && (
        <div className={`card max-w-xl p-4 text-sm ${result.simulated ? "border-amber-500/30" : ""}`}>
          {result.simulated && <p className="mb-1 text-amber-600 dark:text-amber-400"><FlaskConical size={13} className="mr-1 inline" /> Simulated — gateway active na, tai actually SMS jayni (log e ache)</p>}
          <p className="font-semibold text-slate-800 dark:text-white">{result.count} ta SMS {result.status === "sent" ? "pathano holo" : "queue/log holo"}</p>
        </div>
      )}
    </div>
  );
}
