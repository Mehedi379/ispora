import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Pencil, Trash2, Plus, Loader2, Search } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

// Generic Configuration page — Zone/Sub Zone/Box/Connection Type ityadi shob
// ei ekta component diye-i cholbe. parent = optional dropdown relation.
//   entity: API slug (jemon "sub-zones")
//   parent: { entity, key, label } — SubZone->Zone hole { entity:"zones", key:"zoneId", label:"Zone" }
//   extra: ["code","capacity"] — Box er jonno
export default function ConfigEntity({ title, subtitle, entity, parent, grand, extra = [], hasActive }) {
  const { user, notify } = useStore();
  const isAdmin = user?.role === "admin";
  const [rows, setRows] = useState([]);
  const [parentRows, setParentRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [form, setForm] = useState({});
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, pList] = await Promise.all([
        api.listConfig(entity),
        parent ? api.listConfig(parent.entity) : Promise.resolve([]),
      ]);
      setRows(list);
      setParentRows(pList);
      setErr("");
    } catch (e) {
      setErr(e?.message || "Load fail holo");
    } finally { setLoading(false); }
  }, [entity, parent]);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({}); setErr(""); setEditing({}); };
  const openEdit = (row) => {
    const f = { name: row.name, details: row.details || "" };
    if (parent) f[parent.key] = row[parent.key] || "";
    if (extra.includes("code")) f.code = row.code || "";
    if (extra.includes("capacity")) f.capacity = row.capacity ?? 0;
    if (hasActive) f.active = row.active ?? true;
    setForm(f); setErr(""); setEditing(row);
  };

  const toggleActive = async (row) => {
    try { await api.updateConfig(entity, row.id, { active: !row.active }); await load(); }
    catch (e) { notify(e.message); }
  };

  const save = async () => {
    setErr("");
    try {
      if (editing.id) await api.updateConfig(entity, editing.id, form);
      else await api.createConfig(entity, form);
      setEditing(null);
      await load();
    } catch (e) { setErr(e.message); }
  };

  const doDelete = async () => {
    try { await api.deleteConfig(entity, toDelete.id); setToDelete(null); await load(); }
    catch (e) { notify(e.message); setToDelete(null); }
  };

  const filtered = rows.filter((r) =>
    !q || r.name?.toLowerCase().includes(q.toLowerCase()) ||
    (parent && r[parent.rel]?.toLowerCase?.().includes(q.toLowerCase())));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">{title}</h2>
          <p className="text-sm text-slate-400">{subtitle || `${title} manage korun`}</p>
        </div>
        {isAdmin && <button onClick={openNew} className="btn-gold"><Plus size={16} /> Add {title}</button>}
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className={`${input} pl-9`} placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {err && !editing && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 dark:border-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3 font-semibold">#</th>
                <th className="px-5 py-3 font-semibold">Name</th>
                {parent && <th className="px-5 py-3 font-semibold">{parent.label}</th>}
                {grand && <th className="px-5 py-3 font-semibold">{grand.label}</th>}
                {extra.includes("code") && <th className="px-5 py-3 font-semibold">Code</th>}
                {extra.includes("capacity") && <th className="px-5 py-3 font-semibold">Capacity</th>}
                <th className="px-5 py-3 font-semibold">Details</th>
                {hasActive && <th className="px-5 py-3 font-semibold">Active</th>}
                {isAdmin && <th className="px-5 py-3 text-right font-semibold">Action</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <motion.tr key={row.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-slate-50 last:border-0 dark:border-white/5 hover:bg-slate-50/60 dark:hover:bg-white/5">
                  <td className="px-5 py-3 text-slate-400">{i + 1}</td>
                  <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{row.name}</td>
                  {parent && <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{row[parent.rel] || "—"}</td>}
                  {grand && <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{row[grand.rel] || "—"}</td>}
                  {extra.includes("code") && <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{row.code || "—"}</td>}
                  {extra.includes("capacity") && <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{row.capacity || 0}</td>}
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{row.details || "—"}</td>
                  {hasActive && (
                    <td className="px-5 py-3">
                      <button onClick={() => isAdmin && toggleActive(row)} disabled={!isAdmin}
                        className={`relative h-6 w-11 rounded-full transition ${row.active ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/15"} ${isAdmin ? "cursor-pointer" : "cursor-default opacity-70"}`}>
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${row.active ? "left-[22px]" : "left-0.5"}`} />
                      </button>
                    </td>
                  )}
                  {isAdmin && (
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(row)} className="rounded-lg p-2 text-slate-400 hover:bg-gold-500/10 hover:text-gold-500"><Pencil size={15} /></button>
                        <button onClick={() => setToDelete(row)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="py-12 text-center text-sm text-slate-400">Kono {title.toLowerCase()} nei.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)}
        title={editing?.id ? `Edit ${title}` : `Add ${title}`} subtitle={editing?.id ? editing.name : `Notun ${title.toLowerCase()}`}
        footer={<><button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Name</span>
            <input className={input} value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={`${title} name`} autoFocus /></label>
          {parent && (
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">{parent.label}</span>
              <Dropdown
                value={form[parent.key] || ""}
                options={parentRows.map((p) => ({ value: p.id, label: p.name }))}
                onChange={(v) => setForm({ ...form, [parent.key]: v || "" })}
                placeholder={`${parent.label} select korun`}
              /></label>
          )}
          {extra.includes("code") && (
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Code</span>
              <input className={input} value={form.code || ""} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. BOX-01" /></label>
          )}
          {extra.includes("capacity") && (
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Capacity</span>
              <input className={input} type="number" value={form.capacity ?? ""} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="e.g. 16" /></label>
          )}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Details</span>
            <textarea className={`${input} min-h-[70px]`} value={form.details || ""} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="Details / note (optional)" /></label>
          {hasActive && (
            <label className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={form.active ?? true} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 accent-emerald-500" />
              Active
            </label>
          )}
        </div>
      </Modal>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title={`Delete ${title}?`} subtitle={toDelete?.name} size="sm"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={doDelete} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600"><Trash2 size={15} /> Delete</button></>}>
        <p className="text-sm text-slate-500 dark:text-slate-300"><b className="text-slate-700 dark:text-white">{toDelete?.name}</b> delete korbo?</p>
      </Modal>
    </div>
  );
}
