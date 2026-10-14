import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Loader2, Search, Filter, List, Wrench } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";
import Dropdown from "../components/Dropdown";

export default function OltMacTable() {
  const { notify } = useStore();
  const [olts, setOlts] = useState([]);
  const [oltFilter, setOltFilter] = useState("");
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");
  const [limit, setLimit] = useState("200");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState({ visible: 0, matched: 0, oltInResult: 0, lastOptical: null });

  const loadOlts = useCallback(async () => {
    try { setOlts(await api.oltDevices()); } catch {}
  }, []);
  useEffect(() => { loadOlts(); }, [loadOlts]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const all = await api.oltUsers(oltFilter || undefined);
      const list = Array.isArray(all) ? all : (all.rows ?? all.users ?? []);
      // Search filter (client-side until a server MAC search exists)
      const f = (q || "").toLowerCase().trim();
      let filtered = f
        ? list.filter((u) => `${u.name} ${u.onu} ${u.ponPort} ${u.signal} ${u.olt} ${u.clientId ?? ""}`.toLowerCase().includes(f))
        : list;
      // Counters
      const matched = filtered.filter((u) => u.clientId).length;
      setMeta({
        visible: filtered.length,
        matched,
        oltInResult: new Set(filtered.map((u) => u.oltId ?? u.olt)).size,
        lastOptical: null,
      });
      const n = Math.max(1, Number(limit) || 200);
      setRows(filtered.slice(0, n).map((u) => ({
        olt: u.olt || "—",
        iface: u.ponPort || "—",
        optical: u.signal || "—",
        clientMac: u.onu || "—",
        pppoe: u.name || "—",
        onuMac: u.onu || "—",
        vendor: "—",
        updated: "—",
        raw: u,
      })));
    } catch (e) {
      notify(e.message || "Load fail");
    } finally { setLoading(false); }
  }, [oltFilter, q, limit, notify]);

  // Initial fetch
  useEffect(() => { fetchRows(); }, [fetchRows]);

  const tiles = [
    { label: "Visible Rows", value: String(meta.visible) },
    { label: "Matched Rows", value: String(meta.matched) },
    { label: "OLT In Result", value: String(meta.oltInResult) },
    { label: "Last Optical", value: meta.lastOptical || "—" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-slate-800 dark:text-white">OLT MAC Table</h2>
        <div className="flex items-center gap-2">
          <Link to="/olt" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <List size={14} /> OLT List
          </Link>
          <Link to="/olt/tools" className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700">
            <Wrench size={14} /> OLT Tools
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{t.label}</p>
            <p className="mt-1 font-display text-xl font-bold text-slate-800 dark:text-white">{t.value}</p>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <label className="block sm:col-span-3">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">OLT</span>
            <Dropdown
              value={oltFilter}
              options={[{ value: "", label: "All OLT" }, ...olts.map((d) => ({ value: String(d.id), label: d.name }))]}
              onChange={setOltFilter}
            />
          </label>
          <label className="block sm:col-span-5">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Search</span>
            <input className={input} value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="MAC, interface, PPPoE, client, ONU" />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Show</span>
            <Dropdown value={limit} options={["50", "100", "200", "500"].map((v) => ({ value: v, label: `${v} rows` }))} onChange={setLimit} />
          </label>
          <div className="flex items-end gap-2 sm:col-span-2">
            <button onClick={() => setQ(qInput)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">
              <Filter size={14} /> Filter
            </button>
            <button onClick={() => { setQInput(""); setQ(""); setOltFilter(""); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-3">OLT</th>
                <th className="px-3 py-3">Interface</th>
                <th className="px-3 py-3">Optical</th>
                <th className="px-3 py-3">Client MAC</th>
                <th className="px-3 py-3">PPPoE / Client</th>
                <th className="px-3 py-3">ONU MAC</th>
                <th className="px-3 py-3">Vendor</th>
                <th className="px-3 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center"><Loader2 className="mx-auto animate-spin text-gold-500" size={22} /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center text-sm text-slate-400">No matched rows (need fresh optical + learned MAC + PPPoE mapping).</td></tr>
              ) : rows.map((r, i) => (
                <tr key={i} className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50/60 dark:hover:bg-white/[0.03]">
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{r.olt}</td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-500">{r.iface}</td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-500">{r.optical}</td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-500">{r.clientMac}</td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{r.pppoe}</td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-500">{r.onuMac}</td>
                  <td className="px-3 py-3 text-slate-500">{r.vendor}</td>
                  <td className="px-3 py-3 text-xs text-slate-400">{r.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
