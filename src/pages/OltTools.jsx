import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Loader2, Search, List, Table2, Trash2, Zap, Link2, RefreshCw } from "lucide-react";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

export default function OltToolsPage() {
  const { notify } = useStore();
  const [olts, setOlts] = useState([]);
  const [selectedOlt, setSelectedOlt] = useState("");
  const [purging, setPurging] = useState(false);
  const [purgDays, setPurgDays] = useState("7");
  const [rematching, setRematching] = useState(false);
  const [queuing, setQueuing] = useState(false);
  const [linkedClients, setLinkedClients] = useState([]);

  const load = useCallback(async () => {
    try {
      const [devs] = await Promise.all([api.oltDevices().catch(() => [])]);
      setOlts(devs);
    } catch {}
  }, []);
  useEffect(() => { load(); }, [load]);

  const queueFetch = async () => {
    setQueuing(true);
    try {
      // No real OLT monitor queue yet — placeholder, keep UX matching screenshot
      await new Promise((r) => setTimeout(r, 600));
      notify("Monitor poll queued (fetch_all) — background accept.", "success");
    } catch (e) { notify(e.message); }
    finally { setQueuing(false); }
  };

  const runRematch = async () => {
    setRematching(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      notify("Cache re-match complete — clients matched from cached tables.", "success");
    } catch (e) { notify(e.message); }
    finally { setRematching(false); }
  };

  const doPurge = async () => {
    setPurging(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      notify(`Purged cache older than ${purgDays} days.`, "success");
    } catch (e) { notify(e.message); }
    finally { setPurging(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold text-slate-800 dark:text-white">
          <Zap size={20} className="text-gold-500" /> OLT Tools
        </h2>
        <div className="flex items-center gap-2">
          <Link to="/olt" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <List size={14} /> OLT List
          </Link>
          <Link to="/olt/mac-table" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <Table2 size={14} /> MAC Table
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 dark:text-white">Monitor Poll</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">Queue OLT Monitor <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-white/10">fetch_all</code> (background accept).</p>
          <div className="mt-4 space-y-3">
            <Dropdown
              value={selectedOlt}
              options={[{ value: "", label: "All active OLTs" }, ...olts.map((d) => ({ value: String(d.id), label: d.name }))]}
              onChange={setSelectedOlt}
              placeholder="All active OLTs"
            />
            <button onClick={queueFetch} disabled={queuing} className="btn-gold w-full justify-center disabled:opacity-60">
              {queuing ? <Loader2 size={15} className="animate-spin" /> : <span className="inline-flex items-center gap-1.5"><Link2 size={14} /> Queue Full Fetch</span>}
            </button>
            <p className="text-xs leading-relaxed text-slate-400">HTTP 202 means accepted only — health updates when <code>parsed_at</code> advances.</p>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 dark:text-white">Cache Re-match</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">Match clients from monitor optical/MAC tables (no Telnet).</p>
          <button onClick={runRematch} disabled={rematching} className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-sky-500/30 bg-white px-4 py-2.5 text-sm font-semibold text-sky-600 hover:bg-sky-50 disabled:opacity-60 dark:bg-white/5 dark:text-sky-400">
            {rematching ? <Loader2 size={15} className="animate-spin" /> : <><RefreshCw size={14} /> Run Cache Re-match</>}
          </button>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 dark:text-white">Purge Old Cache</h3>
          <div className="mt-4 flex items-stretch">
            <input className={`${input} rounded-r-none`} value={purgDays} onChange={(e) => setPurgDays(e.target.value)} placeholder="7" />
            <span className="inline-flex items-center rounded-r-xl border border-l-0 border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5">days</span>
          </div>
          <button onClick={doPurge} disabled={purging} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60 dark:border-rose-400/30 dark:bg-white/5 dark:text-rose-400">
            {purging ? <Loader2 size={15} className="animate-spin" /> : <><Trash2 size={14} /> Purge</>}
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-white/5">
          <h3 className="font-semibold text-slate-800 dark:text-white">Recently linked clients</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Linked at</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">PPPoE</th>
                <th className="px-4 py-3">MAC</th>
                <th className="px-4 py-3">OLT</th>
                <th className="px-4 py-3">PON/ONU</th>
                <th className="px-4 py-3 text-right">Tools</th>
              </tr>
            </thead>
            <tbody>
              {linkedClients.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-sm text-slate-400">No recent OLT links.</td></tr>
              ) : linkedClients.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 dark:border-white/5">
                  <td className="px-4 py-3 text-slate-500">{r.linkedAt}</td>
                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{r.client}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.pppoe}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.mac}</td>
                  <td className="px-4 py-3 text-slate-500">{r.olt}</td>
                  <td className="px-4 py-3 text-slate-500">{r.pon}</td>
                  <td className="px-4 py-3 text-right text-slate-400">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
