import { useState, useEffect, useCallback } from "react";
import { Loader2, Save } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";
import Dropdown from "../components/Dropdown";

// Generic settings form (System setup pages). fields: [{key,label,type,options?}]
export default function SysSetup({ title, subtitle, fields }) {
  const { notify } = useStore();
  const [all, setAll] = useState({});
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const s = await api.getSettings(); setAll(s); const f = {}; for (const fl of fields) f[fl.key] = s[fl.key] ?? ""; setForm(f); }
    catch (e) { notify(e.message); } finally { setLoading(false); }
  }, [fields, notify]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try { await api.saveSettings({ ...all, ...form }); notify(`${title} save holo`, "success"); await load(); }
    catch (e) { notify(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">{title}</h2><p className="text-sm text-slate-400">{subtitle}</p></div>
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : (
        <div className="card max-w-xl space-y-4 p-6">
          {fields.map((f) => (
            <label key={f.key} className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">{f.label}</span>
              {f.type === "select" ? (
                <Dropdown value={form[f.key] ?? ""} options={f.options} onChange={(v) => setForm({ ...form, [f.key]: v })} />
              ) : f.type === "textarea" ? (
                <textarea className={input} rows={3} value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
              ) : (
                <input className={input} type={f.type === "number" ? "number" : f.type === "password" ? "password" : "text"} value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder || ""} />
              )}
            </label>
          ))}
          <button onClick={save} disabled={saving} className="btn-gold">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save</button>
        </div>
      )}
    </div>
  );
}
