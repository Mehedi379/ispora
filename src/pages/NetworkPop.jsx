import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2, MapPin, Circle } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

const empty = { name: "", type: "pop", lat: "", lng: "", address: "", capacity: "", status: "online" };
const TYPES = ["datacenter", "pop", "tower", "switch"];

export default function NetworkPop() {
  const { user, notify } = useStore();
  const isAdmin = user?.role === "admin";
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [toDelete, setToDelete] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setList(await api.netPops()); setErr(""); } catch (e) { setErr(e?.message || "Load fail"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(empty); setErr(""); setEditing({}); };
  const openEdit = (p) => { setForm({ name: p.name, type: p.type, lat: p.lat ?? "", lng: p.lng ?? "", address: p.address, capacity: p.capacity, status: p.status }); setErr(""); setEditing(p); };
  const save = async () => { setErr(""); try { if (editing.id) await api.netUpdatePop(editing.id, form); else await api.netCreatePop(form); setEditing(null); await load(); } catch (e) { setErr(e.message); } };
  const doDelete = async () => { try { await api.netDeletePop(toDelete.id); setToDelete(null); await load(); } catch (e) { notify(e.message); setToDelete(null); } };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Network POP</h2><p className="text-sm text-slate-400">Point of Presence (node) manage korun</p></div>
        {isAdmin && <button onClick={openNew} className="btn-gold"><Plus size={16} /> Add POP</button>}
      </div>
      {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {list.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card group p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-navy-700 to-navy-900 text-gold-400"><MapPin size={20} /></div>
                  <div><p className="font-semibold text-slate-800 dark:text-white">{p.name}</p><p className="text-xs capitalize text-slate-400">{p.type}</p></div></div>
                <span className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${p.status === "online" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}><Circle size={8} className="fill-current" /> {p.status}</span>
              </div>
              <p className="mt-3 text-xs text-slate-400">{p.address || "Address nei"}</p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4 text-xs text-slate-400">
                <span>{p.clients ?? 0} clients · {p.items ?? 0} items</span>
                {p.lat != null && p.lng != null && <span>{p.lat}, {p.lng}</span>}
              </div>
              {isAdmin && <div className="mt-3 flex justify-end gap-1">
                <button onClick={() => openEdit(p)} className="rounded-lg p-2 text-slate-400 hover:bg-gold-500/10 hover:text-gold-500"><Pencil size={14} /></button>
                <button onClick={() => setToDelete(p)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={14} /></button>
              </div>}
            </motion.div>
          ))}
          {list.length === 0 && <p className="col-span-full py-12 text-center text-sm text-slate-400">Kono POP nei.</p>}
        </div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit POP" : "Add POP"} subtitle={editing?.id ? editing.name : "Notun network node"}
        footer={<><button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {err && <p className="col-span-full rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Name</span>
            <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="POP-Mirpur" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Type</span>
            <Dropdown value={form.type} options={TYPES} onChange={(v) => setForm({ ...form, type: v })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Latitude</span>
            <input className={input} value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="23.80" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Longitude</span>
            <input className={input} value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} placeholder="90.37" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Capacity</span>
            <input className={input} type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Status</span>
            <Dropdown value={form.status} options={["online", "offline"]} onChange={(v) => setForm({ ...form, status: v })} /></label>
          <label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Address</span>
            <input className={input} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
        </div>
      </Modal>
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete POP?" subtitle={toDelete?.name} size="sm"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={doDelete} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"><Trash2 size={15} /> Delete</button></>}>
        <p className="text-sm text-slate-500 dark:text-slate-300"><b className="text-slate-700 dark:text-white">{toDelete?.name}</b> ebong er connection/item delete hobe. Client gula unassigned hobe. Nishchit?</p>
      </Modal>
    </div>
  );
}
