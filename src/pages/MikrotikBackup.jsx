import { useState, useEffect, useCallback } from "react";
import { Loader2, DatabaseBackup, Download, Trash2, FlaskConical, HardDrive } from "lucide-react";
import { useStore } from "../store";
import { api, getToken } from "../api";
import { input } from "../ui";
import Dropdown from "../components/Dropdown";

export default function MikrotikBackup() {
  const { notify } = useStore();
  const [servers, setServers] = useState([]);
  const [serverId, setServerId] = useState("");
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    (async () => {
      try { const s = await api.mtServers(); setServers(s); if (s[0]) setServerId(String(s[0].id)); }
      catch (e) { notify(e.message); }
    })();
  }, [notify]);

  const load = useCallback(async () => {
    if (!serverId) return;
    setLoading(true);
    try { setBackups(await api.mtBackups(serverId)); }
    catch (e) { notify(e.message); }
    finally { setLoading(false); }
  }, [serverId, notify]);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setCreating(true);
    try { await api.mtCreateBackup(serverId, name); setName(""); await load(); notify("Backup toiri holo", "success"); }
    catch (e) { notify(e.message); }
    finally { setCreating(false); }
  };

  const download = (b) => {
    if (b.type !== "simulated") { notify("Real router backup Winbox/FTP diye nin"); return; }
    // token-protected download — fetch kore blob banai
    fetch(api.mtBackupDownloadUrl(serverId, b.id), { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.ok ? r.blob() : Promise.reject(new Error("Download fail")))
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `${b.name}.rsc`; a.click();
        URL.revokeObjectURL(url);
      }).catch((e) => notify(e.message));
  };

  const remove = async (b) => {
    try { await api.mtDeleteBackup(serverId, b.id); await load(); }
    catch (e) { notify(e.message); }
  };

  const server = servers.find((s) => String(s.id) === String(serverId));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Server Backup</h2>
        <p className="text-sm text-slate-400">RouterOS backup toiri o manage korun (real/simulated alada label)</p>
      </div>

      <div className="card flex flex-wrap items-end gap-3 p-4">
        <label className="block flex-1 min-w-[180px]"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Server</span>
          <Dropdown value={serverId} options={servers.length === 0 ? [{ value: "", label: "Kono server nei" }] : servers.map((s) => ({ value: String(s.id), label: `${s.name} (${s.mode})` }))} onChange={(v) => setServerId(v)} /></label>
        <label className="block flex-1 min-w-[180px]"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Backup name (optional)</span>
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="auto name" /></label>
        <button onClick={create} disabled={!serverId || creating} className="btn-gold">{creating ? <Loader2 size={16} className="animate-spin" /> : <DatabaseBackup size={16} />} Create Backup</button>
      </div>

      {server?.mode !== "real" && (
        <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400"><FlaskConical size={13} className="mr-1 inline" /> Simulation mode — backup gula generated/simulated, real router backup noy.</p>
      )}

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>
      ) : backups.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><HardDrive className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono backup nei.</p></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr><th className="px-5 py-3 font-semibold">Name</th><th className="px-5 py-3 font-semibold">Type</th><th className="px-5 py-3 font-semibold">Size</th><th className="px-5 py-3 font-semibold">Created</th><th className="px-5 py-3 text-right font-semibold">Action</th></tr>
            </thead>
            <tbody>
              {backups.map((b) => (
                <tr key={b.id} className="border-t border-slate-100 dark:border-white/5">
                  <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{b.name}</td>
                  <td className="px-5 py-3">{b.type === "real" ? <span className="rounded-lg bg-sky-500/10 px-2 py-0.5 text-xs font-semibold text-sky-500">REAL</span> : <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-500"><FlaskConical size={11} /> SIMULATED</span>}</td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{b.size} B</td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{new Date(b.createdAt).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => download(b)} className="rounded-lg p-2 text-slate-400 hover:bg-gold-500/10 hover:text-gold-500" title="Download"><Download size={15} /></button>
                      <button onClick={() => remove(b)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500" title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
