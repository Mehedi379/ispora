import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Building2, Receipt, MessageSquare, Save, Wifi, Loader2, Check, KeyRound } from "lucide-react";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";

import { input } from "../ui";
const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
    {children}
  </label>
);

const tabs = [
  { id: "company", label: "Company", icon: Building2 },
  { id: "billing", label: "Billing", icon: Receipt },
  { id: "sms", label: "SMS Gateway", icon: MessageSquare },
  { id: "account", label: "My Account", icon: KeyRound },
];

export default function Settings() {
  const { user } = useStore();
  const isAdmin = user?.role === "admin";
  const [tab, setTab] = useState("company");
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const [reload, setReload] = useState(0);
  const savedTimer = useRef(null);

  // Password change (login credential) — live-e seed password obosshoi change korte hobe
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const onPw = (k) => (e) => setPw((p) => ({ ...p, [k]: e.target.value }));

  const changePw = async () => {
    setPwMsg(""); setPwErr("");
    if (!pw.current) return setPwErr("Current password din");
    if (pw.next.length < 6) return setPwErr("Notun password 6+ char hote hobe");
    if (pw.next !== pw.confirm) return setPwErr("Duita notun password match korche na");
    setPwBusy(true);
    try {
      await api.changePassword(pw.current, pw.next);
      setPw({ current: "", next: "", confirm: "" });
      setPwMsg("Password change hoyeche ✅");
    } catch (e) { setPwErr(e.message); }
    finally { setPwBusy(false); }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await api.getSettings();
        if (alive) { setS(data); setErr(""); }
      } catch (e) { if (alive) setErr(e?.message || "Settings load fail holo"); }
    })();
    return () => { alive = false; };
  }, [reload]);

  // "Saved" flag timer unmount-e clear — purano component-e pora timer
  // notun state set korte parto
  useEffect(() => () => clearTimeout(savedTimer.current), []);

  const set = (k) => (v) => { setS((p) => ({ ...p, [k]: v })); setSaved(false); };
  const onInput = (k) => (e) => set(k)(e.target.value);

  const save = async () => {
    setErr(""); setSaving(true);
    try {
      const updated = await api.saveSettings(s);
      setS(updated); setSaved(true);
      clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 2500);
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  if (!s && !err) {
    return <div className="grid place-items-center py-24"><Loader2 className="animate-spin text-gold-500" /></div>;
  }
  // Load fail hole ageo spinner-i dekhato (error banner ta niche unreachable chilo)
  if (!s && err) {
    return (
      <div className="grid place-items-center py-24 text-center">
        <p className="text-sm text-rose-500">{err}</p>
        <button onClick={() => { setErr(""); setReload((n) => n + 1); }} className="btn-gold mt-4 px-4 py-2 text-sm">
          Abar try korun
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Settings</h2>
        <p className="text-sm text-slate-400">System setup — sob kichu apnar hate</p>
      </div>

      {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
      {!isAdmin && <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">Shudhu admin settings change korte parbe.</p>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_1fr]">
        <div className="card h-fit p-2">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${
                tab === t.id ? "bg-gold-500/10 text-gold-600 dark:text-gold-400" : "text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
              }`}>
              <t.icon size={17} /> {t.label}
            </button>
          ))}
        </div>

        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          {tab === "company" && (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-navy-950 shadow-gold"><Wifi size={28} /></div>
                <div>
                  <p className="font-semibold text-slate-700 dark:text-white">Company Logo</p>
                  <button className="btn-ghost mt-1 !py-1.5 text-xs">Upload Logo</button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Company Name"><input className={input} disabled={!isAdmin} value={s.companyName} onChange={onInput("companyName")} /></Field>
                <Field label="Phone"><input className={input} disabled={!isAdmin} value={s.companyPhone} onChange={onInput("companyPhone")} /></Field>
                <Field label="Email"><input className={input} disabled={!isAdmin} value={s.companyEmail} onChange={onInput("companyEmail")} /></Field>
                <Field label="Address"><input className={input} disabled={!isAdmin} value={s.companyAddress} onChange={onInput("companyAddress")} /></Field>
              </div>
            </div>
          )}
          {tab === "billing" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Monthly Bill Date"><Dropdown disabled={!isAdmin} value={s.billDate} options={["1st of month", "5th of month", "10th of month"]} onChange={set("billDate")} /></Field>
              <Field label="Due After (days)"><input className={input} disabled={!isAdmin} type="number" value={s.dueAfterDays} onChange={onInput("dueAfterDays")} /></Field>
              <Field label="Penalty / Late Fee (৳)"><input className={input} disabled={!isAdmin} type="number" value={s.penalty} onChange={onInput("penalty")} /></Field>
              <Field label="Auto Disconnect on Expiry"><Dropdown disabled={!isAdmin} value={s.autoDisconnect} options={["Enabled", "Disabled"]} onChange={set("autoDisconnect")} /></Field>
              <Field label="VAT (%)"><input className={input} disabled={!isAdmin} type="number" value={s.vat} onChange={onInput("vat")} /></Field>
              <Field label="Currency"><Dropdown disabled={!isAdmin} value={s.currency} options={["BDT (৳)", "USD ($)"]} onChange={set("currency")} /></Field>
            </div>
          )}
          {tab === "sms" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="SMS Provider"><Dropdown disabled={!isAdmin} value={s.smsProvider} options={["BulkSMSBD", "SSL Wireless", "Alpha SMS", "MIM SMS"]} onChange={set("smsProvider")} /></Field>
              <Field label="Sender ID"><input className={input} disabled={!isAdmin} value={s.senderId} onChange={onInput("senderId")} /></Field>
              <Field label="API Key"><input className={input} disabled={!isAdmin} type="password" value={s.smsApiKey} onChange={onInput("smsApiKey")} placeholder="Gateway API key (thakle mask dekhabe)" /></Field>
              <Field label="WhatsApp Notification"><Dropdown disabled={!isAdmin} value={s.whatsapp} options={["Enabled", "Disabled"]} onChange={set("whatsapp")} /></Field>
            </div>
          )}
          {tab === "account" && (
            <div className="max-w-md space-y-4">
              <div>
                <p className="text-sm text-slate-400">Login password change korun — live-e seed theke asha default password obosshoi replace korben.</p>
              </div>
              {pwErr && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{pwErr}</p>}
              {pwMsg && <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">{pwMsg}</p>}
              <Field label="Current Password">
                <input className={input} type="password" value={pw.current} onChange={onPw("current")} autoComplete="current-password" />
              </Field>
              <Field label="New Password">
                <input className={input} type="password" value={pw.next} onChange={onPw("next")} autoComplete="new-password" placeholder="6+ character" />
              </Field>
              <Field label="Confirm New Password">
                <input className={input} type="password" value={pw.confirm} onChange={onPw("confirm")} autoComplete="new-password" />
              </Field>
              <button onClick={changePw} disabled={pwBusy} className="btn-gold disabled:opacity-60">
                {pwBusy ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />} Change Password
              </button>
            </div>
          )}
          {isAdmin && tab !== "account" && (
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-white/5 pt-5">
              {saved && <span className="flex items-center gap-1 text-sm font-medium text-emerald-500"><Check size={16} /> Saved</span>}
              <button onClick={save} disabled={saving} className="btn-gold disabled:opacity-60">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Settings
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
