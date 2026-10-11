import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Server, Plus, Pencil, Trash2, Loader2, Plug, Users, Power, FlaskConical, Wifi } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

const empty = { name: "", mode: "mock", ip: "", apiPort: 8728, username: "", password: "", timeout: 10, model: "", capacity: "" };

export default function MikrotikServers() {
  const { notify } = useStore();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [toDelete, setToDelete] = useState(null);
  const [testing, setTesting] = useState(null);
  const [testRes, setTestRes] = useState(null);
  const [err, setErr] = useState("");
  // PPPoE manage modal
  const [pppoe, setPppoe] = useState(null); // { server, users, simulated }
  const [pppoeLoading, setPppoeLoading] = useState(false);
  const [pppoeBusy, setPppoeBusy] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setList(await api.mtServers()); setErr(""); }
    catch (e) { setErr(e?.message || "Load fail"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(empty); setErr(""); setEditing({}); };
  const openEdit = (s) => { setForm({ name: s.name, mode: s.mode, ip: s.ip, apiPort: s.apiPort, username: s.username, password: "", timeout: s.timeout, model: s.model, capacity: s.capacity }); setErr(""); setEditing(s); };

  const save = async () => {
    setErr("");
    try {
      if (editing.id) await api.mtUpdateServer(editing.id, form);
      else await api.mtCreateServer(form);
      setEditing(null); await load();
    } catch (e) { setErr(e.message); }
  };

  const test = async (s) => {
    setTesting(s.id); setTestRes(null);
    try {
      const res = await api.mtTest(s.id);
      setTestRes({ id: s.id, ok: true, ...res });
      notify(`${res.simulated ? "[SIM] " : ""}${res.message}`, "success");
      await load();
    } catch (e) {
      setTestRes({ id: s.id, ok: false, error: e.message });
      notify(e.message);
      await load();
    } finally { setTesting(null); }
  };

  const openPppoe = async (s) => {
    setPppoe({ server: s, users: [], simulated: s.mode !== "real" }); setPppoeLoading(true);
    try { const r = await api.mtPppoe(s.id); setPppoe({ server: s, users: r.users, simulated: r.simulated }); }
    catch (e) { notify(e.message); setPppoe(null); }
    finally { setPppoeLoading(false); }
  };
  const togglePppoe = async (u) => {
    setPppoeBusy(u.name);
    try {
      const fn = u.disabled ? api.mtPppoeEnable : api.mtPppoeDisable;
      await fn(pppoe.server.id, u.name);
      setPppoe((p) => ({ ...p, users: p.users.map((x) => x.name === u.name ? { ...x, disabled: !u.disabled } : x) }));
    } catch (e) { notify(e.message); }
    finally { setPppoeBusy(null); }
  };

  const doDelete = async () => {
    try { await api.mtDeleteServer(toDelete.id); setToDelete(null); await load(); }
    catch (e) { notify(e.message); setToDelete(null); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">MikroTik Servers</h2>
          <p className="text-sm text-slate-400">RouterOS API — real router ba mock/simulation mode</p>
        </div>
        <button onClick={openNew} className="btn-gold"><Plus size={16} /> Add Server</button>
      </div>

      {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {list.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-navy-700 to-navy-900 text-gold-400"><Server size={20} /></div>
                  <div><p className="font-semibold text-slate-800 dark:text-white">{s.name}</p><p className="text-xs text-slate-400">{s.ip || "IP nei"}:{s.apiPort}</p></div>
                </div>
                {s.mode === "real"
                  ? <span className="rounded-lg bg-sky-500/10 px-2 py-0.5 text-xs font-semibold text-sky-500">REAL</span>
                  : <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-500"><FlaskConical size={11} /> SIM</span>}
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                <span className={`inline-flex items-center gap-1 ${s.connected ? "text-emerald-500" : "text-slate-400"}`}>
                  <Wifi size={12} /> {s.connected ? "Connected" : "Not connected"}
                </span>
                {s.version && <span>· {s.version}</span>}
              </div>
              {testRes?.id === s.id && (
                <p className={`mt-2 rounded-lg px-2.5 py-1.5 text-xs ${testRes.ok ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-500"}`}>
                  {testRes.ok ? `${testRes.simulated ? "[SIMULATED] " : ""}${testRes.message}` : testRes.error}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-100 dark:border-white/5 pt-4">
                <button onClick={() => test(s)} disabled={testing === s.id} className="inline-flex items-center gap-1 rounded-lg bg-gold-500/10 px-2.5 py-1.5 text-xs font-semibold text-gold-600 hover:bg-gold-500/20 disabled:opacity-50">
                  {testing === s.id ? <Loader2 size={13} className="animate-spin" /> : <Plug size={13} />} Test
                </button>
                <button onClick={() => openPppoe(s)} className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 px-2.5 py-1.5 text-xs font-semibold text-indigo-500 hover:bg-indigo-500/20"><Users size={13} /> PPPoE</button>
                <button onClick={() => openEdit(s)} className="rounded-lg p-2 text-slate-400 hover:bg-gold-500/10 hover:text-gold-500"><Pencil size={14} /></button>
                <button onClick={() => setToDelete(s)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={14} /></button>
              </div>
            </motion.div>
          ))}
          {list.length === 0 && <p className="col-span-full py-12 text-center text-sm text-slate-400">Kono MikroTik server nei. "Add Server" diye shuru korun (mock mode diye test korte paren).</p>}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Server" : "Add MikroTik Server"} subtitle={editing?.id ? editing.name : "RouterOS connection"}
        footer={<><button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Mode</span>
            <Dropdown value={form.mode} options={[{ value: "mock", label: "Mock / Simulation (router lage na)" }, { value: "real", label: "Real MikroTik (RouterOS API)" }]} onChange={(v) => setForm({ ...form, mode: v })} /></label>
          {form.mode === "mock" && <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400"><FlaskConical size={12} className="mr-1 inline" /> Simulation mode — kono real router-e connect hobe na, test data production DB-te dhukbe na.</p>}
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
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Timeout (s)</span>
              <input className={input} type="number" value={form.timeout} onChange={(e) => setForm({ ...form, timeout: e.target.value })} placeholder="10" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Capacity</span>
              <input className={input} type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="500" /></label>
          </div>
        </div>
      </Modal>

      <Modal open={!!pppoe} onClose={() => setPppoe(null)} title="PPPoE Users" subtitle={pppoe?.server?.name} size="lg">
        {pppoe?.simulated && <p className="mb-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400"><FlaskConical size={12} className="mr-1 inline" /> Simulated data — real router noy</p>}
        {pppoeLoading ? <div className="grid place-items-center py-10"><Loader2 className="animate-spin text-gold-500" /></div> : (
          <div className="space-y-2">
            {pppoe?.users?.map((u) => (
              <div key={u.name} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 dark:border-white/5">
                <div><p className="text-sm font-medium text-slate-700 dark:text-slate-200">{u.name}</p><p className="text-xs text-slate-400">{u.profile} {u.comment ? `· ${u.comment}` : ""}</p></div>
                <button onClick={() => togglePppoe(u)} disabled={pppoeBusy === u.name}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50 ${u.disabled ? "bg-slate-400/10 text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-600" : "bg-emerald-500/10 text-emerald-600 hover:bg-rose-500/10 hover:text-rose-500"}`}>
                  {pppoeBusy === u.name ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />} {u.disabled ? "Disabled" : "Enabled"}
                </button>
              </div>
            ))}
            {pppoe?.users?.length === 0 && <p className="py-6 text-center text-sm text-slate-400">Kono PPPoE user nei.</p>}
          </div>
        )}
      </Modal>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete Server?" subtitle={toDelete?.name} size="sm"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={doDelete} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"><Trash2 size={15} /> Delete</button></>}>
        <p className="text-sm text-slate-500 dark:text-slate-300"><b className="text-slate-700 dark:text-white">{toDelete?.name}</b> ebong er backup gula delete hobe. Nishchit?</p>
      </Modal>
    </div>
  );
}
