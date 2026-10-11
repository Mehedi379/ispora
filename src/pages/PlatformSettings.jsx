import { useState, useEffect, useCallback } from "react";
import { Loader2, Settings as SettingsIcon, Save, Smartphone, CreditCard } from "lucide-react";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

const ACTIONS = ["Send Money", "Payment", "Cash Out"];

// Module-level — render body-r bhitore define korle input focus 1 char por chole jay
function TextField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <input className={input} type={type} value={value || ""} onChange={onChange} placeholder={placeholder} />
    </label>
  );
}

// Ekta mobile-banking method row: on/off toggle + number + action (Send Money/Payment/Cash Out)
function MethodRow({ label, enabled, onToggle, number, onNumber, action, onAction }) {
  return (
    <div className={`rounded-xl border p-3 transition ${enabled ? "border-slate-200 dark:border-white/10" : "border-slate-100 dark:border-white/5 opacity-60"}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
        <button onClick={onToggle} title={enabled ? "On — tenant-ke dekhabe. Off korte click." : "Off — hidden. On korte click."}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${enabled ? "bg-emerald-500" : "bg-slate-400/40"}`}>
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>
      <input className={input} value={number || ""} onChange={onNumber} placeholder="01XXXXXXXXX" disabled={!enabled} />
      <div className="mt-2">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Tenant ki korbe</span>
        <Dropdown value={action || "Send Money"} options={ACTIONS} onChange={onAction} disabled={!enabled} />
      </div>
    </div>
  );
}

// Platform Owner — payment config: method on/off + number + action + instruction, ar SSLCOMMERZ.
export default function PlatformSettings() {
  const { notify } = useStore();
  const [f, setF] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const toggle = (k) => () => setF((p) => ({ ...p, [k]: p[k] === "false" ? "true" : "false" }));
  const setVal = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try { setF(await api.platformSettings()); } catch (e) { notify(e.message); } finally { setLoading(false); }
  }, [notify]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setBusy(true);
    try { setF(await api.platformSaveSettings(f)); notify("Settings save holo", "success"); }
    catch (e) { notify(e.message); } finally { setBusy(false); }
  };

  if (loading || !f) return <div className="grid place-items-center py-24"><Loader2 className="animate-spin text-gold-500" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><SettingsIcon size={22} className="text-gold-500" /> Payment Settings</h2>
          <p className="text-sm text-slate-400">Kon method on/off, kon number, tenant ki korbe (Send Money/Payment/Cash Out) — shob ekhan theke.</p>
        </div>
        <button onClick={save} disabled={busy} className="btn-gold">{busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save</button>
      </div>

      <div className="card p-5">
        <p className="mb-4 flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200"><Smartphone size={16} className="text-gold-500" /> Manual Payment — jeta Off thakbe tenant-er kase dekhabe na</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MethodRow label="bKash" enabled={f.bkashEnabled !== "false"} onToggle={toggle("bkashEnabled")} number={f.bkashNumber} onNumber={set("bkashNumber")} action={f.bkashAction} onAction={setVal("bkashAction")} />
          <MethodRow label="Nagad" enabled={f.nagadEnabled !== "false"} onToggle={toggle("nagadEnabled")} number={f.nagadNumber} onNumber={set("nagadNumber")} action={f.nagadAction} onAction={setVal("nagadAction")} />
          <MethodRow label="Rocket" enabled={f.rocketEnabled !== "false"} onToggle={toggle("rocketEnabled")} number={f.rocketNumber} onNumber={set("rocketNumber")} action={f.rocketAction} onAction={setVal("rocketAction")} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={`rounded-xl border p-3 ${f.bankEnabled !== "false" ? "border-slate-200 dark:border-white/10" : "opacity-60 border-slate-100 dark:border-white/5"}`}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Bank</span>
              <button onClick={toggle("bankEnabled")} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${f.bankEnabled !== "false" ? "bg-emerald-500" : "bg-slate-400/40"}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${f.bankEnabled !== "false" ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
            <input className={input} value={f.bankInfo || ""} onChange={set("bankInfo")} placeholder="A/C name, number, branch" disabled={f.bankEnabled === "false"} />
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Instruction / Comment (tenant-ke dekhabe)</span>
            <textarea className={`${input} h-[90px] resize-none`} value={f.payNote || ""} onChange={set("payNote")} placeholder="jemon: Send Money korun, reference-e apnar ISP naam din. 2 ghontar moddhe active hobe." />
          </label>
        </div>
      </div>

      <div className="card p-5">
        <p className="mb-4 flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200"><CreditCard size={16} className="text-gold-500" /> Online Gateway (SSLCOMMERZ)</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Payment Mode</span>
            <Dropdown value={f.payMode} options={[{ value: "manual", label: "Manual (bKash/Nagad — owner confirm)" }, { value: "sslcommerz", label: "SSLCOMMERZ (auto online)" }]} onChange={setVal("payMode")} />
          </label>
          <TextField label="SSLCOMMERZ Store ID" value={f.sslczStoreId} onChange={set("sslczStoreId")} placeholder="yourstore0live" />
          <TextField label="SSLCOMMERZ Store Password" value={f.sslczStorePasswd} onChange={set("sslczStorePasswd")} placeholder="••••••••" type="password" />
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Mode</span>
            <Dropdown value={f.sslczSandbox} options={[{ value: "true", label: "Sandbox (test)" }, { value: "false", label: "Live" }]} onChange={setVal("sslczSandbox")} />
          </label>
        </div>
        <p className="mt-3 text-xs text-slate-400">Mode "SSLCOMMERZ" + key dile tenant online (bKash/Nagad/card) pay korle auto active hobe. Na dile manual-i cholbe.</p>
      </div>
    </div>
  );
}
