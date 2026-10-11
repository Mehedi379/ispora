import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Wallet, CalendarDays, AlertTriangle, Loader2, Trash2 } from "lucide-react";
import Dropdown from "../components/Dropdown";
import Modal from "../components/Modal";
import { useStore } from "../store";
import { api } from "../api";
import { clientLabel } from "../data";

import { input } from "../ui";
const AUTO = "Auto (oldest baki invoice)";

export default function Payments() {
  const { clients, refreshClients, user, notify } = useStore();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ due: 0 });
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState(null);
  const [method, setMethod] = useState("bKash");
  const [amount, setAmount] = useState("");
  const [err, setErr] = useState("");
  const [loadErr, setLoadErr] = useState("");
  const [openInvoices, setOpenInvoices] = useState([]);
  const [pick, setPick] = useState(AUTO);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pays, st] = await Promise.all([api.listPayments(), api.stats()]);
      setList(pays); setStats(st);
      setLoadErr("");
    } catch (e) {
      // Age catch chilo na → "Kono payment nei." dekhato load fail holeo
      setLoadErr(e?.message || "Payment load fail holo");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (clients.length && !clientId) setClientId(clients[0].id); }, [clients, clientId]);

  // Client select korle tar baki invoice ana (id diye — naam diye noi, duplicate name thakle bhul client hoye jeto)
  useEffect(() => {
    if (!clientId) { setOpenInvoices([]); setPick(AUTO); return; }
    let alive = true;
    api.listInvoices({ clientId, open: 1 })
      .then((l) => { if (alive) { setOpenInvoices(l); setPick(AUTO); } })
      .catch(() => { if (alive) { setOpenInvoices([]); setPick(AUTO); } });
    return () => { alive = false; };
  }, [clientId]);

  const selected = clients.find((c) => c.id === clientId) || null;

  const invoiceOptions = [AUTO, ...openInvoices.map((i) => `${i.id} — ৳${i.amount} (${i.status})`)];
  const chosenInvoiceId = pick === AUTO ? undefined : openInvoices.find((i) => `${i.id} — ৳${i.amount} (${i.status})` === pick)?.id;

  const add = async () => {
    setErr("");
    const client = clients.find((c) => c.id === clientId);
    if (!client || !amount || Number(amount) <= 0) { setErr("Client o 0 er boro amount din"); return; }
    try {
      await api.collectPayment({ clientId: client.id, amount: Number(amount), method, invoiceId: chosenInvoiceId });
      setOpen(false); setAmount(""); setPick(AUTO);
      await Promise.all([load(), refreshClients()]);
    } catch (e) { setErr(e.message); }
  };

  // Void — due/ invoice abar thik hoy (admin only). Renewal (expiry) phirajay na.
  const voidPayment = async (p) => {
    if (!window.confirm(`RCP-${String(p.id).padStart(4, "0")} (৳${p.amount}) delete korben?\nDue abar barbe — renewal (expiry) thakbe.`)) return;
    try {
      await api.voidPayment(p.id);
      notify("Payment void holo — due update hoyeche", "success");
      await Promise.all([load(), refreshClients()]);
    } catch (e) { notify(e.message || "Void fail holo"); }
  };

  // Tile gula server theke ashe (stats) — 200-ta payment list theke count kore bhul hoito
  const tiles = [
    { label: "Today's Collection", value: `৳ ${(stats.collectionToday || 0).toLocaleString()}`, icon: Wallet, color: "from-gold-400 to-gold-600" },
    { label: "This Month", value: `৳ ${(stats.collectionThisMonth || 0).toLocaleString()}`, icon: CalendarDays, color: "from-emerald-400 to-green-600" },
    { label: "Pending Due", value: `৳ ${(stats.due || 0).toLocaleString()}`, icon: AlertTriangle, color: "from-rose-400 to-red-600" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Payments</h2>
          <p className="text-sm text-slate-400">Collection ar receipt manage korun</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-gold"><Plus size={16} /> Collect Payment</button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {tiles.map((t, i) => (
          <motion.div key={t.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="card flex items-center gap-4 p-5">
            <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${t.color} text-white shadow-lg`}><t.icon size={22} /></div>
            <div>
              <p className="text-xl font-bold text-slate-800 dark:text-white">{t.value}</p>
              <p className="text-sm text-slate-400">{t.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="p-5"><h3 className="font-display font-semibold text-slate-800 dark:text-white">Payment History</h3></div>
        {loadErr && (
          <p className="mx-5 mb-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{loadErr}</p>
        )}
        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="animate-spin text-gold-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-5 py-3">Receipt</th><th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Date</th><th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Amount</th>                  <th className="px-5 py-3">Collected By</th>
                  {user?.role === "admin" && <th className="px-5 py-3">Action</th>}
                </tr>
              </thead>
              <tbody>
                {list.map((p, i) => (
                  <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">RCP-{String(p.id).padStart(4, "0")}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{p.client}</td>
                    <td className="px-5 py-3 text-slate-500">{p.date}</td>
                    <td className="px-5 py-3 text-slate-500">{p.method}</td>
                    <td className="px-5 py-3 font-semibold text-emerald-500">৳ {p.amount}</td>
                    <td className="px-5 py-3 text-slate-500">{p.collectedBy || "-"}</td>
                    {user?.role === "admin" && (
                      <td className="px-5 py-3">
                        <button onClick={() => voidPayment(p)} title="Void payment"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    )}
                  </motion.tr>
                ))}
                {list.length === 0 && <tr><td colSpan={user?.role === "admin" ? 7 : 6} className="py-12 text-center text-sm text-slate-400">Kono payment nei.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Collect Payment" subtitle="Customer theke taka collect korun"
        footer={<><button onClick={() => setOpen(false)} className="btn-ghost">Cancel</button><button onClick={add} className="btn-gold">Save Payment</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Customer</span>
            <Dropdown
              value={selected ? clientLabel(selected) : "Customer select korun"}
              options={clients.map(clientLabel)}
              onChange={(v) => setClientId(clients.find((c) => clientLabel(c) === v)?.id ?? null)}
            />
            {selected && (
              <span className="mt-1 block text-xs text-slate-400">
                {selected.zone || "Zone na"} · due ৳{(selected.due || 0).toLocaleString()} · {selected.status}
              </span>
            )}
          </label>
          {openInvoices.length > 0 && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Apply Against Invoice</span>
              <Dropdown value={pick} options={invoiceOptions} onChange={setPick} />
              <span className="mt-1 block text-xs text-slate-400">
                {openInvoices.length} ta baki invoice · auto hole oldest invoice-e adjust hobe
              </span>
            </label>
          )}
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Amount (৳)</span>
            <input className={input} type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Method</span>
            <Dropdown value={method} options={["bKash", "Nagad", "Rocket", "Cash", "Bank"]} onChange={setMethod} />
          </label>
        </div>
      </Modal>
    </div>
  );
}
