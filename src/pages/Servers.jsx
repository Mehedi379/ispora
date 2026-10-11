import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Server, Plus, Cpu, Circle, Terminal, Pencil, Trash2, Loader2 } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";

import { input } from "../ui";

// Sample event stream — real log live MikroTik/OLT integration er por ashbe
const logs = [
  { t: "10:42:18", lvl: "info", msg: "ONU 23 registered on OLT-Mirpur-A PON-3" },
  { t: "10:40:02", lvl: "warn", msg: "High signal loss on OLT-Gulshan PON-12 (-28dBm)" },
  { t: "10:38:55", lvl: "info", msg: "PPPoE user1042 connected via MT-Core-01" },
  { t: "10:35:11", lvl: "error", msg: "OLT-Uttara link down — fiber cut suspected" },
  { t: "10:30:47", lvl: "info", msg: "Auto-disconnect: 6 expired users suspended" },
];
const lvlColor = { info: "text-sky-400", warn: "text-amber-400", error: "text-rose-400" };

export default function Servers({ type = "mikrotik" }) {
  const { user } = useStore();
  const isAdmin = user?.role === "admin";
  const isOlt = type === "olt";
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [form, setForm] = useState({ name: "", ip: "", model: "", capacity: "", status: "online" });
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    if (type === "logs") { setLoading(false); return; }
    setLoading(true);
    try { setList(await api.listDevices(type)); setErr(""); }
    catch (e) { setErr(e?.message || "Device list load fail holo"); }
    finally { setLoading(false); }
  }, [type]);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({ name: "", ip: "", model: "", capacity: "", status: "online" }); setErr(""); setEditing({}); };
  const openEdit = (s) => { setForm({ name: s.name, ip: s.ip, model: s.model, capacity: s.capacity, status: s.status }); setErr(""); setEditing(s); };

  const save = async () => {
    setErr("");
    try {
      if (editing.id) await api.updateDevice(editing.id, form);
      else await api.createDevice({ ...form, type });
      setEditing(null);
      await load();
    } catch (e) { setErr(e.message); }
  };

  const doDelete = async () => {
    try { await api.deleteDevice(toDelete.id); setToDelete(null); await load(); }
    catch (e) { setErr(e.message); setToDelete(null); }
  };

  if (type === "logs") {
    return (
      <div className="space-y-5">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">OLT Logs</h2><p className="text-sm text-slate-400">Device events · sample stream (live integration pending)</p></div>
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 px-5 py-3 text-slate-500"><Terminal size={16} /> <span className="text-sm font-medium">Live Log Stream</span></div>
          <div className="space-y-1 bg-navy-950 p-4 font-mono text-xs">
            {logs.map((l, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex gap-3">
                <span className="text-slate-500">{l.t}</span>
                <span className={`font-bold uppercase ${lvlColor[l.lvl]}`}>[{l.lvl}]</span>
                <span className="text-slate-300">{l.msg}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const title = isOlt ? "OLT Servers" : "MikroTik Servers";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">{title}</h2><p className="text-sm text-slate-400">Network device manage korun</p></div>
        {isAdmin && <button onClick={openNew} className="btn-gold"><Plus size={16} /> Add Server</button>}
      </div>

      {err && !editing && !toDelete && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {list.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="card group p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-navy-700 to-navy-900 text-gold-400"><Server size={20} /></div>
                  <div><p className="font-semibold text-slate-800 dark:text-white">{s.name}</p><p className="text-xs text-slate-400">{s.ip || "IP set nei"}</p></div>
                </div>
                <span className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${s.status === "online" ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"}`}>
                  <Circle size={8} className="fill-current" /> {s.status}
                </span>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400"><Cpu size={13} /> {s.model || "Model set nei"}</p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4 text-sm">
                <div><p className="text-xs text-slate-400">{isOlt ? "ONU Capacity" : "PPPoE Capacity"}</p><p className="font-bold text-slate-700 dark:text-slate-200">{s.capacity || "—"}</p></div>
                {isAdmin && (
                  <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <button onClick={() => openEdit(s)} className="rounded-lg p-2 text-slate-400 hover:bg-gold-500/10 hover:text-gold-500"><Pencil size={14} /></button>
                    <button onClick={() => setToDelete(s)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {list.length === 0 && <p className="col-span-full py-12 text-center text-sm text-slate-400">Kono {isOlt ? "OLT" : "MikroTik"} device nei. {isAdmin ? "Add Server diye shuru korun." : ""}</p>}
        </div>
      )}

      <p className="text-center text-xs text-slate-400">* CPU load o live user count real-time MikroTik/OLT integration er por dekhabe. Ekhon device registry manage korun.</p>

      <Modal open={!!editing} onClose={() => setEditing(null)}
        title={editing?.id ? "Edit Device" : "Add Device"} subtitle={editing?.id ? editing.name : (isOlt ? "Notun OLT" : "Notun MikroTik")}
        footer={<><button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Name</span>
            <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={isOlt ? "OLT-Mirpur-A" : "MT-Core-01"} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">IP Address</span>
              <input className={input} value={form.ip} onChange={(e) => setForm({ ...form, ip: e.target.value })} placeholder="103.108.x.x" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Model</span>
              <input className={input} value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder={isOlt ? "VSOL 8-PON" : "CCR2004"} /></label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">{isOlt ? "ONU Capacity" : "User Capacity"}</span>
              <input className={input} type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="500" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Status</span>
              <Dropdown value={form.status} options={["online", "offline"]} onChange={(v) => setForm({ ...form, status: v })} /></label>
          </div>
        </div>
      </Modal>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete Device?" subtitle={toDelete?.name} size="sm"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={doDelete} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600"><Trash2 size={15} /> Delete</button></>}>
        <p className="text-sm text-slate-500 dark:text-slate-300"><b className="text-slate-700 dark:text-white">{toDelete?.name}</b> device delete korbo?</p>
      </Modal>
    </div>
  );
}
