import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2, Receipt } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";
import { clientLabel } from "../data";

export default function VasTransactions() {
  const { user, notify, clients } = useStore();
  const isAdmin = user?.role === "admin";
  const [rows, setRows] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ serviceId: "", clientId: "", amount: "", note: "" });
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tx, svc] = await Promise.all([api.listVasTransactions(), api.listVasServices()]);
      setRows(tx); setServices(svc); setErr("");
    } catch (e) { setErr(e?.message || "Load fail"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const total = rows.reduce((s, t) => s + (t.amount || 0), 0);

  const openNew = () => { setForm({ serviceId: services[0]?.id || "", clientId: "", amount: "", note: "" }); setErr(""); setAdding(true); };

  // Service badlale amount auto service price e set (user chaile change korte parbe)
  const onService = (id) => {
    const svc = services.find((s) => String(s.id) === String(id));
    setForm((f) => ({ ...f, serviceId: id, amount: svc ? svc.price : f.amount }));
  };

  const save = async () => {
    setErr("");
    try {
      await api.createVasTransaction({
        serviceId: Number(form.serviceId),
        clientId: form.clientId ? Number(form.clientId) : null,
        amount: form.amount === "" ? undefined : Number(form.amount),
        note: form.note,
      });
      setAdding(false); await load();
    } catch (e) { setErr(e.message); }
  };

  const remove = async (t) => {
    try { await api.deleteVasTransaction(t.id); await load(); }
    catch (e) { notify(e.message); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">VAS Transaction History</h2>
          <p className="text-sm text-slate-400">Value added service bikri — mot <b className="text-gold-500">৳{total.toLocaleString()}</b></p>
        </div>
        <button onClick={openNew} className="btn-gold"><Plus size={16} /> Sell VAS</button>
      </div>

      {err && !adding && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>
      ) : rows.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center">
          <Receipt className="text-slate-300 dark:text-white/20" size={40} />
          <p className="mt-3 text-sm text-slate-400">Kono VAS transaction nei.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Service</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Client</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Note</th>
                  {isAdmin && <th className="px-5 py-3 text-right font-semibold">Action</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((t, i) => (
                  <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    className="border-t border-slate-100 dark:border-white/5">
                    <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{t.service}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{t.type}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{t.client || "—"}</td>
                    <td className="px-5 py-3 font-semibold text-emerald-600">৳{t.amount}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{t.date}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{t.note || "—"}</td>
                    {isAdmin && (
                      <td className="px-5 py-3">
                        <div className="flex justify-end">
                          <button onClick={() => remove(t)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Sell VAS" subtitle="Client ke value added service charge korun"
        footer={<><button onClick={() => setAdding(false)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Service</span>
            <Dropdown value={form.serviceId} options={services.map((s) => ({ value: s.id, label: `${s.name} (৳${s.price})` }))} onChange={(v) => onService(v || "")} placeholder="Service select korun" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Client (optional)</span>
            <Dropdown value={form.clientId} options={clients.map((c) => ({ value: c.id, label: clientLabel(c) }))} onChange={(v) => setForm({ ...form, clientId: v || "" })} placeholder="Client nei / general" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Amount (৳)</span>
              <input className={input} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Service price" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Note</span>
              <input className={input} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional" /></label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
