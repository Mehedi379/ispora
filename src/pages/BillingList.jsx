import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Loader2, FileStack, Wallet, CheckCircle2, Clock } from "lucide-react";
import Modal from "../components/Modal";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";
import { statusStyle } from "../data";

export default function BillingList() {
  const { user, notify } = useStore();
  const isAdmin = user?.role === "admin";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [genOpen, setGenOpen] = useState(false);
  const [gen, setGen] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await api.billingList()); setErr(""); }
    catch (e) { setErr(e?.message || "Load fail"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter((r) => !q || `${r.name} ${r.phone} ${r.zone} ${r.package}`.toLowerCase().includes(q.toLowerCase()));
  const totalBill = filtered.reduce((s, r) => s + (r.monthlyBill || 0), 0);
  const totalDue = filtered.reduce((s, r) => s + (r.due || 0), 0);
  const billedCount = filtered.filter((r) => r.billedThisMonth).length;

  const runGenerate = async () => {
    setGen(true);
    try { const res = await api.generateBills(); setGenOpen(false); notify(`${res.created} ta notun bill generate holo`, "success"); await load(); }
    catch (e) { notify(e.message); }
    finally { setGen(false); }
  };

  const Stat = ({ icon: Icon, label, value, color }) => (
    <div className="card flex items-center gap-3 p-4">
      <div className={`grid h-11 w-11 place-items-center rounded-xl ${color}`}><Icon size={20} /></div>
      <div><p className="text-xs text-slate-400">{label}</p><p className="font-display text-lg font-bold text-slate-800 dark:text-white">{value}</p></div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Billing List</h2>
          <p className="text-sm text-slate-400">Ei maaser billing obostha — protyek active customer</p>
        </div>
        {isAdmin && <button onClick={() => setGenOpen(true)} className="btn-gold"><FileStack size={16} /> Generate Bills</button>}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Wallet} label="Total Monthly Bill" value={`৳${totalBill.toLocaleString()}`} color="bg-gold-500/15 text-gold-500" />
        <Stat icon={Clock} label="Total Due" value={`৳${totalDue.toLocaleString()}`} color="bg-rose-500/15 text-rose-500" />
        <Stat icon={CheckCircle2} label="Billed This Month" value={`${billedCount}/${filtered.length}`} color="bg-emerald-500/15 text-emerald-500" />
        <Stat icon={FileStack} label="Customers" value={filtered.length} color="bg-indigo-500/15 text-indigo-500" />
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className={`${input} pl-9`} placeholder="Search customer..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Zone</th>
                  <th className="px-5 py-3 font-semibold">Package</th>
                  <th className="px-5 py-3 font-semibold">Monthly Bill</th>
                  <th className="px-5 py-3 font-semibold">Due</th>
                  <th className="px-5 py-3 font-semibold">This Month</th>
                  <th className="px-5 py-3 font-semibold">Last Payment</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.015, 0.3) }}
                    className="border-t border-slate-100 dark:border-white/5">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-700 dark:text-slate-200">{r.name}</p>
                      <p className="text-xs text-slate-400">{r.phone}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{r.zone || "—"}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{r.package || "—"}</td>
                    <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-200">৳{r.monthlyBill}</td>
                    <td className={`px-5 py-3 font-semibold ${r.due > 0 ? "text-rose-500" : "text-slate-400"}`}>{r.due ? `৳${r.due.toLocaleString()}` : "—"}</td>
                    <td className="px-5 py-3">
                      {r.billedThisMonth
                        ? <span className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-500">Billed</span>
                        : <span className="rounded-lg bg-slate-400/10 px-2 py-0.5 text-xs font-medium text-slate-400">Pending</span>}
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{r.lastPayment || "—"}</td>
                    <td className="px-5 py-3"><span className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle[r.status]}`}>{r.status}</span></td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-sm text-slate-400">Kono customer nei.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={genOpen} onClose={() => setGenOpen(false)} title="Generate Monthly Bills?" size="sm"
        footer={<><button onClick={() => setGenOpen(false)} className="btn-ghost">Cancel</button>
          <button onClick={runGenerate} disabled={gen} className="btn-gold">{gen ? <Loader2 size={15} className="animate-spin" /> : <FileStack size={15} />} Generate</button></>}>
        <p className="text-sm text-slate-500 dark:text-slate-300">Ei maase jader bill ekhono boshe nai, tader shobar jonno invoice toiri hobe ebong due barbe. Nishchit?</p>
      </Modal>
    </div>
  );
}
