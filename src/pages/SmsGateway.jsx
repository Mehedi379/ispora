import { useState, useEffect, useCallback } from "react";
import { Loader2, Save, Signal } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";
import Dropdown from "../components/Dropdown";

export default function SmsGateway() {
  const { notify } = useStore();
  const [form, setForm] = useState({ provider: "BulkSMSBD", apiUrl: "", senderId: "", apiKey: "", active: false });
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const g = await api.smsGateway(); setForm({ provider: g.provider, apiUrl: g.apiUrl, senderId: g.senderId, apiKey: "", active: g.active }); setHasKey(g.hasKey); }
    catch (e) { notify(e.message); } finally { setLoading(false); }
  }, [notify]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try { await api.smsSaveGateway(form); notify("Gateway save holo", "success"); await load(); }
    catch (e) { notify(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">SMS Gateway</h2><p className="text-sm text-slate-400">SMS provider API config (key encrypted thake)</p></div>
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : (
        <div className="card max-w-xl space-y-4 p-6">
          <div className="flex items-center gap-2 text-slate-500"><Signal size={18} /><span className="font-semibold">Provider Settings</span>
            <span className={`ml-auto rounded-lg px-2.5 py-1 text-xs font-semibold ${form.active ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-400/10 text-slate-400"}`}>{form.active ? "Active" : "Inactive"}</span>
          </div>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Provider</span>
            <Dropdown value={form.provider} options={["BulkSMSBD", "SSLWireless", "MimSMS", "AlphaSMS", "Twilio", "Other"]} onChange={(v) => setForm({ ...form, provider: v })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">API URL</span>
            <input className={input} value={form.apiUrl} onChange={(e) => setForm({ ...form, apiUrl: e.target.value })} placeholder="https://..." /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Sender ID</span>
              <input className={input} value={form.senderId} onChange={(e) => setForm({ ...form, senderId: e.target.value })} placeholder="ISPora" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">API Key {hasKey ? "(set — khali = unchanged)" : ""}</span>
              <input className={input} type="password" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} placeholder="••••" /></label>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Gateway active (active na thakle SMS simulated hobe)
          </label>
          <button onClick={save} disabled={saving} className="btn-gold">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Gateway</button>
        </div>
      )}
    </div>
  );
}
