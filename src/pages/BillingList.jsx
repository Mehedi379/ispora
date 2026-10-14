import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Loader2, FileStack, Users, UserX, Wallet, Coins, FileText, PiggyBank, Calendar, MoreVertical, CreditCard, AlertCircle, Eye, FileSpreadsheet, Printer, History } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { input } from "../ui";
import { statusStyle } from "../data";
import { clientLabel } from "../data";

const fmt = (n) => `৳${Number(n || 0).toLocaleString()}`;

export default function BillingList() {
  const { user, notify } = useStore();
  const { clients, refreshClients, toggleLine } = useStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [genOpen, setGenOpen] = useState(false);
  const [gen, setGen] = useState(false);
  const [err, setErr] = useState("");
  const [payRow, setPayRow] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [payBusy, setPayBusy] = useState(false);
  const [payErr, setPayErr] = useState("");
  const [menuOpen, setMenuOpen] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await api.billingList()); setErr(""); }
    catch (e) { setErr(e?.message || "Load fail"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter((r) => !q || `${r.name} ${r.phone} ${r.pppoe} ${r.zone} ${r.package}`.toLowerCase().includes(q.toLowerCase()));

  // Competitor-style stat tiles (frontend aggregate)
  const paidClients = rows.filter((r) => r.received > 0).length;
  const unpaidClients = rows.filter((r) => (r.received || 0) <= 0 && (r.monthlyBill || 0) > 0).length;
  const receivedBill = rows.reduce((s, r) => s + (r.received || 0), 0);
  const dueAmount = rows.reduce((s, r) => s + (r.due > 0 ? r.due : 0), 0);
  const monthlyBill = rows.reduce((s, r) => s + (r.monthlyBill || 0), 0);
  const advanceAmount = rows.reduce((s, r) => s + (r.advance || 0), 0);
  const generatedBill = rows.filter((r) => r.billedThisMonth).reduce((s, r) => s + (r.monthlyBill || 0), 0);

  const runGenerate = async () => {
    setGen(true);
    try { const res = await api.generateBills(); setGenOpen(false); notify(`${res.created} ta notun bill generate holo`, "success"); await load(); }
    catch (e) { notify(e.message); }
    finally { setGen(false); }
  };

  const openPay = (r) => { setPayRow(r); setPayAmount(String(r.due > 0 ? r.due : r.monthlyBill || "")); setPayMethod("Cash"); setPayErr(""); };
  const doPay = async () => {
    const amt = Number(payAmount);
    if (!amt || amt <= 0) { setPayErr("Amount din"); return; }
    setPayBusy(true);
    try {
      const c = clients.find((x) => x.id === payRow.id) || payRow;
      await api.collectPayment({ clientId: c.id, amount: amt, method: payMethod });
      setPayRow(null); setPayAmount("");
      await Promise.all([load(), refreshClients()]);
      notify("Payment collected", "success");
    } catch (e) { setPayErr(e.message); }
    finally { setPayBusy(false); }
  };
  const doDue = async (r) => {
    // Mark/collect flow not wired — mark intent, user can adjust via client due
    notify("Due: ekhane Pay kore due koman, ba Client edit theke due adjust korun.");
  };

  const G = { sky: "from-sky-500 to-blue-600", teal: "from-teal-500 to-emerald-600", violet: "from-violet-500 to-purple-600", slate: "from-slate-600 to-slate-800" };
  const tiles = [
    { label: "Paid Client", value: paidClients, sub: "Monthly paid client", icon: Users, grad: G.sky, raw: true },
    { label: "Unpaid Client", value: unpaidClients, sub: "Monthly unpaid client", icon: UserX, grad: G.teal, raw: true },
    { label: "Received Bill", value: receivedBill, sub: "Monthly received bill", icon: Wallet, grad: G.violet },
    { label: "Due Amount", value: dueAmount, sub: "All over due amount", icon: Coins, grad: G.slate },
    { label: "Generated Bill", value: generatedBill, sub: "Monthly generated bill", icon: FileText, grad: G.sky },
    { label: "Advance Amount", value: advanceAmount, sub: "Monthly advance amount", icon: PiggyBank, grad: G.teal },
    { label: "Monthly Bill", value: monthlyBill, sub: "Current month total customer bill", icon: Calendar, grad: G.violet },
  ];

  const th = "px-3 py-3 font-semibold whitespace-nowrap";
  const td = "px-3 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Billing List</h2>
          <p className="text-sm text-slate-400">All clients bill — ei maaser billing obostha</p>
        </div>
        {isAdmin && <button onClick={() => setGenOpen(true)} className="btn-gold"><FileStack size={16} /> Generate Bills</button>}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t, i) => (
          <motion.div key={t.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
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

      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className={`${input} pl-9`} placeholder="Search customer / ID / zone..." value={q} onChange={(e) => setQ(e.target.value)} />
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
                  <th className={th}>C.Code</th>
                  <th className={th}>ID/IP</th>
                  <th className={th}>Cus. Name</th>
                  <th className={th}>Mobile</th>
                  <th className={th}>Zone</th>
                  <th className={th}>Cus. Type</th>
                  <th className={th}>Conn. Type</th>
                  <th className={th}>Package</th>
                  <th className={th}>Speed</th>
                  <th className={th}>Ex. Date</th>
                  <th className={th}>M.Bill</th>
                  <th className={th}>Received</th>
                  <th className={th}>VAT</th>
                  <th className={th}>Balance Due</th>
                  <th className={th}>Advance</th>
                  <th className={th}>Pay Date</th>
                  <th className={th}>M.Status</th>
                  <th className={th}>B.Status</th>
                  <th className={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.012, 0.3) }}
                    className="border-t border-slate-100 dark:border-white/5">
                    <td className={`${td} font-mono text-xs`}>{String(r.id).padStart(4, "0")}</td>
                    <td className="px-3 py-3 whitespace-nowrap font-medium text-slate-700 dark:text-slate-200">{r.pppoe}</td>
                    <td className="px-3 py-3 whitespace-nowrap font-medium text-slate-700 dark:text-slate-200">{r.name}</td>
                    <td className={td}>{r.phone}</td>
                    <td className={td}>{r.zone || "—"}</td>
                    <td className={td}>{r.clientType || "—"}</td>
                    <td className={td}>{r.connectionType || "—"}</td>
                    <td className={td}>{r.package || "—"}</td>
                    <td className={td}>{r.speed || "—"}</td>
                    <td className={td}>{r.expiry || "—"}</td>
                    <td className="px-3 py-3 whitespace-nowrap font-semibold text-slate-700 dark:text-slate-200">{fmt(r.monthlyBill)}</td>
                    <td className="px-3 py-3 whitespace-nowrap font-semibold text-emerald-500">{r.received ? fmt(r.received) : "—"}</td>
                    <td className={td}>{r.vat || 0}</td>
                    <td className={`px-3 py-3 whitespace-nowrap font-semibold ${r.due > 0 ? "text-rose-500" : "text-slate-400"}`}>{r.due > 0 ? fmt(r.due) : "—"}</td>
                    <td className={td}>{r.advance ? fmt(r.advance) : "—"}</td>
                    <td className={td}>{r.lastPayment || "—"}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-slate-500">{r.server || "—"}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <button
                        onClick={async () => {
                          try { await toggleLine(r.id); await load(); }
                          catch (e) { notify(e.message); }
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${r.online ? "bg-sky-500" : "bg-slate-300 dark:bg-white/20"}`}
                        title={r.online ? "Online — click to disable" : "Offline — click to enable"}
                      >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${r.online ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap"><span className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle[r.status]}`}>{r.status}</span></td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openPay(r)} className="rounded-md bg-slate-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-slate-700">Pay</button>
                        <button onClick={() => doDue(r)} className="rounded-md bg-rose-500 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-rose-600">Due</button>
                        <div className="relative">
                          <button onClick={() => setMenuOpen(menuOpen === r.id ? null : r.id)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5">
                            <MoreVertical size={14} />
                          </button>
                          {menuOpen === r.id && (
                            <div className="absolute right-0 z-10 mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-navy-800">
                              <button onClick={() => { setMenuOpen(null); navigate(`/clients?search=${encodeURIComponent(r.name)}`); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5"><Eye size={14} /> View Client</button>
                              <button onClick={() => { setMenuOpen(null); openPay(r); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5"><CreditCard size={14} /> Collect Payment</button>
                              <button onClick={() => { setMenuOpen(null); navigate("/invoices"); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5"><FileSpreadsheet size={14} /> Invoices</button>
                              <button onClick={() => { setMenuOpen(null); navigate("/payments"); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5"><History size={14} /> Payments</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={19} className="py-12 text-center text-sm text-slate-400">Kono customer nei.</td></tr>}
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

      <Modal open={!!payRow} onClose={() => setPayRow(null)} title={`Collect Payment — ${payRow?.name || ""}`} subtitle={payRow ? `${payRow.pppoe} · due ${fmt(payRow.due)}` : ""} size="sm"
        footer={<><button onClick={() => setPayRow(null)} className="btn-ghost">Cancel</button>
          <button onClick={doPay} disabled={payBusy} className="btn-gold">{payBusy ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />} Collect</button></>}>
        <div className="space-y-3">
          {payErr && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{payErr}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Amount (৳)</span>
            <input className={input} type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="500" autoFocus /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Method</span>
            <Dropdown value={payMethod} options={["Cash", "bKash", "Nagad", "Rocket", "Bank"]} onChange={setPayMethod} /></label>
        </div>
      </Modal>
    </div>
  );
}
