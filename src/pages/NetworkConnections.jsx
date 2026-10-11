import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2, Cable } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

const empty = { fromId: "", toId: "", type: "fiber", bandwidth: "", note: "" };

export default function NetworkConnections() {
  const { user, notify } = useStore();
  const isAdmin = user?.role === "admin";
  const [rows, setRows] = useState([]);
  const [pops, setPops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [toDelete, setToDelete] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const [c, p] = await Promise.all([api.netConnections(), api.netPops()]); setRows(c); setPops(p); setErr(""); }
    catch (e) { setErr(e?.message || "Load fail"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({ ...empty, fromId: pops[0]?.id || "", toId: pops[1]?.id || "" }); setErr(""); setEditing({}); };
  const openEdit = (c) => { setForm({ fromId: c.fromId, toId: c.toId, type: c.type, bandwidth: c.bandwidth, note: c.note }); setErr(""); setEditing(c); };
  const save = async () => { setErr(""); try { if (editing.id) await api.netUpdateConnection(editing.id, form); else await api.netCreateConnection(form); setEditing(null); await load(); } catch (e) { setErr(e.message); } };
  const doDelete = async () => { try { await api.netDeleteConnection(toDelete.id); setToDelete(null); await load(); } catch (e) { notify(e.message); setToDelete(null); } };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Network Connections</h2><p className="text-sm text-slate-400">POP-to-POP link (fiber/wireless)</p></div>
        {isAdmin && <button onClick={openNew} disabled={pops.length < 2} className="btn-gold"><Plus size={16} /> Add Connection</button>}
      </div>
      {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : rows.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><Cable className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono connection nei. {pops.length < 2 && "Age 2+ POP banan."}</p></div>
      ) : (
        <div className="card overflow-hidden"><table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
            <th className="px-5 py-3 font-semibold">From</th><th className="px-5 py-3 font-semibold">To</th>
            <th className="px-5 py-3 font-semibold">Type</th><th className="px-5 py-3 font-semibold">Bandwidth</th>
            {isAdmin && <th className="px-5 py-3 text-right font-semibold">Action</th>}</tr></thead>
          <tbody>
            {rows.map((c, i) => (
              <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="border-t border-slate-100 dark:border-white/5">
                <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{c.from}</td>
                <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{c.to}</td>
                <td className="px-5 py-3 capitalize text-slate-500 dark:text-slate-400">{c.type}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{c.bandwidth || "—"}</td>
                {isAdmin && <td className="px-5 py-3"><div className="flex justify-end gap-1">
                  <button onClick={() => openEdit(c)} className="rounded-lg p-2 text-slate-400 hover:bg-gold-500/10 hover:text-gold-500"><Pencil size={15} /></button>
                  <button onClick={() => setToDelete(c)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={15} /></button>
                </div></td>}
              </motion.tr>
            ))}
          </tbody>
        </table></div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Connection" : "Add Connection"}
        footer={<><button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">From POP</span>
              <Dropdown value={form.fromId} options={pops.map((p) => ({ value: p.id, label: p.name }))} onChange={(v) => setForm({ ...form, fromId: v })} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">To POP</span>
              <Dropdown value={form.toId} options={pops.map((p) => ({ value: p.id, label: p.name }))} onChange={(v) => setForm({ ...form, toId: v })} /></label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Type</span>
              <Dropdown value={form.type} options={["fiber", "wireless", "utp"]} onChange={(v) => setForm({ ...form, type: v })} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Bandwidth</span>
              <input className={input} value={form.bandwidth} onChange={(e) => setForm({ ...form, bandwidth: e.target.value })} placeholder="10 Gbps" /></label>
          </div>
        </div>
      </Modal>
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete Connection?" size="sm"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={doDelete} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"><Trash2 size={15} /> Delete</button></>}>
        <p className="text-sm text-slate-500 dark:text-slate-300">{toDelete?.from} → {toDelete?.to} connection delete korbo?</p>
      </Modal>
    </div>
  );
}
