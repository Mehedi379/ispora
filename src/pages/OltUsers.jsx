import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2, Search, Radio } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";
import { clientLabel } from "../data";

const empty = { name: "", oltId: "", onu: "", ponPort: "", signal: "", status: "online", clientId: "" };

export default function OltUsers() {
  const { user, notify, clients } = useStore();
  const isAdmin = user?.role === "admin";
  const [rows, setRows] = useState([]);
  const [olts, setOlts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filterOlt, setFilterOlt] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [toDelete, setToDelete] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, d] = await Promise.all([api.oltUsers(filterOlt || undefined), api.oltDevices()]);
      setRows(u); setOlts(d); setErr("");
    } catch (e) { setErr(e?.message || "Load fail"); }
    finally { setLoading(false); }
  }, [filterOlt]);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({ ...empty, oltId: olts[0]?.id || "" }); setErr(""); setEditing({}); };
  const openEdit = (u) => { setForm({ name: u.name, oltId: u.oltId, onu: u.onu, ponPort: u.ponPort, signal: u.signal, status: u.status, clientId: u.clientId || "" }); setErr(""); setEditing(u); };
  const save = async () => {
    setErr("");
    try { if (editing.id) await api.oltUpdateUser(editing.id, form); else await api.oltCreateUser(form); setEditing(null); await load(); }
    catch (e) { setErr(e.message); }
  };
  const doDelete = async () => { try { await api.oltDeleteUser(toDelete.id); setToDelete(null); await load(); } catch (e) { notify(e.message); setToDelete(null); } };

  const filtered = rows.filter((r) => !q || `${r.name} ${r.onu} ${r.ponPort} ${r.olt}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">OLT Users</h2><p className="text-sm text-slate-400">ONU / subscriber — kon OLT, kon PON port</p></div>
        {isAdmin && <button onClick={openNew} className="btn-gold"><Plus size={16} /> Add OLT User</button>}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative min-w-[200px] flex-1 max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className={`${input} pl-9`} placeholder="Search ONU/name..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Dropdown className="w-48" value={filterOlt} options={olts.map((o) => ({ value: o.id, label: o.name }))} onChange={(v) => setFilterOlt(v || "")} placeholder="All OLT" />
      </div>
      {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : filtered.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><Radio className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono OLT user nei.</p></div>
      ) : (
        <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
            <th className="px-5 py-3 font-semibold">Name</th><th className="px-5 py-3 font-semibold">OLT</th>
            <th className="px-5 py-3 font-semibold">ONU</th><th className="px-5 py-3 font-semibold">PON</th>
            <th className="px-5 py-3 font-semibold">Signal</th><th className="px-5 py-3 font-semibold">Status</th>
            {isAdmin && <th className="px-5 py-3 text-right font-semibold">Action</th>}</tr></thead>
          <tbody>
            {filtered.map((u, i) => (
              <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="border-t border-slate-100 dark:border-white/5">
                <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{u.name}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{u.olt}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{u.onu || "—"}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{u.ponPort || "—"}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{u.signal || "—"}</td>
                <td className="px-5 py-3"><span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${u.status === "online" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>{u.status}</span></td>
                {isAdmin && <td className="px-5 py-3"><div className="flex justify-end gap-1">
                  <button onClick={() => openEdit(u)} className="rounded-lg p-2 text-slate-400 hover:bg-gold-500/10 hover:text-gold-500"><Pencil size={15} /></button>
                  <button onClick={() => setToDelete(u)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={15} /></button>
                </div></td>}
              </motion.tr>
            ))}
          </tbody>
        </table></div></div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit OLT User" : "Add OLT User"} subtitle={editing?.id ? editing.name : "Notun ONU/subscriber"}
        footer={<><button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {err && <p className="col-span-full rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Name</span>
            <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">OLT</span>
            <Dropdown value={form.oltId} options={olts.map((o) => ({ value: o.id, label: o.name }))} onChange={(v) => setForm({ ...form, oltId: v || "" })} placeholder="OLT" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">ONU serial/id</span>
            <input className={input} value={form.onu} onChange={(e) => setForm({ ...form, onu: e.target.value })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">PON Port</span>
            <input className={input} value={form.ponPort} onChange={(e) => setForm({ ...form, ponPort: e.target.value })} placeholder="PON-3" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Signal (dBm)</span>
            <input className={input} value={form.signal} onChange={(e) => setForm({ ...form, signal: e.target.value })} placeholder="-22" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Status</span>
            <Dropdown value={form.status} options={["online", "offline"]} onChange={(v) => setForm({ ...form, status: v })} /></label>
          <label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Linked Client (optional)</span>
            <Dropdown value={form.clientId} options={clients.map((c) => ({ value: c.id, label: clientLabel(c) }))} onChange={(v) => setForm({ ...form, clientId: v || "" })} placeholder="Client" /></label>
        </div>
      </Modal>
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete OLT User?" subtitle={toDelete?.name} size="sm"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={doDelete} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"><Trash2 size={15} /> Delete</button></>}>
        <p className="text-sm text-slate-500 dark:text-slate-300"><b className="text-slate-700 dark:text-white">{toDelete?.name}</b> delete korbo?</p>
      </Modal>
    </div>
  );
}
