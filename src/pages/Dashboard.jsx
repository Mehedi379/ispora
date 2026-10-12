import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users, UserCheck, Wallet, AlertTriangle, TrendingUp, ArrowUpRight, ArrowDownRight, Wifi, WifiOff, Loader2,
  Calendar, CheckCircle2, Percent, HandCoins, Coins, PiggyBank, Receipt, Banknote, Server, DollarSign,
  MessageSquare, ShoppingCart, Ticket, ListTodo, RefreshCw,
} from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

const fmt = (n) => `৳ ${Number(n || 0).toLocaleString()}`;

export default function Dashboard() {
  const { clients, notify } = useStore();
  const [stats, setStats] = useState(null);
  const [dash, setDash] = useState(null);
  const [ov, setOv] = useState(null);
  const [payments, setPayments] = useState([]);
  const [err, setErr] = useState("");
  const [reload, setReload] = useState(0);

  // clients store refresh hole (payment/renew er por) stats-o abar ani — tai card gula stale thake na
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [st, pays, dsh, over] = await Promise.all([api.stats(), api.listPayments(), api.statsDashboard().catch(() => null), api.statsOverview().catch(() => null)]);
        if (!alive) return;
        setStats(st); setPayments(pays); setDash(dsh); setOv(over); setErr("");
      } catch (e) {
        // Age ignore chilo → stats null thaklei chirokal spinner, retry upay-i chilo na
        if (!alive) return;
        setErr(e?.message || "Dashboard load fail holo");
        notify(e?.message || "Dashboard load fail holo");
      }
    })();
    return () => { alive = false; };
  }, [clients, reload, notify]);

  if (!stats && !err) {
    return <div className="grid place-items-center py-24"><Loader2 size={26} className="animate-spin text-gold-500" /></div>;
  }
  if (!stats && err) {
    return (
      <div className="grid place-items-center py-24 text-center">
        <AlertTriangle size={28} className="text-rose-500" />
        <p className="mt-3 text-sm text-slate-500">{err}</p>
        <button onClick={() => setReload((n) => n + 1)} className="btn-gold mt-4 px-4 py-2 text-sm">
          Abar try korun
        </button>
      </div>
    );
  }

  // Real monthly revenue (last 12 months) — best / avg / worst + month-over-month trend
  const monthly = stats.monthlyRevenue || [];
  const totals = monthly.map((m) => m.total);
  const maxRev = Math.max(...totals, 1);
  const best = totals.length ? Math.max(...totals) : 0;
  const worst = totals.length ? Math.min(...totals) : 0;
  const avg = totals.length ? Math.round(totals.reduce((s, v) => s + v, 0) / totals.length) : 0;
  const last = totals[totals.length - 1] || 0;
  const prev = totals[totals.length - 2] || 0;
  const trendPct = prev > 0 ? ((last - prev) / prev) * 100 : (last > 0 ? 100 : 0);
  const trendUp = trendPct >= 0;

  // Card-er secondary metric gula ekhon REAL (age "+24" / "+12" hardcoded chilo — kokhono change hoto na)
  const dueCount = clients.filter((c) => (c.due || 0) > 0 || c.status === "due").length;
  const activePct = stats.totalClients ? Math.round((stats.active / stats.totalClients) * 100) : 0;

  const cards = [
    { label: "Total Clients", value: stats.totalClients, icon: Users, color: "from-sky-400 to-blue-600", sub: `${stats.online} online`, tone: "flat" },
    { label: "Active Now", value: stats.active, icon: UserCheck, color: "from-emerald-400 to-green-600", sub: `${activePct}% of total`, tone: "flat" },
    { label: "This Month Collection", value: fmt(stats.collectionThisMonth), icon: Wallet, color: "from-gold-400 to-gold-600", sub: `${trendUp ? "+" : ""}${trendPct.toFixed(1)}%`, tone: trendUp ? "up" : "down" },
    { label: "Total Due", value: fmt(stats.due), icon: AlertTriangle, color: "from-rose-400 to-red-600", sub: `${dueCount} customer`, tone: "flat" },
  ];
  const expiring = [...clients].filter((c) => c.expiry).sort((a, b) => a.expiry.localeCompare(b.expiry)).slice(0, 3);

  const revStats = [
    { label: "Best", value: best, color: "text-emerald-500" },
    { label: "Average", value: avg, color: "text-sky-500" },
    { label: "Worst", value: worst, color: "text-rose-500" },
  ];

  // Competitor-style status cards (ticket/task) + financial tiles
  const statusCards = dash ? [
    { label: "Pending Tickets", value: dash.pendingTickets, sub: "Support tickets that are pending", icon: Ticket, grad: "from-rose-500 to-red-600" },
    { label: "Processing Tickets", value: dash.processingTickets, sub: "Support tickets that are processing", icon: RefreshCw, grad: "from-amber-500 to-orange-600" },
    { label: "Pending Task", value: dash.pendingTasks, sub: "Created tasks that are pending", icon: ListTodo, grad: "from-rose-500 to-red-600" },
    { label: "Processing Task", value: dash.processingTasks, sub: "Tasks that are processing", icon: RefreshCw, grad: "from-amber-500 to-orange-600" },
  ] : [];

  const G = { sky: "from-sky-500 to-blue-600", teal: "from-teal-500 to-emerald-600", violet: "from-violet-500 to-purple-600", slate: "from-slate-600 to-slate-800" };
  const financialTiles = ov ? [
    { label: "Monthly Bill", value: ov.monthlyBill, sub: "Current month total customer bill", icon: Calendar, grad: G.sky },
    { label: "Collected Bill", value: ov.collectedBill, sub: "Current month total received", icon: CheckCircle2, grad: G.teal },
    { label: "Discount", value: ov.discount, sub: "Current month total discount", icon: Percent, grad: G.violet },
    { label: "Total Due", value: ov.totalDue, sub: "Total due bill of client", icon: AlertTriangle, grad: G.slate },
    { label: "Service Sales Invoice", value: ov.serviceSalesInvoice, sub: "Installation fee & service sales", icon: HandCoins, grad: G.sky },
    { label: "Product Sales Invoice", value: ov.productSalesInvoice, sub: "Current month product sales", icon: TrendingUp, grad: G.teal },
    { label: "Income", value: ov.income, sub: "Current month total income", icon: ArrowUpRight, grad: G.violet },
    { label: "Expense", value: ov.expense, sub: "Current month total expense", icon: ArrowDownRight, grad: G.slate },
    { label: "Credited Amount", value: ov.creditedAmount, sub: "Monthly credited amount of POPs", icon: Coins, grad: G.sky },
    { label: "POP Fund", value: ov.popFund, sub: "Monthly given fund to POPs", icon: PiggyBank, grad: G.teal },
    { label: "POP Bill", value: ov.popBill, sub: "Monthly received amount from POPs", icon: Receipt, grad: G.violet },
    { label: "Receivable Amount", value: ov.receivableAmount, sub: "Monthly receivable from POPs", icon: Banknote, grad: G.slate },
    { label: "B.Width Provider Bill", value: ov.bwProviderBill, sub: "Monthly paid to B.Width providers", icon: Server, grad: G.sky },
    { label: "B.Width Provider Due", value: ov.bwProviderDue, sub: "All over B.Width providers payable", icon: Server, grad: G.teal },
    { label: "B.Width POP Bill", value: ov.bwPopBill, sub: "Monthly received from B.Width POPs", icon: Server, grad: G.violet },
    { label: "Paid Salary", value: ov.paidSalary, sub: "Current month total paid salary", icon: DollarSign, grad: G.slate },
    { label: "SMS Balance", value: ov.smsBalance, sub: "This is your total SMS balance", icon: MessageSquare, grad: G.sky, raw: true },
    { label: "Purchase Payable Due", value: ov.purchasePayableDue, sub: "All over inventory purchase payable", icon: ShoppingCart, grad: G.teal },
    { label: "Purchase Paid Amount", value: ov.purchasePaidAmount, sub: "Current month inventory purchase paid", icon: ShoppingCart, grad: G.violet },
    { label: "Cash On Hand", value: ov.cashOnHand, sub: "Current month total CashOnHand", icon: Wallet, grad: G.slate },
  ] : [];
  const maxNew = ov ? Math.max(...ov.monthlyNewClient.map((m) => m.count), 1) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h2>
        <p className="text-sm text-slate-400">Welcome back — ei je apnar network er ek nojore chobi.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((s, i) => (
          <motion.div key={s.label} custom={i} variants={fade} initial="hidden" animate="show" className="card p-5">
            <div className="flex items-start justify-between">
              <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${s.color} text-white shadow-lg`}>
                <s.icon size={20} />
              </div>
              <span className={`flex items-center gap-1 text-xs font-semibold ${
                s.tone === "up" ? "text-emerald-500" : s.tone === "down" ? "text-rose-500" : "text-slate-400"
              }`}>
                {s.tone === "up" && <ArrowUpRight size={14} />}
                {s.tone === "down" && <ArrowDownRight size={14} />}
                {s.sub}
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold text-slate-800 dark:text-white">{s.value}</p>
            <p className="text-sm text-slate-400">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {dash && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            ["Total Client", dash.total, "text-sky-500"],
            ["Running", dash.running, "text-emerald-500"],
            ["Inactive", dash.inactive, "text-slate-400"],
            ["New (month)", dash.newClient, "text-indigo-500"],
            ["Left", dash.left, "text-rose-500"],
            ["Paid", dash.paid, "text-emerald-500"],
            ["Unpaid", dash.unpaid, "text-amber-500"],
            ["Due", dash.due, "text-amber-500"],
            ["Expired", dash.expired, "text-rose-500"],
            ["Suspended", dash.suspended, "text-slate-400"],
            ["Online", dash.online, "text-emerald-500"],
            ["Blocked", dash.blocked, "text-rose-500"],
            ["Bill Date Expire", dash.billExpire, "text-amber-500"],
            ["Unpaid Extension", dash.unpaidExtension, "text-amber-500"],
            ["Total POP", dash.totalPop, "text-sky-500"],
            ["POP Clients", dash.popClients, "text-indigo-500"],
            ["Pending Tickets", dash.pendingTickets, "text-rose-500"],
            ["Processing Tickets", dash.processingTickets, "text-amber-500"],
            ["Pending Tasks", dash.pendingTasks, "text-rose-500"],
            ["Processing Tasks", dash.processingTasks, "text-amber-500"],
          ].map(([label, value, color], i) => (
            <motion.div key={label} custom={i} variants={fade} initial="hidden" animate="show" className="card p-3.5">
              <p className={`font-display text-xl font-bold ${color}`}>{value}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">{label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {statusCards.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statusCards.map((s, i) => (
            <motion.div key={s.label} custom={i} variants={fade} initial="hidden" animate="show"
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${s.grad} p-5 text-white shadow-lg`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold opacity-90">{s.label}</p>
                  <p className="mt-1 font-display text-3xl font-bold">{s.value ?? 0}</p>
                </div>
                <s.icon size={26} className="opacity-80" />
              </div>
              <p className="mt-3 text-[11px] opacity-80">{s.sub}</p>
            </motion.div>
          ))}
        </div>
      )}

      {financialTiles.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {financialTiles.map((t, i) => (
            <motion.div key={t.label} custom={i} variants={fade} initial="hidden" animate="show"
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${t.grad} p-4 text-white shadow-lg`}>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/20"><t.icon size={20} /></div>
                <div className="min-w-0">
                  <p className="text-xs font-medium opacity-90">{t.label}</p>
                  <p className="font-display text-xl font-bold">{t.raw ? Number(t.value || 0).toLocaleString() : fmt(t.value)}</p>
                </div>
              </div>
              <p className="mt-2.5 truncate text-[11px] opacity-80">{t.sub}</p>
            </motion.div>
          ))}
        </div>
      )}

      {ov && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <motion.div custom={0} variants={fade} initial="hidden" animate="show" className="card p-5 lg:col-span-2">
            <h3 className="font-display font-semibold text-slate-800 dark:text-white">Monthly New Client</h3>
            <p className="text-xs text-slate-400">Last 12 months</p>
            <div className="mt-5 flex h-48 items-end gap-2">
              {ov.monthlyNewClient.map((m, i) => (
                <div key={i} className="group relative flex flex-1 flex-col items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{m.count || ""}</span>
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: `${Math.max((m.count / maxNew) * 100, 2)}%` }}
                    transition={{ delay: 0.2 + i * 0.04, duration: 0.5, ease: "easeOut" }}
                    className="w-full rounded-t-lg bg-gradient-to-t from-sky-600 to-sky-400"
                  />
                  <span className="text-[10px] text-slate-400">{m.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div custom={1} variants={fade} initial="hidden" animate="show" className="card overflow-hidden p-0">
            <div className="bg-gradient-to-r from-navy-800 to-navy-900 px-5 py-3.5">
              <h3 className="font-display font-semibold text-white">Top 20 Unpaid Client</h3>
            </div>
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-400 dark:bg-white/5">
                  <tr><th className="px-4 py-2.5">User</th><th className="px-4 py-2.5">Mobile</th><th className="px-4 py-2.5 text-right">Due</th></tr>
                </thead>
                <tbody>
                  {ov.topUnpaid.map((c) => (
                    <tr key={c.id} className="border-t border-slate-100 dark:border-white/5">
                      <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200">{c.name}</td>
                      <td className="px-4 py-2.5 text-slate-500">{c.phone}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-rose-500">{fmt(c.due)}</td>
                    </tr>
                  ))}
                  {ov.topUnpaid.length === 0 && <tr><td colSpan={3} className="px-4 py-10 text-center text-xs text-slate-400">Kono unpaid client nei.</td></tr>}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div custom={4} variants={fade} initial="hidden" animate="show" className="card p-5 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold text-slate-800 dark:text-white">Monthly Revenue</h3>
              <p className="text-xs text-slate-400">Last 12 months</p>
            </div>
            <span className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${trendUp ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
              <TrendingUp size={14} className={trendUp ? "" : "rotate-180"} /> {trendUp ? "+" : ""}{trendPct.toFixed(1)}%
            </span>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-2">
            {revStats.map((r) => (
              <div key={r.label} className="rounded-xl bg-slate-50 dark:bg-white/5 px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">{r.label}</p>
                <p className={`mt-0.5 text-sm font-bold ${r.color}`}>{fmt(r.value)}</p>
              </div>
            ))}
          </div>

          <div className="flex h-48 items-end gap-2">
            {monthly.map((m, i) => (
              <div key={i} className="group relative flex flex-1 flex-col items-center gap-2">
                <span className="pointer-events-none absolute -top-6 rounded-md bg-navy-900 px-2 py-0.5 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">{fmt(m.total)}</span>
                <motion.div
                  initial={{ height: 0 }} animate={{ height: `${Math.max((m.total / maxRev) * 100, 2)}%` }}
                  transition={{ delay: 0.3 + i * 0.05, duration: 0.6, ease: "easeOut" }}
                  className={`w-full rounded-t-lg bg-gradient-to-t ${m.total === best && best > 0 ? "from-emerald-600 to-emerald-400" : "from-gold-600 to-gold-400"}`}
                />
                <span className="text-[10px] text-slate-400">{m.label[0]}</span>
              </div>
            ))}
          </div>
          {best === 0 && <p className="mt-3 text-center text-xs text-slate-400">Ekhono payment data nei — collect korle revenue graph bhorbe.</p>}
        </motion.div>

        <motion.div custom={5} variants={fade} initial="hidden" animate="show" className="card p-5">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white">Live Status</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 p-3">
              <span className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <Wifi size={18} /> Online
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{stats.online}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-rose-500/10 p-3">
              <span className="flex items-center gap-2 text-sm font-medium text-rose-600 dark:text-rose-400">
                <WifiOff size={18} /> Offline
              </span>
              <span className="font-bold text-rose-600 dark:text-rose-400">{stats.offline}</span>
            </div>
          </div>
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold text-slate-400">EXPIRING SOON</p>
            <div className="space-y-2">
              {expiring.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">{c.name}</span>
                  <span className="text-xs text-amber-500">{c.expiry}</span>
                </div>
              ))}
              {expiring.length === 0 && <p className="text-xs text-slate-400">Kono expiring client nei.</p>}
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div custom={6} variants={fade} initial="hidden" animate="show" className="card overflow-hidden">
        <div className="flex items-center justify-between p-5">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white">Recent Payments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-5 py-3">Receipt</th><th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Method</th><th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.slice(0, 6).map((p) => (
                <tr key={p.id} className="border-t border-slate-100 dark:border-white/5">
                  <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">RCP-{String(p.id).padStart(4, "0")}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{p.client}</td>
                  <td className="px-5 py-3 text-slate-500">{p.method}</td>
                  <td className="px-5 py-3 text-slate-500">{p.date}</td>
                  <td className="px-5 py-3 font-semibold text-emerald-500">৳ {p.amount}</td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">Ekhono kono payment nei. Payments page theke collect korun.</td></tr>}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
