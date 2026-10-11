import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Server, Plus, Pencil, Trash2, Loader2, Circle, Cpu } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

const empty = { name: "", ip: "", model: "", capacity: "", status: "online" };

export default function OltDevices() {
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
    try { setList(await api.oltDevices()); setErr(""); }
    catch (e) { setErr(e?.message || "Load fail"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(empty); setErr(""); setEditing({}); };
  const openEdit = (s) => { setForm({ name: s.name, ip: s.ip, model: s.model, capacity: s.capacity, status: s.status }); setErr(""); setEditing(s); };
  const save = async () => {
    setErr("");
    try { if (editing.id) await api.oltUpdateDevice(editing.id, form); else await api.oltCreateDevice(form); setEditing(null); await load(); }
    catch (e) { setErr(e.message); }
  };
  const doDelete = async () => { try { await api.oltDeleteDevice(toDelete.id); setToDelete(null); await load(); } catch (e) { notify(e.message); setToDelete(null); } };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">OLT</h2><p className="text-sm text-slate-400">OLT device (PON) manage korun</p></div>
        {isAdmin && <button onClick={openNew} className="btn-gold"><Plus size={16} /> Add OLT</button>}
      </div>
      {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {list.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card group p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-navy-700 to-navy-900 text-gold-400"><Server size={20} /></div>
                  <div><p className="font-semibold text-slate-800 dark:text-white">{s.name}</p><p className="text-xs text-slate-400">{s.ip || "IP nei"}</p></div></div>
                <span className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${s.status === "online" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}><Circle size={8} className="fill-current" /> {s.status}</span>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400"><Cpu size={13} /> {s.model || "Model nei"}</p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4">
                <div><p className="text-xs text-slate-400">ONU Capacity</p><p className="font-bold text-slate-700 dark:text-slate-200">{s.capacity || "—"}</p></div>
                {isAdmin && <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => openEdit(s)} className="rounded-lg p-2 text-slate-400 hover:bg-gold-500/10 hover:text-gold-500"><Pencil size={14} /></button>
                  <button onClick={() => setToDelete(s)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={14} /></button>
                </div>}
              </div>
            </motion.div>
          ))}
          {list.length === 0 && <p className="col-span-full py-12 text-center text-sm text-slate-400">Kono OLT nei.</p>}
        </div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit OLT" : "Add OLT"} subtitle={editing?.id ? editing.name : "Notun OLT device"}
        footer={<><button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Name</span>
            <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="OLT-Mirpur-A" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">IP</span>
              <input className={input} value={form.ip} onChange={(e) => setForm({ ...form, ip: e.target.value })} placeholder="10.0.0.2" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Model</span>
              <input className={input} value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="VSOL 8-PON" /></label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">ONU Capacity</span>
              <input className={input} type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="512" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Status</span>
              <Dropdown value={form.status} options={["online", "offline"]} onChange={(v) => setForm({ ...form, status: v })} /></label>
          </div>
        </div>
      </Modal>
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete OLT?" subtitle={toDelete?.name} size="sm"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={doDelete} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"><Trash2 size={15} /> Delete</button></>}>
        <p className="text-sm text-slate-500 dark:text-slate-300"><b className="text-slate-700 dark:text-white">{toDelete?.name}</b> ebong er OLT users delete hobe. Nishchit?</p>
      </Modal>
    </div>
  );
}
