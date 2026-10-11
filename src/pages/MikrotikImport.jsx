import { useState, useEffect, useCallback } from "react";
import { Loader2, Download, FlaskConical, CheckSquare, Square, UserCheck } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";
import Dropdown from "../components/Dropdown";

export default function MikrotikImport() {
  const { notify, refreshClients } = useStore();
  const [servers, setServers] = useState([]);
  const [serverId, setServerId] = useState("");
  const [preview, setPreview] = useState(null); // { simulated, users:[{name,profile,disabled,duplicate}] }
  const [picked, setPicked] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      try { const s = await api.mtServers(); setServers(s); if (s[0]) setServerId(String(s[0].id)); }
      catch (e) { notify(e.message); }
    })();
  }, [notify]);

  const loadPreview = useCallback(async () => {
    if (!serverId) return;
    setLoading(true); setResult(null); setPreview(null);
    try {
      const p = await api.mtImportPreview(serverId);
      setPreview(p);
      setPicked(new Set(p.users.filter((u) => !u.duplicate).map((u) => u.name)));
    } catch (e) { notify(e.message); }
    finally { setLoading(false); }
  }, [serverId, notify]);

  const toggle = (name) => setPicked((s) => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n; });

  const doImport = async () => {
    setImporting(true); setResult(null);
    try {
      const res = await api.mtImport(serverId, [...picked]);
      setResult(res);
      if (!res.simulated) await refreshClients?.();
    } catch (e) { notify(e.message); }
    finally { setImporting(false); }
  };

  const server = servers.find((s) => String(s.id) === String(serverId));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Import From MikroTik</h2>
        <p className="text-sm text-slate-400">Router er PPPoE user gula customer hisebe import korun (duplicate auto skip)</p>
      </div>

      <div className="card flex flex-wrap items-end gap-3 p-4">
        <label className="block flex-1 min-w-[200px]"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Server</span>
          <Dropdown value={serverId} options={servers.length === 0 ? [{ value: "", label: "Kono server nei" }] : servers.map((s) => ({ value: String(s.id), label: `${s.name} (${s.mode})` }))} onChange={(v) => setServerId(v)} /></label>
        <button onClick={loadPreview} disabled={!serverId || loading} className="btn-gold">{loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Load from Router</button>
      </div>

      {server?.mode !== "real" && preview && (
        <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400"><FlaskConical size={13} className="mr-1 inline" /> Simulation mode — import korle kono real customer toiri hobe na (production DB safe). Real import korte server mode "real" korun.</p>
      )}

      {result && (
        <div className={`rounded-xl p-4 text-sm ${result.simulated ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`}>
          {result.simulated
            ? <p><b>Simulation result:</b> {result.wouldImport} jon import hoto, {result.duplicates} duplicate. <b>Kono data save hoyni.</b></p>
            : <p><b>Import complete:</b> {result.imported} jon customer toiri holo, {result.duplicates} duplicate skip holo.</p>}
        </div>
      )}

      {preview && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-white/5">
            <p className="text-sm text-slate-500">{picked.size} selected · {preview.users.filter((u) => u.duplicate).length} duplicate</p>
            <button onClick={doImport} disabled={importing || picked.size === 0} className="btn-gold">{importing ? <Loader2 size={15} className="animate-spin" /> : <UserCheck size={15} />} Import Selected</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr><th className="px-5 py-3 w-10"></th><th className="px-5 py-3 font-semibold">PPPoE</th><th className="px-5 py-3 font-semibold">Profile</th><th className="px-5 py-3 font-semibold">State</th><th className="px-5 py-3 font-semibold">Status</th></tr>
              </thead>
              <tbody>
                {preview.users.map((u) => (
                  <tr key={u.name} className="border-t border-slate-100 dark:border-white/5">
                    <td className="px-5 py-3">
                      <button disabled={u.duplicate} onClick={() => toggle(u.name)} className="text-slate-400 disabled:opacity-30">
                        {picked.has(u.name) ? <CheckSquare size={18} className="text-gold-500" /> : <Square size={18} />}
                      </button>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{u.name}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{u.profile || "—"}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{u.disabled ? "Disabled" : "Enabled"}</td>
                    <td className="px-5 py-3">{u.duplicate ? <span className="rounded-lg bg-slate-400/10 px-2 py-0.5 text-xs font-semibold text-slate-400">Already exists</span> : <span className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-500">New</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
