import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Check, X, Trash2, Loader2, ClipboardList } from "lucide-react";
import Modal from "../components/Modal";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

const stStyle = { pending: "text-amber-500 bg-amber-500/10", approved: "text-emerald-500 bg-emerald-500/10", rejected: "text-rose-500 bg-rose-500/10" };

export default function PurchaseReqs() {
  const { notify } = useStore();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ item: "", qty: 1, requestedBy: "", note: "" });
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await api.crudList("purchase", "requisitions", filter === "all" ? {} : { status: filter })); setErr(""); }
    catch (e) { setErr(e?.message || "Load fail"); } finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  const save = async () => { setErr(""); try { await api.crudCreate("purchase", "requisitions", form); setAdding(false); setForm({ item: "", qty: 1, requestedBy: "", note: "" }); await load(); } catch (e) { setErr(e.message); } };
  const act = async (id, action) => { setBusy(id); try { await api.purchReqAction(id, action); await load(); } catch (e) { notify(e.message); } finally { setBusy(null); } };
  const del = async (id) => { setBusy(id); try { await api.crudDelete("purchase", "requisitions", id); await load(); } catch (e) { notify(e.message); } finally { setBusy(null); } };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Requisition</h2><p className="text-sm text-slate-400">Purchase request — approve kore procure korun</p></div>
        <button onClick={() => { setForm({ item: "", qty: 1, requestedBy: "", note: "" }); setErr(""); setAdding(true); }} className="btn-gold"><Plus size={16} /> New Requisition</button>
      </div>
      <div className="flex gap-2">{["pending", "approved", "rejected", "all"].map((s) => (<button key={s} onClick={() => setFilter(s)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${filter === s ? "bg-gold-500/20 text-gold-500" : "text-slate-400 hover:bg-white/5"}`}>{s}</button>))}</div>
      {err && !adding && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : rows.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><ClipboardList className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono requisition nei.</p></div>
      ) : (
        <div className="card overflow-hidden"><table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
            <th className="px-5 py-3 font-semibold">Item</th><th className="px-5 py-3 font-semibold">Qty</th>
            <th className="px-5 py-3 font-semibold">Requested By</th><th className="px-5 py-3 font-semibold">Status</th>
            <th className="px-5 py-3 text-right font-semibold">Action</th></tr></thead>
          <tbody>
            {rows.map((x, i) => (
              <motion.tr key={x.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="border-t border-slate-100 dark:border-white/5">
                <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{x.item}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{x.qty}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{x.requestedBy || "—"}</td>
                <td className="px-5 py-3"><span className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${stStyle[x.status]}`}>{x.status}</span></td>
                <td className="px-5 py-3"><div className="flex justify-end gap-1.5">
                  {x.status === "pending" && (<>
                    <button onClick={() => act(x.id, "approve")} disabled={busy === x.id} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20 disabled:opacity-50">{busy === x.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Approve</button>
                    <button onClick={() => act(x.id, "reject")} disabled={busy === x.id} className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-500/20 disabled:opacity-50"><X size={13} /> Reject</button>
                  </>)}
                  <button onClick={() => del(x.id)} disabled={busy === x.id} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={14} /></button>
                </div></td>
              </motion.tr>
            ))}
          </tbody>
        </table></div>
      )}
      <Modal open={adding} onClose={() => setAdding(false)} title="New Requisition"
        footer={<><button onClick={() => setAdding(false)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Item</span>
            <input className={input} value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} placeholder="Router, cable..." /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Qty</span>
              <input className={input} type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Requested By</span>
              <input className={input} value={form.requestedBy} onChange={(e) => setForm({ ...form, requestedBy: e.target.value })} /></label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
