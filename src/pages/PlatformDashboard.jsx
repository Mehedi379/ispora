import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, LayoutDashboard, Building2, TrendingUp, Wallet, Clock, AlertTriangle } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";

export default function PlatformDashboard() {
  const { notify } = useStore();
  const [d, setD] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, pend] = await Promise.all([api.platformDashboard(), api.platformPendingPayments()]);
      setD(dash); setPending(pend);
    } catch (e) { notify(e.message); } finally { setLoading(false); }
  }, [notify]);
  useEffect(() => { load(); }, [load]);

  const verify = async (p) => { try { await api.platformVerifyPayment(p.id); notify(`${p.tenant} active holo`, "success"); await load(); } catch (e) { notify(e.message); } };
  const reject = async (p) => { try { await api.platformRejectPayment(p.id); notify("Reject kora holo"); await load(); } catch (e) { notify(e.message); } };

  if (loading) return <div className="grid place-items-center py-24"><Loader2 className="animate-spin text-gold-500" /></div>;
  const c = d?.counts || {};

  const Stat = ({ icon: Icon, label, value, cls, prefix }) => (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
        <Icon size={16} className={cls || "text-slate-400"} />
      </div>
      <p className={`mt-1 font-display text-2xl font-bold ${cls || "text-slate-800 dark:text-white"}`}>{prefix}{value}</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><LayoutDashboard size={22} className="text-gold-500" /> Platform Dashboard</h2>
        <p className="text-sm text-slate-400">Tomar SaaS business ek nojore — ke use korche, koto income.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Wallet} label="Total Revenue" value={(d?.totalRevenue || 0).toLocaleString()} prefix="৳" cls="text-emerald-500" />
        <Stat icon={TrendingUp} label="MRR (monthly)" value={(d?.mrr || 0).toLocaleString()} prefix="৳" cls="text-gold-500" />
        <Stat icon={Building2} label="Total ISP" value={c.tenants || 0} />
        <Stat icon={Building2} label="Active" value={c.active || 0} cls="text-emerald-500" />
        <Stat icon={Clock} label="Trial" value={c.trial || 0} cls="text-sky-500" />
        <Stat icon={AlertTriangle} label="Past Due" value={c.pastDue || 0} cls="text-amber-500" />
        <Stat icon={AlertTriangle} label="Suspended" value={c.suspended || 0} cls="text-rose-500" />
      </div>

      {pending.length > 0 && (
        <div className="card overflow-hidden border border-amber-500/30">
          <div className="border-b border-amber-500/20 bg-amber-500/10 px-5 py-3 text-sm font-semibold text-amber-600 dark:text-amber-400">Pending Payments — verify korun ({pending.length})</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 text-[11px] uppercase tracking-wide text-slate-400">
                <tr><th className="px-5 py-2.5">ISP</th><th className="px-5 py-2.5 text-right">Amount</th><th className="px-5 py-2.5">Method</th><th className="px-5 py-2.5">TrxID</th><th className="px-5 py-2.5 text-right">Action</th></tr>
              </thead>
              <tbody>
                {pending.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100 dark:border-white/5">
                    <td className="px-5 py-2.5 font-medium text-slate-700 dark:text-slate-200">{p.tenant}</td>
                    <td className="px-5 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">৳{p.amount.toLocaleString()}</td>
                    <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400">{p.method}</td>
                    <td className="px-5 py-2.5 font-mono text-slate-500 dark:text-slate-400">{p.txnId || "—"}</td>
                    <td className="px-5 py-2.5">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => verify(p)} className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-500/25">✓ Verify &amp; Activate</button>
                        <button onClick={() => reject(p)} className="rounded-lg bg-rose-500/15 px-2.5 py-1 text-[11px] font-semibold text-rose-500 hover:bg-rose-500/25">Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 dark:border-white/5 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Recent Payments</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 text-[11px] uppercase tracking-wide text-slate-400">
              <tr><th className="px-5 py-2.5">ISP</th><th className="px-5 py-2.5 text-right">Amount</th><th className="px-5 py-2.5">Method</th><th className="px-5 py-2.5">Date</th></tr>
            </thead>
            <tbody>
              {(d?.recentPayments || []).map((p, i) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.03, 0.3) }} className="border-t border-slate-100 dark:border-white/5">
                  <td className="px-5 py-2.5 font-medium text-slate-700 dark:text-slate-200">{p.tenant}</td>
                  <td className="px-5 py-2.5 text-right font-semibold text-emerald-600">৳{p.amount.toLocaleString()}</td>
                  <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400">{p.method}</td>
                  <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400">{new Date(p.at).toLocaleDateString()}</td>
                </motion.tr>
              ))}
              {(d?.recentPayments || []).length === 0 && <tr><td colSpan={4} className="py-10 text-center text-sm text-slate-400">Ekhono kono payment nei.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
