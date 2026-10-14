import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Server, Plus, Pencil, Trash2, Loader2, Circle, Cpu, Wrench, Table2, Wifi } from "lucide-react";
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

  // Stats derived from list
  const total = list.length;
  const activeCount = list.filter((d) => d.status === "online").length;
  const stats = [
    { label: "Total OLT", value: total },
    { label: "Mapped MikroTik", value: list.filter((d) => (d.model || "").toLowerCase().includes("mikrotik")).length || 0 },
    { label: "Active OLT", value: activeCount },
    { label: "Monitor Healthy", value: 0 },
    { label: "Monitor Stale", value: 0 },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-slate-800 dark:text-white">OLT List</h2>
        <div className="flex items-center gap-2">
          <Link to="/servers/mikrotik" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <Server size={14} /> Routers
          </Link>
          <Link to="/olt/tools" className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700">
            <Wrench size={14} /> OLT Tools
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{s.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-slate-800 dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">OLT</th>
                <th className="px-4 py-3">Host</th>
                <th className="px-4 py-3">Uptime</th>
                <th className="px-4 py-3">Last Sync</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center"><Loader2 className="mx-auto animate-spin text-gold-500" size={22} /></td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-slate-400">No OLT devices configured.</td></tr>
              ) : list.map((d) => (
                <tr key={d.id} className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50/60 dark:hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{d.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{d.ip || "—"}</td>
                  <td className="px-4 py-3 text-slate-400">—</td>
                  <td className="px-4 py-3 text-slate-400">—</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${d.status === "online" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-500"}`}>
                      <Circle size={7} className={d.status === "online" ? "fill-emerald-500 text-emerald-500" : "fill-rose-500 text-rose-500"} /> {d.status === "online" ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isAdmin && (
                      <span className="inline-flex gap-1">
                        <button onClick={() => openEdit(d)} className="rounded-lg p-1.5 text-slate-400 hover:bg-gold-500/10 hover:text-gold-500"><Pencil size={14} /></button>
                        <button onClick={() => setToDelete(d)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={14} /></button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAdmin && (
        <div className="flex justify-end">
          <button onClick={openNew} className="btn-gold"><Plus size={16} /> Add OLT</button>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit OLT" : "Add OLT"} subtitle={editing?.id ? editing.name : "Notun OLT device"}
        footer={<><button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Name</span>
            <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="OLT-Mirpur-A" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">IP / Host</span>
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
