import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2, CalendarHeart, PartyPopper } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

const typeStyle = { holiday: "text-rose-500 bg-rose-500/10", event: "text-indigo-500 bg-indigo-500/10" };
const empty = { title: "", type: "holiday", fromDate: "", toDate: "", note: "" };

export default function EventsIndex() {
  const { user, notify } = useStore();
  const isAdmin = user?.role === "admin";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [toDelete, setToDelete] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await api.eventsList({ year })); setErr(""); } catch (e) { setErr(e?.message || "Load fail"); } finally { setLoading(false); }
  }, [year]);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(empty); setErr(""); setEditing({}); };
  const openEdit = (e) => { setForm({ title: e.title, type: e.type, fromDate: e.fromDate, toDate: e.toDate || "", note: e.note }); setErr(""); setEditing(e); };
  const save = async () => { setErr(""); try { if (editing.id) await api.eventsUpdate(editing.id, form); else await api.eventsCreate(form); setEditing(null); await load(); } catch (e) { setErr(e.message); } };
  const doDelete = async () => { try { await api.eventsDelete(toDelete.id); setToDelete(null); await load(); } catch (e) { notify(e.message); setToDelete(null); } };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Events & Holidays</h2><p className="text-sm text-slate-400">Bochorer holiday o event calendar</p></div>
        <div className="flex items-center gap-2">
          <input className={`${input} w-24`} type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          {isAdmin && <button onClick={openNew} className="btn-gold"><Plus size={16} /> Add</button>}
        </div>
      </div>
      {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : rows.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><CalendarHeart className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">{year} e kono event/holiday nei.</p></div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((e, i) => (
            <motion.div key={e.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }} className="card group p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {e.type === "event" ? <PartyPopper size={16} className="text-indigo-500" /> : <CalendarHeart size={16} className="text-rose-500" />}
                  <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold capitalize ${typeStyle[e.type]}`}>{e.type}</span>
                </div>
                {isAdmin && <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => openEdit(e)} className="rounded-lg p-1.5 text-slate-400 hover:bg-gold-500/10 hover:text-gold-500"><Pencil size={13} /></button>
                  <button onClick={() => setToDelete(e)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={13} /></button>
                </div>}
              </div>
              <p className="mt-2 font-semibold text-slate-800 dark:text-white">{e.title}</p>
              <p className="text-xs text-slate-400">{e.fromDate}{e.toDate ? ` → ${e.toDate}` : ""}</p>
              {e.note && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{e.note}</p>}
            </motion.div>
          ))}
        </div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit" : "Add Event/Holiday"}
        footer={<><button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Title</span>
            <input className={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Victory Day" /></label>
          <div className="grid grid-cols-3 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Type</span>
              <Dropdown value={form.type} options={["holiday", "event"]} onChange={(v) => setForm({ ...form, type: v })} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">From</span>
              <input type="date" className={input} value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">To (opt)</span>
              <input type="date" className={input} value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} /></label>
          </div>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Note</span>
            <input className={input} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
        </div>
      </Modal>
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete?" subtitle={toDelete?.title} size="sm"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={doDelete} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"><Trash2 size={15} /> Delete</button></>}>
        <p className="text-sm text-slate-500 dark:text-slate-300"><b className="text-slate-700 dark:text-white">{toDelete?.title}</b> delete korbo?</p>
      </Modal>
    </div>
  );
}
