import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Pencil, Trash2, Plus, Loader2, Tv, Users, UserCheck, UserX, Wallet, KeyRound, Save, ArrowRight } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

const TYPES = ["IPTV", "OTT", "Static IP", "Cloud", "Other"];
const fmt = (n) => `৳${Number(n || 0).toLocaleString()}`;

export default function VasConfig() {
  const { user, notify } = useStore();
  const isAdmin = user?.role === "admin";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [recharging, setRecharging] = useState(null); // service obj
  const [rechargeAmt, setRechargeAmt] = useState("");
  const [form, setForm] = useState({ name: "", type: "IPTV", price: "", logo: "" });
  const [err, setErr] = useState("");
  // OTT Hub API key config
  const [cfg, setCfg] = useState({ apiKeyMasked: "", hasKey: false, mode: "sandbox" });
  const [keyInput, setKeyInput] = useState("");
  const [savingKey, setSavingKey] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, settings] = await Promise.all([api.listVasServices(), api.vasSettings().catch(() => null)]);
      setRows(list);
      if (settings) setCfg(settings);
      setErr("");
    } catch (e) { setErr(e?.message || "Load fail"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({ name: "", type: "IPTV", price: "", logo: "" }); setErr(""); setEditing({}); };
  const openEdit = (s) => { setForm({ name: s.name, type: s.type, price: s.price, logo: s.logo || "", active: s.active }); setErr(""); setEditing(s); };

  const save = async () => {
    setErr("");
    try {
      if (editing.id) await api.updateVasService(editing.id, form);
      else await api.createVasService(form);
      setEditing(null); await load();
    } catch (e) { setErr(e.message); }
  };
  const doDelete = async () => {
    try { await api.deleteVasService(toDelete.id); setToDelete(null); await load(); }
    catch (e) { notify(e.message); setToDelete(null); }
  };
  const toggleActive = async (s) => {
    try { await api.updateVasService(s.id, { active: !s.active }); await load(); }
    catch (e) { notify(e.message); }
  };
  const doRecharge = async () => {
    try { await api.rechargeVasService(recharging.id, Number(rechargeAmt)); setRecharging(null); setRechargeAmt(""); await load(); }
    catch (e) { notify(e.message); }
  };
  const saveKey = async () => {
    setSavingKey(true);
    try { const c = await api.saveVasSettings({ apiKey: keyInput, mode: cfg.mode }); setCfg(c); setKeyInput(""); notify("OTT Hub config save holo"); }
    catch (e) { notify(e.message); }
    finally { setSavingKey(false); }
  };

  const UserRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400"><Icon size={15} /> {label}</span>
      <span className="font-semibold text-slate-700 dark:text-slate-200">{value}</span>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">VAS Config <span className="text-sm font-normal text-slate-400">(Value Added Service)</span></h2>
          <p className="text-sm text-slate-400">OTT / IPTV provider manage korun — balance, user, recharge</p>
        </div>
        {isAdmin && <button onClick={openNew} className="btn-gold"><Plus size={16} /> Add Service</button>}
      </div>

      {err && !editing && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`card p-5 ${!s.active ? "opacity-70" : ""}`}>
              <div className="flex items-start justify-between">
                <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${s.active ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-400/15 text-slate-400"}`}>{s.active ? "Active" : "Inactive"}</span>
                {isAdmin && (
                  <button onClick={() => toggleActive(s)} title={s.active ? "Deactivate" : "Activate"}
                    className={`relative h-6 w-11 rounded-full transition ${s.active ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/15"}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${s.active ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                )}
              </div>

              <div className="mt-4 flex h-16 items-center justify-center">
                {s.logo && /^https?:\/\//.test(s.logo)
                  ? <img src={s.logo} alt={s.name} className="max-h-14 max-w-[70%] object-contain" />
                  : <span className="font-display text-2xl font-extrabold text-slate-700 dark:text-white">{s.logo || s.name}</span>}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pb-3 pt-3 dark:border-white/5">
                <span className="text-sm text-slate-500 dark:text-slate-400">Available Balance</span>
                <span className="font-display text-lg font-bold gold-text">{fmt(s.balance)}</span>
              </div>
              <div className="space-y-2">
                <UserRow icon={Users} label="Total Users" value={s.totalUsers} />
                <UserRow icon={UserCheck} label="Active Users" value={s.activeUsers} />
                <UserRow icon={UserX} label="Inactive Users" value={s.inactiveUsers} />
              </div>
              <p className="mt-3 text-xs text-slate-400">{s.type} · {fmt(s.price)}/sub</p>

              {isAdmin && (
                <div className="mt-4 space-y-2">
                  <button onClick={() => { setRecharging(s); setRechargeAmt(""); }} className="btn-gold w-full justify-center"><Wallet size={15} /> Recharge Amount</button>
                  <div className="flex items-center justify-between">
                    <Link to="/vas/transactions" className="inline-flex items-center gap-1 text-xs font-semibold text-gold-500 hover:underline">Subscribe History <ArrowRight size={13} /></Link>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(s)} className="rounded-lg p-2 text-slate-400 hover:bg-gold-500/10 hover:text-gold-500"><Pencil size={15} /></button>
                      <button onClick={() => setToDelete(s)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={15} /></button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
          {rows.length === 0 && <p className="col-span-full py-12 text-center text-sm text-slate-400">Kono VAS provider nei. "Add Service" diye add korun.</p>}
        </div>
      )}

      {/* OTT Hub explainer + API Key Configuration */}
      <div className="card p-5">
        <h3 className="flex items-center gap-2 font-display font-semibold text-slate-800 dark:text-white"><Tv size={18} className="text-gold-500" /> OTT Hub — Available Packages</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          OTT Hub ekta B2B distribution platform — ISP ra sorasori billing panel theke customer der streaming subscription (Bongo, Chorki ityadi) offer korte pare. Provider dashboard theke <b>Partner API Key</b> niye niche boshan, mode select korun, tarpor client-er <b>Add VAS</b> theke activate korben.
        </p>

        <div className="mt-4 rounded-xl border border-slate-100 p-4 dark:border-white/5">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"><KeyRound size={15} className="text-gold-500" /> API Key Configuration</p>
          <p className="mb-3 mt-0.5 text-xs text-slate-400">
            {cfg.hasKey ? <>Current key: <span className="font-mono">{cfg.apiKeyMasked}</span> · mode <b className="uppercase">{cfg.mode}</b></> : "Ekhono API key set kora nei."}
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <label className="block min-w-[220px] flex-1"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Partner API Key</span>
              <input className={input} value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder={cfg.hasKey ? "Notun key dile replace hobe" : "ott_xxxxxxxxxxxx"} disabled={!isAdmin} /></label>
            <label className="block w-40"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Mode</span>
              <Dropdown value={cfg.mode} options={[{ value: "sandbox", label: "Sandbox" }, { value: "production", label: "Production" }]} onChange={(v) => setCfg({ ...cfg, mode: v })} /></label>
            {isAdmin && <button onClick={saveKey} disabled={savingKey} className="btn-gold">{savingKey ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Key</button>}
          </div>
          {!cfg.hasKey && <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-500">OTT Hub API key configure kora nei. Upore save korun.</p>}
        </div>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Service" : "Add VAS Service"} subtitle={editing?.id ? editing.name : "Notun value added service"}
        footer={<><button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Name</span>
            <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bongo" autoFocus /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Type</span>
              <Dropdown value={form.type} options={TYPES} onChange={(v) => setForm({ ...form, type: v })} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Price (৳)</span>
              <input className={input} type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="300" /></label>
          </div>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Logo (text/emoji ba image URL)</span>
            <input className={input} value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} placeholder="e.g. Bongo  ba  https://.../logo.png" /></label>
        </div>
      </Modal>

      <Modal open={!!recharging} onClose={() => setRecharging(null)} title="Recharge Amount" subtitle={recharging?.name} size="sm"
        footer={<><button onClick={() => setRecharging(null)} className="btn-ghost">Cancel</button><button onClick={doRecharge} className="btn-gold"><Wallet size={15} /> Recharge</button></>}>
        <div className="space-y-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">Current balance: <b className="gold-text">{fmt(recharging?.balance)}</b></p>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Amount (৳)</span>
            <input className={input} type="number" value={rechargeAmt} onChange={(e) => setRechargeAmt(e.target.value)} placeholder="1000" autoFocus /></label>
        </div>
      </Modal>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete Service?" subtitle={toDelete?.name} size="sm"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={doDelete} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"><Trash2 size={15} /> Delete</button></>}>
        <p className="text-sm text-slate-500 dark:text-slate-300"><b className="text-slate-700 dark:text-white">{toDelete?.name}</b> delete korbo?</p>
      </Modal>
    </div>
  );
}
