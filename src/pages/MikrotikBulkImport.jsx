import { useState, useEffect } from "react";
import { Loader2, Upload, FlaskConical } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";
import Dropdown from "../components/Dropdown";

const SAMPLE = "user2001,Rahim Uddin,01710000001,Home Plus\nuser2002,Karim Sheikh,01710000002,Pro\nuser2003,Jamal Hossain,01710000003,";

export default function MikrotikBulkImport() {
  const { notify, refreshClients } = useStore();
  const [servers, setServers] = useState([]);
  const [serverId, setServerId] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      try { const s = await api.mtServers(); setServers(s); if (s[0]) setServerId(String(s[0].id)); }
      catch (e) { notify(e.message); }
    })();
  }, [notify]);

  const submit = async () => {
    if (!serverId || !text.trim()) return;
    setBusy(true); setResult(null);
    try {
      const res = await api.mtBulkImport(serverId, text);
      setResult(res);
      if (!res.simulated) await refreshClients?.();
    } catch (e) { notify(e.message); }
    finally { setBusy(false); }
  };

  const server = servers.find((s) => String(s.id) === String(serverId));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Bulk Clients Import</h2>
        <p className="text-sm text-slate-400">Protyek line e: <code className="rounded bg-slate-100 px-1 dark:bg-white/10">pppoe, name, phone, package</code> — validation + duplicate detect soho</p>
      </div>

      <div className="card space-y-4 p-5">
        <label className="block max-w-xs"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Server</span>
          <Dropdown value={serverId} options={servers.length === 0 ? [{ value: "", label: "Kono server nei" }] : servers.map((s) => ({ value: String(s.id), label: `${s.name} (${s.mode})` }))} onChange={(v) => setServerId(v)} /></label>

        {server?.mode !== "real" && (
          <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400"><FlaskConical size={12} className="mr-1 inline" /> Simulation mode — validate + duplicate check hobe kintu kono data save hobe na (production DB safe).</p>
        )}

        <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Data (CSV lines)</span>
          <textarea className={`${input} font-mono`} rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder={SAMPLE} /></label>
        <div className="flex items-center gap-3">
          <button onClick={submit} disabled={busy || !serverId || !text.trim()} className="btn-gold">{busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Import</button>
          <button onClick={() => setText(SAMPLE)} className="btn-ghost">Sample bosaw</button>
        </div>
      </div>

      {result && (
        <div className={`rounded-xl p-4 text-sm ${result.simulated ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`}>
          <p className="font-semibold">{result.simulated ? "Simulation Result (kono data save hoyni)" : "Import Complete"}</p>
          <ul className="mt-1 space-y-0.5 text-xs">
            <li>Total lines: {result.total}</li>
            <li>{result.simulated ? `Would import: ${result.wouldImport}` : `Imported: ${result.imported}`}</li>
            <li>Duplicates skipped: {result.duplicates}</li>
            <li>Invalid lines: {result.invalid}</li>
          </ul>
          {result.errors?.length > 0 && <p className="mt-2 text-xs text-rose-500">{result.errors.join(" · ")}</p>}
        </div>
      )}
    </div>
  );
}
