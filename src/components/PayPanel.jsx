import { useState, useEffect } from "react";
import { Loader2, Smartphone, CheckCircle2, Clock } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";

// Reusable pay panel — plan select + owner-er fixed number-e Send Money/Payment/Cash Out
// + TrxID submit. Owner Payment Settings-e jei method On rakhbe shudhu oigula dekhabe.
// Free (৳0) plan picker-e dekhai na. SSLCOMMERZ mode hole redirect.
export default function PayPanel({ status, currentPlanId, onPaid }) {
  const { notify } = useStore();
  const [plans, setPlans] = useState([]);
  const [planId, setPlanId] = useState(null);
  const [inv, setInv] = useState(null);
  const [payInfo, setPayInfo] = useState(null);
  const [method, setMethod] = useState(null); // {key, number, action}
  const [txnId, setTxnId] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => { api.publicPlans().then((ps) => setPlans(ps.filter((p) => p.priceMonthly > 0))).catch(() => {}); }, []);
  const selId = planId ?? currentPlanId;

  // payInfo theke On-kora mobile methods
  const methods = payInfo
    ? [
        { key: "bKash", ...payInfo.bkash },
        { key: "Nagad", ...payInfo.nagad },
        { key: "Rocket", ...payInfo.rocket },
      ].filter((m) => m.enabled && m.number)
    : [];

  const start = async () => {
    setBusy(true);
    try {
      const r = await api.saasPay(planId);
      if (r.mode === "sslcommerz" && r.redirectUrl) { window.location.href = r.redirectUrl; return; }
      setInv(r.invoice); setPayInfo(r.payInfo || null);
      const pi = r.payInfo;
      const first = pi ? [{ key: "bKash", ...pi.bkash }, { key: "Nagad", ...pi.nagad }, { key: "Rocket", ...pi.rocket }].find((m) => m.enabled && m.number) : null;
      setMethod(first || null);
    } catch (e) { notify(e.message); } finally { setBusy(false); }
  };
  const submitManual = async () => {
    if (!method) { notify("Owner kono payment method set koreni"); return; }
    if (!txnId.trim()) { notify(`${method.action} kore TrxID din`); return; }
    setBusy(true);
    try {
      await api.saasPayManual({ planId, method: method.key, txnId: txnId.trim() });
      setPending(true);
      notify("TrxID submit holo — verify hole active hobe", "success");
      onPaid?.();
    } catch (e) { notify(e.message); } finally { setBusy(false); }
  };

  if (pending) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-600 dark:text-amber-400">
        <p className="flex items-center gap-2 font-semibold"><Clock size={16} /> Payment verify-er opekkhay</p>
        <p className="mt-1 text-xs leading-relaxed">TrxID peyechi. Verify hole shonge shonge subscription active hoye jabe.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!inv && plans.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Plan — koto user</p>
          <div className="space-y-1.5">
            {plans.map((p) => (
              <button key={p.id} onClick={() => setPlanId(p.id)}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm transition ${selId === p.id ? "border-gold-500 bg-gold-500/10" : "border-slate-200 dark:border-white/10 hover:border-gold-400/40"}`}>
                <span className="text-slate-700 dark:text-slate-200">{p.name} · {p.maxUsers ? `${p.maxUsers} user` : "unlimited"}</span>
                <span className="font-semibold text-gold-500">৳{p.priceMonthly.toLocaleString()}/mo</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!inv ? (
        <button onClick={start} disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 py-2.5 font-semibold text-navy-950 shadow-gold transition hover:brightness-105 disabled:opacity-60">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Smartphone size={16} />} {status === "active" ? "Renew / Upgrade" : "Pay & Activate"}
        </button>
      ) : (
        <div className="rounded-xl border border-gold-500/30 bg-gold-500/10 p-3 text-sm">
          <p className="font-semibold text-gold-600 dark:text-gold-300">Bill: {inv.number} — ৳{inv.amount?.toLocaleString()}</p>

          {methods.length === 0 ? (
            <p className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-500">Owner ekhono kono payment method On koreni — owner-ke bolun.</p>
          ) : (
            <>
              <p className="mb-1.5 mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Method</p>
              <div className="grid grid-cols-3 gap-1.5">
                {methods.map((m) => (
                  <button key={m.key} onClick={() => setMethod(m)}
                    className={`rounded-lg border px-1 py-1.5 text-[11px] font-medium transition ${method?.key === m.key ? "border-gold-500 bg-gold-500/15 text-gold-600 dark:text-gold-300" : "border-slate-200 dark:border-white/10 text-slate-500"}`}>{m.key}</button>
                ))}
              </div>
              {method && (
                <div className="mt-2.5 rounded-lg bg-navy-900/70 px-3 py-2.5 text-[12px] text-slate-200">
                  Ei <b className="text-gold-300">{method.key}</b> number-e <b className="text-white">{method.action}</b> korun:
                  <div className="mt-0.5 select-all font-mono text-base font-bold text-white">{method.number}</div>
                  <div className="mt-0.5 text-slate-400">Amount: ৳{inv.amount?.toLocaleString()}</div>
                </div>
              )}
              {payInfo?.bank?.enabled && (
                <div className="mt-2 rounded-lg bg-navy-900/50 px-3 py-2 text-[11px] text-slate-300">Bank: <b className="text-white">{payInfo.bank.info}</b></div>
              )}
              {payInfo?.note && <p className="mt-2 rounded-lg bg-sky-500/10 px-3 py-2 text-[11px] leading-relaxed text-sky-300">{payInfo.note}</p>}
              <input value={txnId} onChange={(e) => setTxnId(e.target.value)} placeholder="TrxID din (jemon 9A7B6C5D)"
                className="mt-2.5 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-gold-400" />
              <button onClick={submitManual} disabled={busy}
                className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2 font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60">
                {busy ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Pay korechi — Submit
              </button>
            </>
          )}
          <button onClick={() => { setInv(null); setTxnId(""); setPayInfo(null); }}
            className="mt-2 w-full text-center text-xs font-medium text-slate-400 transition hover:text-gold-500">← Back / onno plan dekho</button>
        </div>
      )}
    </div>
  );
}
