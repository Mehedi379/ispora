import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, Banknote, HandCoins } from "lucide-react";
import Modal from "../components/Modal";
import { useStore } from "../store";
import { api } from "../api";
import Dropdown from "../components/Dropdown";

export default function BwBillCollection() {
  const { notify } = useStore();
  const [unpaid, setUnpaid] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collect, setCollect] = useState(null); // invoice being collected
  const [form, setForm] = useState({ method: "Cash" });
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const [inv, pay] = await Promise.all([api.crudList("bwsale", "invoices", { status: "unpaid" }), api.crudList("bwsale", "payments")]); setUnpaid(inv); setPayments(pay); }
    catch (e) { notify(e.message); } finally { setLoading(false); }
  }, [notify]);
  useEffect(() => { load(); }, [load]);

  const open = (inv) => { setForm({ method: "Cash" }); setErr(""); setCollect(inv); };
  const save = async () => {
    setErr("");
    try { await api.crudCreate("bwsale", "payments", { buyerId: collect.buyerId, invoiceId: collect.id, amount: collect.amount, method: form.method }); setCollect(null); await load(); notify("Collection holo", "success"); }
    catch (e) { setErr(e.message); }
  };

  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-5">
      <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Bill Collection</h2><p className="text-sm text-slate-400">Reseller invoice collect — mot collected <b className="text-emerald-500">৳{totalCollected.toLocaleString()}</b></p></div>
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : (
        <>
          <h3 className="text-sm font-semibold text-slate-500">Unpaid Invoices</h3>
          {unpaid.length === 0 ? <div className="card py-10 text-center text-sm text-slate-400">Kono unpaid invoice nei 🎉</div> : (
            <div className="card overflow-hidden"><table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
                <th className="px-5 py-3 font-semibold">Reseller</th><th className="px-5 py-3 font-semibold">Period</th><th className="px-5 py-3 font-semibold">Amount</th><th className="px-5 py-3 text-right font-semibold">Action</th></tr></thead>
              <tbody>
                {unpaid.map((i) => (
                  <tr key={i.id} className="border-t border-slate-100 dark:border-white/5">
                    <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{i.buyer}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{i.period || "—"}</td>
                    <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-200">৳{i.amount.toLocaleString()}</td>
                    <td className="px-5 py-3"><div className="flex justify-end"><button onClick={() => open(i)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20"><HandCoins size={13} /> Collect</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
          <h3 className="text-sm font-semibold text-slate-500">Collection History</h3>
          {payments.length === 0 ? <div className="card py-8 text-center text-sm text-slate-400">Kono collection nei.</div> : (
            <div className="card overflow-hidden"><table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
                <th className="px-5 py-3 font-semibold">Reseller</th><th className="px-5 py-3 font-semibold">Amount</th><th className="px-5 py-3 font-semibold">Method</th><th className="px-5 py-3 font-semibold">Date</th></tr></thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100 dark:border-white/5">
                    <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{p.buyer}</td>
                    <td className="px-5 py-3 font-semibold text-emerald-600">৳{p.amount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{p.method}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{p.date}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </>
      )}
      <Modal open={!!collect} onClose={() => setCollect(null)} title="Collect Payment" subtitle={collect ? `${collect.buyer} · ৳${collect.amount}` : ""} size="sm"
        footer={<><button onClick={() => setCollect(null)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold"><Banknote size={15} /> Collect</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Method</span>
            <Dropdown value={form.method} options={["Cash", "bKash", "Nagad", "Bank"]} onChange={(v) => setForm({ ...form, method: v })} /></label>
          <p className="text-xs text-slate-400">Collect korle invoice <b>paid</b> hoye jabe.</p>
        </div>
      </Modal>
    </div>
  );
}
