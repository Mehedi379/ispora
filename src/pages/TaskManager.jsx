import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2, ChevronRight, ListChecks } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

const prio = { high: "text-rose-500 bg-rose-500/10", medium: "text-amber-500 bg-amber-500/10", low: "text-sky-500 bg-sky-500/10" };
const next = { pending: "processing", processing: "done", done: "pending" };
const stStyle = { pending: "text-amber-500 bg-amber-500/10", processing: "text-sky-500 bg-sky-500/10", done: "text-emerald-500 bg-emerald-500/10" };
const empty = { title: "", categoryId: "", assignee: "", priority: "medium", status: "pending", dueDate: "", note: "" };

// view: "board" | "history"
export default function TaskManager({ view = "board" }) {
  const { notify } = useStore();
  const [rows, setRows] = useState([]);
  const [cats, setCats] = useState([]);
  const [emps, setEmps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(empty);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, c, e] = await Promise.all([
        api.tasksList(view === "history" ? { status: "done" } : {}),
        api.crudList("tasks", "categories").catch(() => []),
        api.crudList("hr", "employees", { status: "active" }).catch(() => []),
      ]);
      setRows(t); setCats(c); setEmps(e); setErr("");
    } catch (er) { setErr(er?.message || "Load fail"); } finally { setLoading(false); }
  }, [view]);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(empty); setErr(""); setAdding(true); };
  const save = async () => { setErr(""); try { await api.tasksCreate(form); setAdding(false); await load(); } catch (e) { setErr(e.message); } };
  const move = async (t) => { try { await api.tasksUpdate(t.id, { status: next[t.status] }); await load(); } catch (e) { notify(e.message); } };
  const del = async (t) => { try { await api.tasksDelete(t.id); await load(); } catch (e) { notify(e.message); } };

  const title = view === "history" ? "Task History" : "Task";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">{title}</h2><p className="text-sm text-slate-400">{view === "history" ? "Complete kora task" : "Internal task assign o track"}</p></div>
        {view === "board" && <button onClick={openNew} className="btn-gold"><Plus size={16} /> Add Task</button>}
      </div>
      {err && !adding && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : rows.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><ListChecks className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono task nei.</p></div>
      ) : (
        <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
            <th className="px-5 py-3 font-semibold">Task</th><th className="px-5 py-3 font-semibold">Category</th>
            <th className="px-5 py-3 font-semibold">Assignee</th><th className="px-5 py-3 font-semibold">Due</th>
            <th className="px-5 py-3 font-semibold">Priority</th><th className="px-5 py-3 font-semibold">Status</th>
            <th className="px-5 py-3 text-right font-semibold">Action</th></tr></thead>
          <tbody>
            {rows.map((t, i) => (
              <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="border-t border-slate-100 dark:border-white/5">
                <td className="px-5 py-3"><p className="font-medium text-slate-700 dark:text-slate-200">{t.title}</p>{t.note && <p className="text-xs text-slate-400">{t.note}</p>}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{t.category || "—"}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{t.assignee || "—"}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{t.dueDate || "—"}</td>
                <td className="px-5 py-3"><span className={`rounded-md px-2 py-0.5 text-[10px] font-bold capitalize ${prio[t.priority]}`}>{t.priority}</span></td>
                <td className="px-5 py-3"><span className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${stStyle[t.status]}`}>{t.status}</span></td>
                <td className="px-5 py-3"><div className="flex justify-end gap-1.5">
                  {view === "board" && <button onClick={() => move(t)} className="inline-flex items-center gap-1 rounded-lg bg-gold-500/10 px-2.5 py-1.5 text-xs font-semibold text-gold-600 hover:bg-gold-500/20">{next[t.status]} <ChevronRight size={12} /></button>}
                  <button onClick={() => del(t)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={14} /></button>
                </div></td>
              </motion.tr>
            ))}
          </tbody>
        </table></div></div>
      )}
      <Modal open={adding} onClose={() => setAdding(false)} title="Add Task"
        footer={<><button onClick={() => setAdding(false)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {err && <p className="col-span-full rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Title</span>
            <input className={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Category</span>
            <Dropdown value={form.categoryId} options={cats.map((c) => ({ value: c.id, label: c.name }))} onChange={(v) => setForm({ ...form, categoryId: v || "" })} placeholder="Category" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Assignee</span>
            <Dropdown value={form.assignee} options={emps.map((e) => ({ value: e.name, label: e.name }))} onChange={(v) => setForm({ ...form, assignee: v || "" })} placeholder="Assignee" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Priority</span>
            <Dropdown value={form.priority} options={["high", "medium", "low"]} onChange={(v) => setForm({ ...form, priority: v })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Due Date</span>
            <input type="date" className={input} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></label>
          <label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Note</span>
            <input className={input} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
        </div>
      </Modal>
    </div>
  );
}
