import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2, CheckCircle2, FileText } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";
import { clientLabel } from "../data";

// kind: "product" | "service" | "installation"
const TITLES = { product: "Product Invoice", service: "Service Invoice", installation: "Installation Fee" };

export default function SalesEntries({ kind = "product" }) {
  const { notify, clients } = useStore();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ clientId: "", item: "", qty: 1, unitPrice: "", amount: "", status: "unpaid" });
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");
  const isProduct = kind === "product";

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await api.salesList({ kind, ...(filter === "all" ? {} : { status: filter }) })); setErr(""); }
    catch (e) { setErr(e?.message || "Load fail"); } finally { setLoading(false); }
  }, [kind, filter]);
  useEffect(() => { load(); }, [load]);

  const total = rows.filter((r) => r.status === "unpaid").reduce((s, r) => s + r.amount, 0);
  const openNew = () => { setForm({ clientId: "", item: "", qty: 1, unitPrice: "", amount: "", status: "unpaid" }); setErr(""); setAdding(true); };
  const save = async () => {
    setErr("");
    const client = clients.find((c) => String(c.id) === String(form.clientId));
    try {
      await api.salesCreate({ kind, clientId: form.clientId || undefined, clientName: client?.name, item: form.item, qty: form.qty, unitPrice: form.unitPrice, amount: form.amount });
      setAdding(false); await load();
    } catch (e) { setErr(e.message); }
  };
  const pay = async (x) => { setBusy(x.id); try { await api.salesPay(x.id); await load(); } catch (e) { notify(e.message); } finally { setBusy(null); } };
  const del = async (x) => { setBusy(x.id); try { await api.salesDelete(x.id); await load(); } catch (e) { notify(e.message); } finally { setBusy(null); } };
  const liveTotal = isProduct ? (Number(form.qty) || 0) * (Number(form.unitPrice) || 0) : (Number(form.amount) || 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">{TITLES[kind]}</h2><p className="text-sm text-slate-400">Client-der kache {kind} bikri — unpaid <b className="text-rose-500">৳{total.toLocaleString()}</b></p></div>
        <button onClick={openNew} className="btn-gold"><Plus size={16} /> Add</button>
      </div>
      <div className="flex gap-2">{["unpaid", "paid", "all"].map((s) => (<button key={s} onClick={() => setFilter(s)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${filter === s ? "bg-gold-500/20 text-gold-500" : "text-slate-400 hover:bg-white/5"}`}>{s}</button>))}</div>
      {err && !adding && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : rows.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><FileText className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono {TITLES[kind].toLowerCase()} nei.</p></div>
      ) : (
        <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
            <th className="px-5 py-3 font-semibold">Client</th>{isProduct && <th className="px-5 py-3 font-semibold">Item</th>}
            {isProduct && <th className="px-5 py-3 font-semibold">Qty</th>}<th className="px-5 py-3 font-semibold">Amount</th>
            <th className="px-5 py-3 font-semibold">Date</th><th className="px-5 py-3 font-semibold">Status</th>
            <th className="px-5 py-3 text-right font-semibold">Action</th></tr></thead>
          <tbody>
            {rows.map((x, i) => (
              <motion.tr key={x.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="border-t border-slate-100 dark:border-white/5">
                <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{x.clientName || "—"}</td>
                {isProduct && <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{x.item || "—"}</td>}
                {isProduct && <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{x.qty}</td>}
                <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-200">৳{x.amount.toLocaleString()}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{x.date}</td>
                <td className="px-5 py-3"><span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${x.status === "paid" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>{x.status}</span></td>
                <td className="px-5 py-3"><div className="flex justify-end gap-1.5">
                  {x.status !== "paid" && <button onClick={() => pay(x)} disabled={busy === x.id} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20 disabled:opacity-50">{busy === x.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Pay</button>}
                  <button onClick={() => del(x)} disabled={busy === x.id} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={14} /></button>
                </div></td>
              </motion.tr>
            ))}
          </tbody>
        </table></div></div>
      )}
      <Modal open={adding} onClose={() => setAdding(false)} title={`Add ${TITLES[kind]}`}
        footer={<><button onClick={() => setAdding(false)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Client</span>
            <Dropdown value={form.clientId} options={clients.map((c) => ({ value: c.id, label: clientLabel(c) }))} onChange={(v) => setForm({ ...form, clientId: v || "" })} placeholder="Client" /></label>
          {isProduct ? (
            <>
              <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Product</span>
                <input className={input} value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} placeholder="Router, ONU..." /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Qty</span>
                  <input className={input} type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></label>
                <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Unit Price (৳)</span>
                  <input className={input} type="number" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} /></label>
              </div>
            </>
          ) : (
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">{kind === "service" ? "Service" : "Description"}</span>
              <input className={input} value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} placeholder={kind === "service" ? "Reconnection, config..." : "New connection setup"} /></label>
          )}
          {!isProduct && (
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Amount (৳)</span>
              <input className={input} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
          )}
          <p className="text-sm text-slate-500 dark:text-slate-400">Total: <b className="text-gold-500">৳{liveTotal.toLocaleString()}</b></p>
        </div>
      </Modal>
    </div>
  );
}
