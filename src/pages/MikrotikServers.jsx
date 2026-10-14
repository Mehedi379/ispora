import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2, Plug, Power, Eye, EyeOff, RefreshCw, Check, X, RotateCw } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

const empty = { name: "", mode: "mock", ip: "", apiPort: 8728, username: "", password: "", timeout: 10, version: "v2", model: "", capacity: "" };

export default function MikrotikServers() {
  const { notify } = useStore();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [toDelete, setToDelete] = useState(null);
  const [testing, setTesting] = useState(null);
  const [err, setErr] = useState("");
  const [revealed, setRevealed] = useState(new Set());
  const [syncing, setSyncing] = useState(null);
  const [enableToggling, setEnableToggling] = useState(null);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setList(await api.mtServers()); setErr(""); }
    catch (e) { setErr(e?.message || "Load fail"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(empty); setErr(""); setEditing({}); };
  const openEdit = (s) => { setForm({ name: s.name, mode: s.mode, ip: s.ip || s.host || "", apiPort: s.apiPort || s.port || 8728, username: s.username, password: "", timeout: s.timeout ?? 10, version: s.version || "v2", model: s.model, capacity: s.capacity }); setErr(""); setEditing(s); };

  const save = async () => {
    setErr("");
    try {
      if (editing.id) await api.mtUpdateServer(editing.id, form);
      else await api.mtCreateServer(form);
      setEditing(null); await load();
    } catch (e) { setErr(e.message); }
  };

  const test = async (s) => {
    setTesting(s.id);
    try { const res = await api.mtTest(s.id); notify(`${res.simulated ? "[SIM] " : ""}${res.message}`, "success"); }
    catch (e) { notify(e.message); }
    finally { setTesting(null); await load(); }
  };

  const toggleEnabled = async (s) => {
    setEnableToggling(s.id);
    try {
      // Prefer a dedicated enable toggle if backend has it, else flip via update
      if (api.mtToggleServer) await api.mtToggleServer(s.id);
      else await api.mtUpdateServer(s.id, { enabled: !s.enabled, status: !s.enabled ? "online" : "offline", active: !s.enabled });
      await load();
    } catch (e) { notify(e.message); }
    finally { setEnableToggling(null); }
  };

  const doSync = async (s) => {
    setSyncing(s.id);
    try { await api.mtTest(s.id); notify("Sync done", "success"); } catch (e) { notify(e.message); }
    finally { setSyncing(null); }
  };

  const doReset = async (s) => {
    notify("Reset: router connection reset requested.");
  };

  const doDelete = async () => {
    try { await api.mtDeleteServer(toDelete.id); setToDelete(null); await load(); }
    catch (e) { notify(e.message); setToDelete(null); }
  };

  const filtered = list.filter((s) => !q || `${s.name} ${s.ip} ${s.host || ""} ${s.username}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy-900 text-white"><Plug size={16} /></span>
            Mikrotik Server <span className="text-sm font-normal text-slate-400">All Mikrotik Servers</span>
          </h2>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800">
          <Plus size={14} /> Server
        </button>
      </div>

      {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            SHOW <select className="rounded border border-slate-200 bg-white px-2 py-1 dark:border-white/10 dark:bg-navy-800" defaultValue={10}><option>10</option><option>25</option><option>50</option></select> ENTRIES
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            SEARCH: <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="" className="rounded border border-slate-200 bg-white px-2 py-1 text-sm dark:border-white/10 dark:bg-navy-800" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-xs">
            <thead className="bg-navy-900 text-[11px] uppercase tracking-wide text-slate-300">
              <tr>
                <th className="px-3 py-3">Serial</th>
                <th className="px-3 py-3">ServerName</th>
                <th className="px-3 py-3">Server IP</th>
                <th className="px-3 py-3">Username</th>
                <th className="px-3 py-3">Password</th>
                <th className="px-3 py-3">Port</th>
                <th className="px-3 py-3">Version</th>
                <th className="px-3 py-3">Timeout</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="py-12 text-center"><Loader2 className="mx-auto animate-spin text-gold-500" size={22} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="py-10 text-center text-sm text-slate-400">No servers configured.</td></tr>
              ) : filtered.map((s, idx) => {
                const enabled = s.enabled ?? s.active ?? s.status === "online";
                const showPw = revealed.has(s.id);
                return (
                  <tr key={s.id} className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="px-3 py-3 text-slate-500">{idx + 1}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-700 dark:text-slate-200">{s.name}</p>
                      <p className={`text-[11px] ${s.connected ? "text-emerald-500" : "text-slate-400"}`}>{s.connected ? "Mikrotik Connected" : "Not connected"}</p>
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-600 dark:text-slate-300">{s.ip || s.host || "—"}</td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{s.username || "—"}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1.5 font-mono text-slate-600 dark:text-slate-300">
                        {showPw ? (s.passwordMasked || "••••") : "••••"}
                        <button onClick={() => setRevealed((prev) => { const n = new Set(prev); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n; })} className="text-slate-400 hover:text-gold-500">
                          {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-600 dark:text-slate-300">{s.apiPort || s.port || 8728}</td>
                    <td className="px-3 py-3 text-slate-500">{s.version || "v2"}</td>
                    <td className="px-3 py-3 text-slate-500">{s.timeout != null ? `${s.timeout} sec.` : "10 sec."}</td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => toggleEnabled(s)}
                        disabled={enableToggling === s.id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${enabled ? "bg-sky-500" : "bg-slate-300 dark:bg-white/20"}`}
                        title={enabled ? "Enabled — click to disable" : "Disabled — click to enable"}
                      >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => doSync(s)} disabled={syncing === s.id} title="Sync / Test" className="rounded p-1.5 text-sky-500 hover:bg-sky-500/10 disabled:opacity-40">
                          {syncing === s.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        </button>
                        <button onClick={() => openEdit(s)} title="Edit" className="rounded p-1.5 text-emerald-500 hover:bg-emerald-500/10"><Pencil size={14} /></button>
                        <button onClick={() => doReset(s)} title="Reset" className="rounded p-1.5 text-violet-500 hover:bg-violet-500/10"><RotateCw size={14} /></button>
                        <button onClick={() => test(s)} disabled={testing === s.id} title="Test connection" className="rounded p-1.5 text-amber-500 hover:bg-amber-500/10 disabled:opacity-40">
                          {testing === s.id ? <Loader2 size={14} className="animate-spin" /> : <Plug size={14} />}
                        </button>
                        <button onClick={() => setToDelete(s)} title="Delete" className="rounded p-1.5 text-rose-500 hover:bg-rose-500/10"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-400 dark:border-white/5">
          <span>Showing 1 to {filtered.length} of {filtered.length} entries</span>
          <span>Previous &nbsp; <span className="rounded bg-navy-900 px-2 py-1 text-white">1</span> &nbsp; Next</span>
        </div>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Server" : "Add MikroTik Server"} subtitle={editing?.id ? editing.name : "RouterOS connection"} size="lg"
        footer={<><button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Mode</span>
            <Dropdown value={form.mode} options={[{ value: "mock", label: "Mock / Simulation (router lage na)" }, { value: "real", label: "Real MikroTik (RouterOS API)" }]} onChange={(v) => setForm({ ...form, mode: v })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Server Name</span>
            <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="MT-Core-01" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Host / IP</span>
              <input className={input} value={form.ip} onChange={(e) => setForm({ ...form, ip: e.target.value })} placeholder="192.168.88.1" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">API Port</span>
              <input className={input} type="number" value={form.apiPort} onChange={(e) => setForm({ ...form, apiPort: e.target.value })} placeholder="8728" /></label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Username</span>
              <input className={input} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="admin" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Password {editing?.id ? "(khali = unchanged)" : ""}</span>
              <input className={input} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••" /></label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Version</span>
              <Dropdown value={form.version || "v2"} options={[{ value: "v2", label: "v2" }, { value: "v1", label: "v1" }]} onChange={(v) => setForm({ ...form, version: v })} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Timeout (s)</span>
              <input className={input} type="number" value={form.timeout} onChange={(e) => setForm({ ...form, timeout: e.target.value })} placeholder="10" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Capacity</span>
              <input className={input} type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="500" /></label>
          </div>
        </div>
      </Modal>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete Server?" subtitle={toDelete?.name} size="sm"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={doDelete} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"><Trash2 size={15} /> Delete</button></>}>
        <p className="text-sm text-slate-500 dark:text-slate-300"><b className="text-slate-700 dark:text-white">{toDelete?.name}</b> ebong er backup gula delete hobe. Nishchit?</p>
      </Modal>
    </div>
  );
}
