import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, User, Mail, Phone, BadgeCheck, Save, Mail as MailIcon, KeyRound, ScrollText, Clock } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

const TABS = ["Personal Information", "Change Password", "Change Mobile Number", "Change Email", "Activity Log", "Login History"];

export default function AccountManage() {
  const { notify, refreshUser } = useStore();
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState("Personal Information");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({});
  const [pass, setPass] = useState({ current: "", next: "" });
  const [activity, setActivity] = useState([]);
  const [logins, setLogins] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const u = await api.me(); setMe(u); setForm({ name: u.name || "", dob: u.dob || "", address: u.address || "", phone: u.phone || "", email: u.email || "", avatar: u.avatar || "" }); }
    catch (e) { notify(e.message); } finally { setLoading(false); }
  }, [notify]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === "Activity Log") api.myActivity().then(setActivity).catch(() => {}); if (tab === "Login History") api.myLogins().then(setLogins).catch(() => {}); }, [tab]);

  const saveProfile = async (fields, msg) => {
    setBusy(true); setErr("");
    try { await api.updateProfile(fields); await load(); await refreshUser?.(); notify(msg || "Save holo", "success"); }
    catch (e) { setErr(e.message); notify(e.message); } finally { setBusy(false); }
  };
  const changePass = async () => {
    setBusy(true); setErr("");
    try { await api.changePassword(pass.current, pass.next); setPass({ current: "", next: "" }); notify("Password change holo", "success"); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  if (loading) return <div className="grid place-items-center py-24"><Loader2 className="animate-spin text-gold-500" /></div>;
  const initial = (me?.name || "A").charAt(0).toUpperCase();

  return (
    <div className="space-y-5">
      <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Account Manage</h2><p className="text-sm text-slate-400">Apnar account manage korun</p></div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left info card */}
        <div className="card overflow-hidden">
          <div className="bg-navy-900 py-6 text-center text-white"><p className="font-display text-lg font-bold">{me?.name}</p></div>
          <div className="grid place-items-center py-5">
            <div className="grid h-24 w-24 place-items-center rounded-full border-4 border-dashed border-slate-300 dark:border-white/15 text-3xl font-bold text-gold-500">{initial}</div>
          </div>
          <div className="space-y-2.5 px-5 pb-6 text-sm">
            <p className="flex items-center gap-2 text-slate-500 dark:text-slate-400"><User size={14} /> Login UserName: <b className="text-slate-700 dark:text-slate-200">{me?.email}</b></p>
            <p className="flex items-center gap-2 text-slate-500 dark:text-slate-400"><BadgeCheck size={14} /> Status: <span className="font-semibold text-emerald-500">{me?.active === false ? "Inactive" : "Active"}</span></p>
            <p className="flex items-center gap-2 text-slate-500 dark:text-slate-400"><Phone size={14} /> Mobile: <b className="text-slate-700 dark:text-slate-200">{me?.phone || "—"}</b></p>
            <p className="flex items-center gap-2 text-slate-500 dark:text-slate-400"><Mail size={14} /> Email: <b className="text-slate-700 dark:text-slate-200">{me?.email}</b></p>
            <p className="flex items-center gap-2 text-slate-500 dark:text-slate-400"><Clock size={14} /> Joined: <b className="text-slate-700 dark:text-slate-200">{me?.createdAt ? new Date(me.createdAt).toLocaleDateString() : "—"}</b></p>
          </div>
        </div>

        {/* Right: tabs */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-5 flex flex-wrap gap-1 border-b border-slate-100 dark:border-white/5">
            {TABS.map((t) => (
              <button key={t} onClick={() => { setTab(t); setErr(""); }} className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${tab === t ? "border-gold-500 text-gold-500" : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}`}>{t}</button>
            ))}
          </div>
          {err && <p className="mb-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <TabBody {...{ tab, form, setForm, pass, setPass, saveProfile, changePass, busy, activity, logins }} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>{children}</label>;
}

function TabBody({ tab, form, setForm, pass, setPass, saveProfile, changePass, busy, activity, logins }) {
  const btn = (fn) => <button onClick={fn} disabled={busy} className="btn-gold mt-2">{busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save</button>;
  if (tab === "Personal Information") return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Full Name"><input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Date of Birth"><input className={input} type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} /></Field>
      <Field label="Avatar URL"><input className={input} value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} placeholder="https://..." /></Field>
      <Field label="Address"><input className={input} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
      <div className="sm:col-span-2">{btn(() => saveProfile({ name: form.name, dob: form.dob, address: form.address, avatar: form.avatar }, "Personal info update holo"))}</div>
    </div>
  );
  if (tab === "Change Password") return (
    <div className="max-w-md space-y-4">
      <Field label="Current Password"><input className={input} type="password" value={pass.current} onChange={(e) => setPass({ ...pass, current: e.target.value })} /></Field>
      <Field label="New Password (6+ char)"><input className={input} type="password" value={pass.next} onChange={(e) => setPass({ ...pass, next: e.target.value })} /></Field>
      <button onClick={changePass} disabled={busy} className="btn-gold">{busy ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />} Change Password</button>
    </div>
  );
  if (tab === "Change Mobile Number") return (
    <div className="max-w-md space-y-4">
      <Field label="Mobile Number"><input className={input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
      {btn(() => saveProfile({ phone: form.phone }, "Mobile update holo"))}
    </div>
  );
  if (tab === "Change Email") return (
    <div className="max-w-md space-y-4">
      <Field label="Email"><input className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
      {btn(() => saveProfile({ email: form.email }, "Email update holo"))}
    </div>
  );
  if (tab === "Activity Log") return (
    <div className="space-y-1.5">
      {activity.length === 0 ? <p className="py-6 text-center text-sm text-slate-400">Kono activity nei.</p> : activity.map((a) => (
        <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-white/5">
          <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{a.action}</span><span className="text-xs text-slate-400">{new Date(a.at).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
  if (tab === "Login History") return (
    <div className="space-y-1.5">
      {logins.length === 0 ? <p className="py-6 text-center text-sm text-slate-400">Kono login history nei.</p> : logins.map((l) => (
        <div key={l.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-white/5">
          <span className="text-slate-600 dark:text-slate-300">IP: {l.ip}</span><span className="text-xs text-slate-400">{new Date(l.at).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
  return null;
}
