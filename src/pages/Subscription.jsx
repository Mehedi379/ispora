import { useState, useEffect, useCallback } from "react";
import { Loader2, CreditCard, CalendarClock, Receipt } from "lucide-react";
import PayPanel from "../components/PayPanel";
import { api } from "../api";

const statusBadge = {
  trial: "bg-sky-500/15 text-sky-500", active: "bg-emerald-500/15 text-emerald-500",
  past_due: "bg-amber-500/15 text-amber-500", suspended: "bg-rose-500/15 text-rose-500",
};

// Tenant-er nijer subscription — status, invoice history, ar signed-in obosthay
// (lock chara) advance/early bill pay + plan (user tier) upgrade.
export default function Subscription() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api.saasMe()); } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="grid place-items-center py-24"><Loader2 className="animate-spin text-gold-500" /></div>;
  if (data?.platformOwner) return <p className="text-sm text-slate-400">Platform owner-er subscription nei.</p>;

  const sub = data?.subscription;
  const plan = sub?.plan;
  const invoices = data?.invoices || [];
  const endDate = sub?.status === "trial" ? sub?.trialEndsAt : sub?.currentPeriodEnd;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><CreditCard size={22} className="text-gold-500" /> My Subscription</h2>
        <p className="text-sm text-slate-400">Apnar plan, bill, user tier ar advance payment — ekhan theke manage korun.</p>
      </div>
      {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Current Plan</p>
              <p className="mt-1 font-display text-2xl font-bold text-slate-800 dark:text-white">{plan?.name || "—"}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">৳{(plan?.priceMonthly || 0).toLocaleString()}/mo · {plan?.maxUsers ? `${plan.maxUsers} user` : "unlimited"}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge[sub?.status] || "bg-slate-500/15 text-slate-400"}`}>{sub?.status || "—"}</span>
          </div>
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-navy-800 px-4 py-3 text-sm">
            <CalendarClock size={16} className="text-gold-500" />
            <span className="text-slate-600 dark:text-slate-300">
              {sub?.status === "trial" ? "Trial sesh" : "Porer bill"}: <b className="text-slate-800 dark:text-white">{endDate ? new Date(endDate).toLocaleDateString() : "—"}</b>
              {data?.daysLeft != null && <span className="ml-1 text-slate-400">({data.daysLeft} din baki)</span>}
            </span>
          </div>
        </div>

        <div className="card p-5">
          <p className="font-semibold text-slate-700 dark:text-slate-200">{sub?.status === "active" ? "Renew / Upgrade" : "Pay & Activate"}</p>
          <p className="mb-3 mt-1 text-xs text-slate-400">Ekhon-i pay korle period extend hobe — baki din nosto hobe na. User barate boro plan nin.</p>
          <PayPanel status={sub?.status} currentPlanId={plan?.id} onPaid={load} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 dark:border-white/5 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2"><Receipt size={16} className="text-gold-500" /> Payment / Invoice History</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 text-[11px] uppercase tracking-wide text-slate-400">
              <tr><th className="px-5 py-2.5">Invoice</th><th className="px-5 py-2.5 text-right">Amount</th><th className="px-5 py-2.5">Status</th><th className="px-5 py-2.5">Date</th></tr>
            </thead>
            <tbody>
              {invoices.map((iv) => (
                <tr key={iv.id} className="border-t border-slate-100 dark:border-white/5">
                  <td className="px-5 py-2.5 font-mono text-slate-500 dark:text-slate-400">{iv.number}</td>
                  <td className="px-5 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">৳{iv.amount.toLocaleString()}</td>
                  <td className="px-5 py-2.5"><span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${iv.status === "paid" ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500"}`}>{iv.status}</span></td>
                  <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400">{new Date(iv.issuedAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {invoices.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-sm text-slate-400">Kono invoice nei.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
