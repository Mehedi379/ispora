import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, LifeBuoy, Loader2, Trash2, ChevronRight } from "lucide-react";
import Dropdown from "../components/Dropdown";
import Modal from "../components/Modal";
import { useStore } from "../store";
import { api } from "../api";
import { clientLabel } from "../data";

import { input } from "../ui";

const cols = [
  { key: "open", label: "Open", dot: "bg-rose-500" },
  { key: "pending", label: "Pending", dot: "bg-amber-500" },
  { key: "closed", label: "Closed", dot: "bg-emerald-500" },
];

const prio = {
  high: "text-rose-500 bg-rose-500/10",
  medium: "text-amber-500 bg-amber-500/10",
  low: "text-sky-500 bg-sky-500/10",
};

// Next status cycle: open -> pending -> closed -> open
const nextStatus = { open: "pending", pending: "closed", closed: "open" };

export default function Tickets() {
  const { clients, notify, user } = useStore();
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState(null);
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("medium");
  const [categoryId, setCategoryId] = useState("");
  const [err, setErr] = useState("");
  const [loadErr, setLoadErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tk, cats] = await Promise.all([api.listTickets(), api.crudList("support", "categories").catch(() => [])]);
      setTickets(tk); setCategories(cats);
      setLoadErr("");
    } catch (e) {
      setLoadErr(e?.message || "Ticket load fail holo");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (clients.length && !clientId) setClientId(clients[0].id); }, [clients, clientId]);
  const selectedClient = clients.find((c) => c.id === clientId) || null;

  const create = async () => {
    setErr("");
    if (!subject) { setErr("Subject din"); return; }
    try {
      // id diye link — duplicate naam er client e bhul ticket jokhoni na thake
      await api.createTicket({ subject, priority, clientId: clientId || undefined, categoryId: categoryId || undefined });
      setOpen(false); setSubject(""); setPriority("medium"); setCategoryId("");
      await load();
    } catch (e) { setErr(e.message); }
  };

  const move = async (t) => {
    try { await api.updateTicket(t._id, { status: nextStatus[t.status] }); await load(); }
    catch (e) { notify(e?.message || "Ticket update fail"); }
  };

  const del = async (t) => {
    try { await api.deleteTicket(t._id); await load(); }
    catch (e) { notify(e?.message || "Ticket delete fail"); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Tickets</h2>
          <p className="text-sm text-slate-400">Customer support o complaint</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-gold"><Plus size={16} /> New Ticket</button>
      </div>

      {loadErr && (
        <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{loadErr}</p>
      )}

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {cols.map((col) => {
            const items = tickets.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 font-semibold text-slate-700 dark:text-white"><span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />{col.label}</span>
                  <span className="rounded-lg bg-slate-100 dark:bg-white/5 px-2 py-0.5 text-xs font-semibold text-slate-500">{items.length}</span>
                </div>
                <div className="space-y-3">
                  {items.map((t, i) => (
                    <motion.div key={t._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      className="group rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-navy-800 p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-gold-500">{t.id}</span>
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold capitalize ${prio[t.priority]}`}>{t.priority}</span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">{t.subject}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                        <LifeBuoy size={12} /> {t.client} · {t.time}
                        {t.category && <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-500">{t.category}</span>}
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2 opacity-0 transition group-hover:opacity-100">
                        <button onClick={() => move(t)} className="flex items-center gap-1 rounded-lg bg-gold-500/10 px-2 py-1 text-[11px] font-semibold text-gold-600 dark:text-gold-400 hover:bg-gold-500/20">
                          {col.key === "closed" ? "Reopen" : `Move to ${nextStatus[t.status]}`} <ChevronRight size={12} />
                        </button>
                        {/* Collector ticket delete korte parbe na (backend role gate) */}
                        {user?.role !== "collector" && (
                          <button onClick={() => del(t)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={13} /></button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {items.length === 0 && <p className="py-6 text-center text-xs text-slate-400">Nei</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New Ticket" subtitle="Customer complaint register korun"
        footer={<><button onClick={() => setOpen(false)} className="btn-ghost">Cancel</button><button onClick={create} className="btn-gold">Create Ticket</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Customer</span>
            <Dropdown value={selectedClient ? clientLabel(selectedClient) : "Client select korun"} options={clients.map(clientLabel)} onChange={(v) => setClientId(clients.find((c) => clientLabel(c) === v)?.id ?? null)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Subject</span>
            <input className={input} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Net slow at night" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Priority</span>
            <Dropdown value={priority} options={["high", "medium", "low"]} onChange={setPriority} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Category</span>
            <Dropdown value={categoryId} options={categories.map((c) => ({ value: c.id, label: c.name }))} onChange={(v) => setCategoryId(v || "")} placeholder="None" />
          </label>
        </div>
      </Modal>
    </div>
  );
}
