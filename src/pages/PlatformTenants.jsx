import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, Building2, Users, KeyRound, Copy, CheckCircle2 } from "lucide-react";
import Dropdown from "../components/Dropdown";
import Modal from "../components/Modal";
import { useStore } from "../store";
import { api } from "../api";

const STATUSES = ["trial", "active", "past_due", "suspended"];
const badge = {
  trial: "bg-sky-500/15 text-sky-500", active: "bg-emerald-500/15 text-emerald-500",
  past_due: "bg-amber-500/15 text-amber-500", suspended: "bg-rose-500/15 text-rose-500",
};

// Platform Owner — kon ISP software use korche, koto user, kon plan, ke paid/trial.
export default function PlatformTenants() {
  const { notify } = useStore();
  const [rows, setRows] = useState([]);
  const [plans, setPlans] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetFor, setResetFor] = useState(null); // tenant jar password reset
  const [resetPw, setResetPw] = useState("");
  const [resetResult, setResetResult] = useState(null); // { email, password }
  const [resetBusy, setResetBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, p, o] = await Promise.all([api.platformTenants(), api.platformPlans(), api.platformOverview()]);
      setRows(t); setPlans(p); setOverview(o);
    } catch (e) { notify(e.message); } finally { setLoading(false); }
  }, [notify]);
  useEffect(() => { load(); }, [load]);

  const setPlan = async (t, planId) => {
    try { await api.platformUpdateTenant(t.id, { planId }); notify("Plan update holo", "success"); await load(); }
    catch (e) { notify(e.message); }
  };
  const setStatus = async (t, status) => {
    try { await api.platformUpdateTenant(t.id, { status }); notify("Status update holo", "success"); await load(); }
    catch (e) { notify(e.message); }
  };
  const confirmPay = async (t) => {
    try { await api.platformConfirmPayment(t.id); notify(`${t.businessName} active holo`, "success"); await load(); }
    catch (e) { notify(e.message); }
  };
  const renew = async (t) => {
    try { await api.platformRenewTenant(t.id); notify(`${t.businessName} renew holo (+30 din)`, "success"); await load(); }
    catch (e) { notify(e.message); }
  };
  const openReset = (t) => { setResetFor(t); setResetPw(""); setResetResult(null); };
  const doReset = async () => {
    setResetBusy(true);
    try {
      const r = await api.platformResetPassword(resetFor.id, resetPw.trim() || undefined);
      setResetResult({ email: r.email, password: r.password });
      notify("Password reset holo", "success");
    } catch (e) { notify(e.message); } finally { setResetBusy(false); }
  };

  const planOpts = [{ value: "", label: "— No plan —" }, ...plans.map((p) => ({ value: p.id, label: `${p.name} (৳${p.priceMonthly})` }))];

  const Stat = ({ label, value, cls }) => (
    <div className="card p-4"><p className="text-xs uppercase tracking-wide text-slate-400">{label}</p><p className={`mt-1 font-display text-2xl font-bold ${cls || "text-slate-800 dark:text-white"}`}>{value}</p></div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><Building2 size={22} className="text-gold-500" /> Tenants (ISP)</h2>
        <p className="text-sm text-slate-400">Jara tomar software use korche — plan assign, status control.</p>
      </div>

      {overview && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Total ISP" value={overview.tenants} />
          <Stat label="Active" value={overview.active} cls="text-emerald-500" />
          <Stat label="Trial" value={overview.trial} cls="text-sky-500" />
          <Stat label="Active Plans" value={overview.plans} cls="text-gold-500" />
        </div>
      )}

      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy-900 text-[11px] uppercase tracking-wide text-slate-300">
                <tr>
                  <th className="px-4 py-3">Business</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-center">Usage</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Next Bill</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t, i) => {
                  const over = t.maxUsers > 0 && t.usedUsers > t.maxUsers;
                  return (
                    <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.03, 0.3) }} className="border-t border-slate-100 dark:border-white/5 align-middle">
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{t.businessName}<div className="text-xs text-slate-400">{t.ownerName || ""}</div></td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {t.email}
                        <button onClick={() => openReset(t)} title="Password reset — pass vule gele notun diye din"
                          className="mt-1 flex items-center gap-1 rounded-lg bg-white/5 px-2 py-0.5 text-[11px] font-medium text-slate-400 hover:bg-gold-500/15 hover:text-gold-500">
                          <KeyRound size={11} /> Reset Password
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 ${over ? "text-rose-500 font-semibold" : "text-slate-600 dark:text-slate-300"}`}>
                          <Users size={13} /> {t.usedUsers}{t.maxUsers > 0 ? ` / ${t.maxUsers}` : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3 w-48"><Dropdown value={t.planId || ""} options={planOpts} onChange={(v) => setPlan(t, v)} /></td>
                      <td className="px-4 py-3 w-40">
                        <Dropdown value={t.status} options={STATUSES} onChange={(v) => setStatus(t, v)} />
                        <div className="mt-1 flex gap-1">
                          {(t.status === "past_due" || t.status === "trial" || t.status === "suspended") && (
                            <button onClick={() => confirmPay(t)} className="flex-1 rounded-lg bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-500/25">✓ Confirm Pay</button>
                          )}
                          <button onClick={() => renew(t)} title="Owner renew (+30 din, free)" className="flex-1 rounded-lg bg-sky-500/15 px-2 py-1 text-[11px] font-semibold text-sky-600 hover:bg-sky-500/25">↻ Renew</button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{t.nextBillDate ? new Date(t.nextBillDate).toLocaleDateString() : "—"}</td>
                    </motion.tr>
                  );
                })}
                {rows.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-sm text-slate-400">Kono tenant nei.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={!!resetFor}
        onClose={() => setResetFor(null)}
        title="Reset Password"
        subtitle={resetFor ? `${resetFor.businessName} · ${resetFor.email}` : ""}
        size="sm"
        footer={
          resetResult
            ? <button onClick={() => setResetFor(null)} className="btn-gold">Done</button>
            : <><button onClick={() => setResetFor(null)} className="btn-ghost">Cancel</button>
                <button onClick={doReset} disabled={resetBusy} className="btn-gold">{resetBusy ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />} Reset</button></>
        }
      >
        {resetResult ? (
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2 font-semibold text-emerald-600"><CheckCircle2 size={16} /> Notun password set holo</p>
            <div className="rounded-xl border border-gold-500/30 bg-gold-500/10 p-3">
              <p className="text-slate-600 dark:text-slate-300">Email: <b className="text-slate-800 dark:text-white">{resetResult.email}</b></p>
              <p className="mt-1 text-slate-600 dark:text-slate-300">Notun password:</p>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 select-all rounded-lg bg-navy-900 px-3 py-2 font-mono text-base font-bold text-gold-300">{resetResult.password}</code>
                <button onClick={() => { navigator.clipboard?.writeText(resetResult.password); notify("Copy holo", "success"); }} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-gold-500"><Copy size={16} /></button>
              </div>
            </div>
            <p className="text-xs text-slate-400">Ei password-ta tenant-ke din. Tenant login kore nijer moto change kore nite parbe (Account Manage → Change Password).</p>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <p className="text-slate-500 dark:text-slate-300">Notun password din (ba khali rekhe <b>auto-generate</b>). Reset korle purono password ar kaj korbe na.</p>
            <input value={resetPw} onChange={(e) => setResetPw(e.target.value)} placeholder="Notun password (optional — khali = auto)"
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-800 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-gold-400" />
          </div>
        )}
      </Modal>
    </div>
  );
}
