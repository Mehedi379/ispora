import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Wifi, Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";

import { input } from "../ui";

export default function Packages() {
  const { user } = useStore();
  const isAdmin = user?.role === "admin";
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // pkg obj or {} for new
  const [toDelete, setToDelete] = useState(null);
  const [form, setForm] = useState({ name: "", speed: "", price: "", validity: 30, type: "", vas: "", description: "" });
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPackages(await api.listPackages());
      setErr("");
    } catch (e) {
      // Age catch chilo na → fail hole "Kono package nei." dekhato (misleading)
      setErr(e?.message || "Package load fail holo");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({ name: "", speed: "", price: "", validity: 30, type: "", vas: "", description: "" }); setErr(""); setEditing({}); };
  const openEdit = (p) => { setForm({ name: p.name, speed: p.speed, price: p.price, validity: p.validity, type: p.type || "", vas: p.vas || "", description: p.description || "" }); setErr(""); setEditing(p); };

  const save = async () => {
    setErr("");
    try {
      if (editing.id) await api.updatePackage(editing.id, form);
      else await api.createPackage(form);
      setEditing(null);
      await load();
    } catch (e) { setErr(e.message); }
  };

  const doDelete = async () => {
    setErr("");
    try { await api.deletePackage(toDelete.id); setToDelete(null); await load(); }
    catch (e) { setErr(e.message); setToDelete(null); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Packages</h2>
          <p className="text-sm text-slate-400">Speed plan manage korun</p>
        </div>
        {isAdmin && <button onClick={openNew} className="btn-gold"><Plus size={16} /> Add Package</button>}
      </div>

      {err && !editing && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {packages.map((p, i) => (
            <motion.div key={p.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }} className="card group relative overflow-hidden p-6">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gold-500/10 blur-2xl transition group-hover:bg-gold-500/20" />
              <div className="flex items-start justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-navy-950 shadow-gold">
                  <Wifi size={22} />
                </div>
                {p.type && (
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${p.type === "Personal" ? "bg-amber-500/15 text-amber-500" : "bg-emerald-500/15 text-emerald-500"}`}>{p.type}</span>
                )}
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-slate-800 dark:text-white">{p.name}</h3>
              <p className="text-sm text-slate-400">{p.speed}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-3xl font-extrabold gold-text">৳{p.price}</span>
                <span className="text-sm text-slate-400">/{p.validity}d</span>
              </div>
              {p.vas && <p className="mt-2 text-xs text-slate-400"><span className="font-semibold text-slate-500 dark:text-slate-300">VAS:</span> {p.vas}</p>}
              {p.description && <p className="mt-1 text-xs text-slate-400">{p.description}</p>}
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4">
                <span className="text-xs text-slate-400">{p.users} active users</span>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="rounded-lg p-2 text-slate-400 hover:bg-gold-500/10 hover:text-gold-500"><Pencil size={15} /></button>
                    <button onClick={() => setToDelete(p)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={15} /></button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {packages.length === 0 && <p className="col-span-full py-12 text-center text-sm text-slate-400">Kono package nei.</p>}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)}
        title={editing?.id ? "Edit Package" : "Add Package"} subtitle={editing?.id ? editing.name : "Notun speed plan"}
        footer={<><button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Name</span>
            <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Home Plus" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Speed / Allocated MB</span>
            <input className={input} value={form.speed} onChange={(e) => setForm({ ...form, speed: e.target.value })} placeholder="e.g. 20 Mbps" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Price (৳)</span>
              <input className={input} type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="800" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Validity (days)</span>
              <input className={input} type="number" value={form.validity} onChange={(e) => setForm({ ...form, validity: e.target.value })} placeholder="30" /></label>
          </div>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Package Type</span>
            <Dropdown value={form.type || ""} options={[{ value: "", label: "— None —" }, { value: "Personal", label: "Personal" }, { value: "Business", label: "Business" }]} onChange={(v) => setForm({ ...form, type: v })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">VAS</span>
            <input className={input} value={form.vas} onChange={(e) => setForm({ ...form, vas: e.target.value })} placeholder="Value-added service (optional)" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Description</span>
            <textarea className={`${input} min-h-[70px]`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" /></label>
        </div>
      </Modal>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete Package?" subtitle={toDelete?.name} size="sm"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={doDelete} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600"><Trash2 size={15} /> Delete</button></>}>
        <p className="text-sm text-slate-500 dark:text-slate-300"><b className="text-slate-700 dark:text-white">{toDelete?.name}</b> package delete korbo?</p>
      </Modal>
    </div>
  );
}
