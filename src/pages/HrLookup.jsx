import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

// Generic lookup CRUD (HR + Leave). base = module ("hr" | "leave").
// fields: [{key,label,type:'text'|'number'|'enum'|'select', options?, optionsEntity?}]
export default function HrLookup({ title, entity, fields, base = "hr" }) {
  const { notify } = useStore();
  const [rows, setRows] = useState([]);
  const [opts, setOpts] = useState({}); // select field options by key
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [form, setForm] = useState({});
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await api.crudList(base, entity));
      // select fields er options onno entity theke
      const sel = fields.filter((f) => f.type === "select" && f.optionsEntity);
      const loaded = {};
      await Promise.all(sel.map(async (f) => { loaded[f.key] = await api.crudList(base, f.optionsEntity).catch(() => []); }));
      setOpts(loaded);
      setErr("");
    } catch (e) { setErr(e?.message || "Load fail"); }
    finally { setLoading(false); }
  }, [entity, fields, base]);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({}); setErr(""); setEditing({}); };
  const openEdit = (row) => {
    const f = { name: row.name };
    for (const fl of fields) f[fl.key] = row[fl.key] ?? "";
    setForm(f); setErr(""); setEditing(row);
  };
  const save = async () => {
    setErr("");
    try {
      if (editing.id) await api.crudUpdate(base, entity, editing.id, form);
      else await api.crudCreate(base, entity, form);
      setEditing(null); await load();
    } catch (e) { setErr(e.message); }
  };
  const doDelete = async () => {
    try { await api.crudDelete(base, entity, toDelete.id); setToDelete(null); await load(); }
    catch (e) { notify(e.message); setToDelete(null); }
  };

  const render = (row, f) => {
    if (f.type === "select") return row[f.displayKey || f.key.replace("Id", "")] || "—";
    if (f.type === "enum") return <span className="capitalize">{row[f.key]}</span>;
    return row[f.key] ?? "—";
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">{title}</h2><p className="text-sm text-slate-400">{title} manage korun</p></div>
        <button onClick={openNew} className="btn-gold"><Plus size={16} /> Add {title}</button>
      </div>
      {err && !editing && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr><th className="px-5 py-3 font-semibold">Name</th>
                {fields.map((f) => <th key={f.key} className="px-5 py-3 font-semibold">{f.label}</th>)}
                <th className="px-5 py-3 text-right font-semibold">Action</th></tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <motion.tr key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="border-t border-slate-100 dark:border-white/5">
                  <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{row.name}</td>
                  {fields.map((f) => <td key={f.key} className="px-5 py-3 text-slate-500 dark:text-slate-400">{render(row, f)}</td>)}
                  <td className="px-5 py-3"><div className="flex justify-end gap-1">
                    <button onClick={() => openEdit(row)} className="rounded-lg p-2 text-slate-400 hover:bg-gold-500/10 hover:text-gold-500"><Pencil size={15} /></button>
                    <button onClick={() => setToDelete(row)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={15} /></button>
                  </div></td>
                </motion.tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={fields.length + 2} className="py-12 text-center text-sm text-slate-400">Kono {title.toLowerCase()} nei.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? `Edit ${title}` : `Add ${title}`} subtitle={editing?.id ? editing.name : `Notun ${title.toLowerCase()}`}
        footer={<><button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Name</span>
            <input className={input} value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus /></label>
          {fields.map((f) => (
            <label key={f.key} className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">{f.label}</span>
              {f.type === "select" ? (
                <Dropdown
                  value={form[f.key] || ""}
                  options={(opts[f.key] || []).map((o) => ({ value: o.id, label: o.name }))}
                  onChange={(v) => setForm({ ...form, [f.key]: v || "" })}
                  placeholder={f.label}
                />
              ) : f.type === "enum" ? (
                <Dropdown
                  value={form[f.key] || f.options[0]}
                  options={f.options}
                  onChange={(v) => setForm({ ...form, [f.key]: v })}
                />
              ) : (
                <input className={input} type={f.type === "number" ? "number" : "text"} value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
              )}
            </label>
          ))}
        </div>
      </Modal>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title={`Delete ${title}?`} subtitle={toDelete?.name} size="sm"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={doDelete} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"><Trash2 size={15} /> Delete</button></>}>
        <p className="text-sm text-slate-500 dark:text-slate-300"><b className="text-slate-700 dark:text-white">{toDelete?.name}</b> delete korbo?</p>
      </Modal>
    </div>
  );
}
