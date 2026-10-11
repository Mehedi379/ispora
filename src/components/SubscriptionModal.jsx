import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Loader2, CalendarClock } from "lucide-react";
import Modal from "./Modal";
import PayPanel from "./PayPanel";
import { api } from "../api";

const badge = {
  trial: "bg-sky-500/15 text-sky-600", active: "bg-emerald-500/15 text-emerald-600",
  past_due: "bg-amber-500/15 text-amber-600", suspended: "bg-rose-500/15 text-rose-600",
};

// Topbar theke quick subscription/pay popup — bill dekha + ekhon-i (advance) pay + plan select
export default function SubscriptionModal({ open, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api.saasMe()); } catch { /* ignore */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { if (open) load(); }, [open, load]);

  const sub = data?.subscription;
  const plan = sub?.plan;
  const free = (plan?.priceMonthly || 0) === 0;
  const endDate = sub?.status === "trial" ? sub?.trialEndsAt : sub?.currentPeriodEnd;

  return (
    <Modal open={open} onClose={onClose} title="My Subscription" subtitle="Plan, bill ar advance payment" size="sm"
      footer={<><Link to="/subscription" onClick={onClose} className="btn-ghost">Full details</Link><button onClick={onClose} className="btn-gold">Thik ache</button></>}>
      {loading ? (
        <div className="grid place-items-center py-10"><Loader2 className="animate-spin text-gold-500" /></div>
      ) : data?.platformOwner ? (
        <p className="text-sm text-slate-500 dark:text-slate-300">Apni Platform Owner — apnar kono subscription bill nei.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-lg font-bold text-slate-800 dark:text-white">{plan?.name || "—"}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">৳{(plan?.priceMonthly || 0).toLocaleString()}/mo · {plan?.maxUsers ? `${plan.maxUsers} user` : "unlimited"}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge[sub?.status] || "bg-slate-500/15 text-slate-400"}`}>{sub?.status || "—"}</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-navy-800 px-3 py-2.5 text-sm">
            <CalendarClock size={15} className="text-gold-500" />
            <span className="text-slate-600 dark:text-slate-300">
              {sub?.status === "trial" ? "Trial sesh" : "Porer bill"}: <b className="text-slate-800 dark:text-white">{endDate ? new Date(endDate).toLocaleDateString() : "—"}</b>
              {data?.daysLeft != null && <span className="ml-1 text-slate-400">({data.daysLeft} din baki)</span>}
            </span>
          </div>

          {free && sub?.status === "active"
            ? <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">Ei plan free — kono bill nei. User barate hole niche theke paid plan nite paren.</p>
            : null}
          <PayPanel status={sub?.status} currentPlanId={plan?.id} onPaid={load} />
        </div>
      )}
    </Modal>
  );
}
