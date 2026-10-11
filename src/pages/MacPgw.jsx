import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2, CreditCard } from "lucide-react";
import Modal from "../components/Modal";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";
import { clientLabel } from "../data";
import Dropdown from "../components/Dropdown";

const stStyle = { success: "text-emerald-500 bg-emerald-500/10", pending: "text-amber-500 bg-amber-500/10", failed: "text-rose-500 bg-rose-500/10" };
const GATEWAYS = ["bKash", "Nagad", "Rocket", "SSLCommerz", "Card"];

export default function MacPgw() {
  const { notify, clients } = useStore();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ clientId: "", amount: "", gateway: "bKash", txnId: "", status: "success", note: "" });
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await api.crudList("mac", "pgw-payments", filter === "all" ? {} : { status: filter })); setErr(""); }
    catch (e) { setErr(e?.message || "Load fail"); } finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  const total = rows.filter((p) => p.status === "success").reduce((s, p) => s + p.amount, 0);
  const clientName = (id) => clients.find((c) => c.id === id)?.name || (id ? `#${id}` : "—");

  const save = async () => { setErr(""); try { await api.crudCreate("mac", "pgw-payments", form); setAdding(false); setForm({ clientId: "", amount: "", gateway: "bKash", txnId: "", status: "success", note: "" }); await load(); } catch (e) { setErr(e.message); } };
  const del = async (p) => { try { await api.crudDelete("mac", "pgw-payments", p.id); await load(); } catch (e) { notify(e.message); } };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Client PGW Payments</h2><p className="text-sm text-slate-400">Online payment gateway log — success mot <b className="text-emerald-500">৳{total.toLocaleString()}</b></p></div>
        <button onClick={() => { setErr(""); setAdding(true); }} className="btn-gold"><Plus size={16} /> Record Payment</button>
      </div>
      <div className="flex gap-2">
        {["success", "pending", "failed", "all"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${filter === s ? "bg-gold-500/20 text-gold-500" : "text-slate-400 hover:bg-white/5"}`}>{s}</button>
        ))}
      </div>
      {err && !adding && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : rows.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><CreditCard className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono PGW payment nei.</p></div>
      ) : (
        <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
            <th className="px-5 py-3 font-semibold">Client</th><th className="px-5 py-3 font-semibold">Gateway</th>
            <th className="px-5 py-3 font-semibold">TxnID</th><th className="px-5 py-3 font-semibold">Amount</th>
            <th className="px-5 py-3 font-semibold">Date</th><th className="px-5 py-3 font-semibold">Status</th>
            <th className="px-5 py-3 text-right font-semibold">Action</th></tr></thead>
          <tbody>
            {rows.map((p, i) => (
              <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="border-t border-slate-100 dark:border-white/5">
                <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{clientName(p.clientId)}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{p.gateway}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{p.txnId || "—"}</td>
                <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-200">৳{p.amount}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{p.date}</td>
                <td className="px-5 py-3"><span className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${stStyle[p.status]}`}>{p.status}</span></td>
                <td className="px-5 py-3"><div className="flex justify-end"><button onClick={() => del(p)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={14} /></button></div></td>
              </motion.tr>
            ))}
          </tbody>
        </table></div></div>
      )}
      <Modal open={adding} onClose={() => setAdding(false)} title="Record PGW Payment" subtitle="Online payment entry"
        footer={<><button onClick={() => setAdding(false)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {err && <p className="col-span-full rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Client (optional)</span>
            <Dropdown value={form.clientId} options={clients.map((c) => ({ value: c.id, label: clientLabel(c) }))} onChange={(v) => setForm({ ...form, clientId: v || "" })} placeholder="Client" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Gateway</span>
            <Dropdown value={form.gateway} options={GATEWAYS} onChange={(v) => setForm({ ...form, gateway: v })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Amount (৳)</span>
            <input className={input} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Txn ID</span>
            <input className={input} value={form.txnId} onChange={(e) => setForm({ ...form, txnId: e.target.value })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Status</span>
            <Dropdown value={form.status} options={["success", "pending", "failed"]} onChange={(v) => setForm({ ...form, status: v })} /></label>
        </div>
      </Modal>
    </div>
  );
}
