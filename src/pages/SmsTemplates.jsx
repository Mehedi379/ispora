import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2, FileText } from "lucide-react";
import Modal from "../components/Modal";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

export default function SmsTemplates() {
  const { notify } = useStore();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", body: "" });
  const [toDelete, setToDelete] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => { setLoading(true); try { setRows(await api.crudList("sms", "templates")); setErr(""); } catch (e) { setErr(e?.message || "Load fail"); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({ name: "", body: "" }); setErr(""); setEditing({}); };
  const openEdit = (t) => { setForm({ name: t.name, body: t.body }); setErr(""); setEditing(t); };
  const save = async () => { setErr(""); try { if (editing.id) await api.crudUpdate("sms", "templates", editing.id, form); else await api.crudCreate("sms", "templates", form); setEditing(null); await load(); } catch (e) { setErr(e.message); } };
  const doDelete = async () => { try { await api.crudDelete("sms", "templates", toDelete.id); setToDelete(null); await load(); } catch (e) { notify(e.message); setToDelete(null); } };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">SMS Template</h2><p className="text-sm text-slate-400">Placeholder: {"{name}"}, {"{due}"}, {"{package}"}</p></div>
        <button onClick={openNew} className="btn-gold"><Plus size={16} /> Add Template</button>
      </div>
      {err && !editing && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : rows.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><FileText className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono template nei.</p></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {rows.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }} className="card group p-4">
              <div className="flex items-start justify-between">
                <p className="font-semibold text-slate-800 dark:text-white">{t.name}</p>
                <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => openEdit(t)} className="rounded-lg p-1.5 text-slate-400 hover:bg-gold-500/10 hover:text-gold-500"><Pencil size={13} /></button>
                  <button onClick={() => setToDelete(t)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={13} /></button>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t.body}</p>
            </motion.div>
          ))}
        </div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Template" : "Add Template"}
        footer={<><button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Name</span>
            <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Due Reminder" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Body</span>
            <textarea className={input} rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Priyo {name}, apnar bill {due} tk baki ache. doya kore porishodh korun." /></label>
        </div>
      </Modal>
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete Template?" subtitle={toDelete?.name} size="sm"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={doDelete} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"><Trash2 size={15} /> Delete</button></>}>
        <p className="text-sm text-slate-500 dark:text-slate-300">{toDelete?.name} delete korbo?</p>
      </Modal>
    </div>
  );
}
