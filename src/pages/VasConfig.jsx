import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Pencil, Trash2, Plus, Loader2, Tv } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

const TYPES = ["IPTV", "OTT", "Static IP", "Cloud", "Other"];

export default function VasConfig() {
  const { user, notify } = useStore();
  const isAdmin = user?.role === "admin";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [form, setForm] = useState({ name: "", type: "IPTV", price: "" });
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await api.listVasServices()); setErr(""); }
    catch (e) { setErr(e?.message || "Load fail"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({ name: "", type: "IPTV", price: "" }); setErr(""); setEditing({}); };
  const openEdit = (s) => { setForm({ name: s.name, type: s.type, price: s.price, active: s.active }); setErr(""); setEditing(s); };

  const save = async () => {
    setErr("");
    try {
      if (editing.id) await api.updateVasService(editing.id, form);
      else await api.createVasService(form);
      setEditing(null); await load();
    } catch (e) { setErr(e.message); }
  };
  const doDelete = async () => {
    try { await api.deleteVasService(toDelete.id); setToDelete(null); await load(); }
    catch (e) { notify(e.message); setToDelete(null); }
  };
  const toggleActive = async (s) => {
    try { await api.updateVasService(s.id, { active: !s.active }); await load(); }
    catch (e) { notify(e.message); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">VAS Config</h2>
          <p className="text-sm text-slate-400">Value Added Service (IPTV, OTT, Static IP ...) manage korun</p>
        </div>
        {isAdmin && <button onClick={openNew} className="btn-gold"><Plus size={16} /> Add Service</button>}
      </div>

      {err && !editing && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card p-5">
              <div className="flex items-start justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-navy-950"><Tv size={20} /></div>
                <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${s.active ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-400/10 text-slate-400"}`}>{s.active ? "Active" : "Off"}</span>
              </div>
              <h3 className="mt-3 font-display text-lg font-bold text-slate-800 dark:text-white">{s.name}</h3>
              <p className="text-xs uppercase tracking-wide text-slate-400">{s.type}</p>
              <p className="mt-2 font-display text-2xl font-extrabold gold-text">৳{s.price}</p>
              {isAdmin && (
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-3">
                  <button onClick={() => toggleActive(s)} className="text-xs font-semibold text-slate-400 hover:text-gold-500">{s.active ? "Deactivate" : "Activate"}</button>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} className="rounded-lg p-2 text-slate-400 hover:bg-gold-500/10 hover:text-gold-500"><Pencil size={15} /></button>
                    <button onClick={() => setToDelete(s)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={15} /></button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
          {rows.length === 0 && <p className="col-span-full py-12 text-center text-sm text-slate-400">Kono VAS service nei.</p>}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Service" : "Add VAS Service"} subtitle={editing?.id ? editing.name : "Notun value added service"}
        footer={<><button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Name</span>
            <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. IPTV Premium" autoFocus /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Type</span>
              <Dropdown value={form.type} options={TYPES} onChange={(v) => setForm({ ...form, type: v })} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Price (৳)</span>
              <input className={input} type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="300" /></label>
          </div>
        </div>
      </Modal>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete Service?" subtitle={toDelete?.name} size="sm"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={doDelete} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"><Trash2 size={15} /> Delete</button></>}>
        <p className="text-sm text-slate-500 dark:text-slate-300"><b className="text-slate-700 dark:text-white">{toDelete?.name}</b> delete korbo?</p>
      </Modal>
    </div>
  );
}
