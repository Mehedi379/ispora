import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2, CheckCircle2, FileText } from "lucide-react";
import Modal from "../components/Modal";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";
import Dropdown from "../components/Dropdown";

const empty = { buyerId: "", amount: "", period: "", status: "unpaid", note: "" };

export default function BwSaleInvoices() {
  const { notify } = useStore();
  const [rows, setRows] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const [i, b] = await Promise.all([api.crudList("bwsale", "invoices", filter === "all" ? {} : { status: filter }), api.crudList("bwsale", "resellers")]); setRows(i); setBuyers(b); setErr(""); }
    catch (e) { setErr(e?.message || "Load fail"); } finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  const unpaid = rows.filter((i) => i.status === "unpaid").reduce((s, i) => s + i.amount, 0);
  const openNew = () => { setForm({ ...empty, buyerId: buyers[0]?.id || "" }); setErr(""); setAdding(true); };
  const save = async () => { setErr(""); try { await api.crudCreate("bwsale", "invoices", form); setAdding(false); await load(); } catch (e) { setErr(e.message); } };
  const pay = async (i) => { setBusy(i.id); try { await api.bwSalePayInvoice(i.id); await load(); } catch (e) { notify(e.message); } finally { setBusy(null); } };
  const del = async (i) => { setBusy(i.id); try { await api.crudDelete("bwsale", "invoices", i.id); await load(); } catch (e) { notify(e.message); } finally { setBusy(null); } };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Sales Invoice</h2><p className="text-sm text-slate-400">Reseller-der kache bandwidth bikri — unpaid <b className="text-rose-500">৳{unpaid.toLocaleString()}</b></p></div>
        <button onClick={openNew} disabled={buyers.length === 0} className="btn-gold"><Plus size={16} /> Add Invoice</button>
      </div>
      <div className="flex gap-2">{["unpaid", "paid", "all"].map((s) => (<button key={s} onClick={() => setFilter(s)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${filter === s ? "bg-gold-500/20 text-gold-500" : "text-slate-400 hover:bg-white/5"}`}>{s}</button>))}</div>
      {err && !adding && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : rows.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><FileText className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono invoice nei. {buyers.length === 0 && "Age Reseller banan."}</p></div>
      ) : (
        <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
            <th className="px-5 py-3 font-semibold">Reseller</th><th className="px-5 py-3 font-semibold">Period</th>
            <th className="px-5 py-3 font-semibold">Amount</th><th className="px-5 py-3 font-semibold">Date</th>
            <th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 text-right font-semibold">Action</th></tr></thead>
          <tbody>
            {rows.map((i, idx) => (
              <motion.tr key={i.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(idx * 0.02, 0.3) }} className="border-t border-slate-100 dark:border-white/5">
                <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{i.buyer}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{i.period || "—"}</td>
                <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-200">৳{i.amount.toLocaleString()}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{i.date}</td>
                <td className="px-5 py-3"><span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${i.status === "paid" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>{i.status}</span></td>
                <td className="px-5 py-3"><div className="flex justify-end gap-1.5">
                  {i.status !== "paid" && <button onClick={() => pay(i)} disabled={busy === i.id} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20 disabled:opacity-50">{busy === i.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Pay</button>}
                  <button onClick={() => del(i)} disabled={busy === i.id} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={14} /></button>
                </div></td>
              </motion.tr>
            ))}
          </tbody>
        </table></div></div>
      )}
      <Modal open={adding} onClose={() => setAdding(false)} title="Add Sales Invoice"
        footer={<><button onClick={() => setAdding(false)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Reseller</span>
            <Dropdown value={form.buyerId} options={buyers.map((b) => ({ value: b.id, label: b.name }))} onChange={(v) => setForm({ ...form, buyerId: v })} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Amount (৳)</span>
              <input className={input} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Period</span>
              <input className={input} value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="October 2026" /></label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
