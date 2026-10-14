import { useState, useEffect, useCallback } from "react";
import { Loader2, Download, FlaskConical, CheckSquare, Square, MinusSquare, UserCheck, Eye, EyeOff, Search, FileSpreadsheet, Users, X, UserPlus } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";
import Dropdown from "../components/Dropdown";
import { input } from "../ui";

export default function MikrotikImport() {
  const { notify, refreshClients } = useStore();
  const [servers, setServers] = useState([]);
  const [serverId, setServerId] = useState("");
  const [preview, setPreview] = useState(null);
  const [picked, setPicked] = useState(new Set());
  const [revealed, setRevealed] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");
  const [fProtocol, setFProtocol] = useState("PPPOE");
  const [fProfile, setFProfile] = useState("");
  const [fUserType, setFUserType] = useState("Unique");

  useEffect(() => {
    (async () => {
      try { const s = await api.mtServers(); setServers(s); if (s[0]) setServerId(String(s[0].id)); }
      catch (e) { notify(e.message); }
    })();
  }, [notify]);

  const loadPreview = useCallback(async () => {
    if (!serverId) return;
    setLoading(true); setResult(null); setPreview(null);
    setRevealed(new Set()); setQ(""); setQInput(""); setFProfile(""); setFUserType("Unique");
    try {
      const p = await api.mtImportPreview(serverId);
      setPreview(p);
      setPicked(new Set(p.users.filter((u) => !u.duplicate).map((u) => u.name)));
    } catch (e) { notify(e.message); }
    finally { setLoading(false); }
  }, [serverId, notify]);

  const toggle = (name) => setPicked((s) => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n; });
  const toggleReveal = (name) => setRevealed((s) => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n; });

  const doImport = async (specific) => {
    const names = specific ? [specific] : [...picked];
    if (names.length === 0) return notify("Select korun");
    setImporting(true); setResult(null);
    try {
      const res = await api.mtImport(serverId, names);
      setResult(res);
      if (!res.simulated) await refreshClients?.();
      if (specific) setPicked((prev) => { const n = new Set(prev); n.delete(specific); return n; });
    } catch (e) { notify(e.message); }
    finally { setImporting(false); }
  };

  const server = servers.find((s) => String(s.id) === String(serverId));
  const profiles = preview ? [...new Set(preview.users.map((u) => u.profile).filter(Boolean))] : [];
  const searchQ = q.trim().toLowerCase();
  const filtered = preview ? preview.users.filter((u) => {
    if (fProtocol && fProtocol !== "PPPOE" && (u.service || "").toUpperCase() !== fProtocol.toUpperCase()) return false;
    if (fProfile && u.profile !== fProfile) return false;
    if (fUserType === "Unique" && u.duplicate) return false;
    if (fUserType === "Duplicate" && !u.duplicate) return false;
    if (searchQ && !`${u.name} ${u.profile} ${u.callerId} ${u.comment} ${u.service}`.toLowerCase().includes(searchQ)) return false;
    return true;
  }) : [];
  const dupCount = preview ? preview.users.filter((u) => u.duplicate).length : 0;
  const clearFilter = () => { setFProtocol("PPPOE"); setFProfile(""); setFUserType("Unique"); setQ(""); setQInput(""); };
  const applyFilter = () => setQ(qInput);

  const selectable = filtered.filter((u) => !u.duplicate).map((u) => u.name);
  const allChecked = selectable.length > 0 && selectable.every((n) => picked.has(n));
  const someChecked = selectable.some((n) => picked.has(n));
  const toggleAll = () => setPicked((s) => {
    const n = new Set(s);
    if (allChecked) selectable.forEach((x) => n.delete(x));
    else selectable.forEach((x) => n.add(x));
    return n;
  });

  const csvEscape = (v) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const buildCSV = (rows) => {
    const head = ["Name", "Password", "Service", "Profile", "Caller ID", "Server Name", "Logout Time", "User Status", "Branch"];
    const body = rows.map((u) => [
      u.name, u.password, u.service || "pppoe", u.profile, u.callerId || "N/A",
      server?.name || "", u.lastLoggedOut || "—", u.duplicate ? "Exists" : "Unique", "N/A",
    ].map(csvEscape).join(","));
    return [head.join(","), ...body].join("\r\n");
  };
  const download = (name, text) => {
    const blob = new Blob(["﻿" + text], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };
  const genExcel = () => { if (!filtered.length) return notify("Export korar moto kono row nei"); download(`mikrotik-${server?.name || "export"}.csv`, buildCSV(filtered)); };
  const exportSelectedMac = () => {
    const rows = filtered.filter((u) => picked.has(u.name));
    if (!rows.length) return notify("Age user select koro — tarpor MACReseller export");
    download(`macreseller-${server?.name || "export"}.csv`, buildCSV(rows));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy-900 text-white text-xs">▦</span>
          Mikrotik Clients <span className="text-sm font-normal text-slate-400">Export Mikrotik Clients</span>
        </h2>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block min-w-[160px] flex-1"><span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Server</span>
            <Dropdown value={serverId} options={servers.length === 0 ? [{ value: "", label: "Kono server nei" }] : servers.map((s) => ({ value: String(s.id), label: s.name }))} onChange={(v) => setServerId(v)} /></label>
          <button onClick={loadPreview} disabled={!serverId || loading} className="inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Load
          </button>
        </div>
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
        <div className="space-y-4">
          {/* Top action pills — like screenshot */}
          <div className="flex flex-wrap justify-end gap-2">
            <button onClick={genExcel} className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-800">
              <FileSpreadsheet size={13} /> Generate Excel
            </button>
            <button onClick={() => doImport()} disabled={importing || picked.size === 0} className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-50">
              {importing ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />} Export To Client List
            </button>
            <button onClick={exportSelectedMac} disabled={picked.size === 0} className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-50">
              <Users size={13} /> Export To MACReseller
            </button>
          </div>

          {/* Filter bar — like screenshot */}
          <div className="card p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Servers</span>
                <Dropdown value={serverId} options={servers.map((s) => ({ value: String(s.id), label: s.name }))} onChange={setServerId} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Protocol</span>
                <Dropdown value={fProtocol} options={[{ value: "PPPOE", label: "PPPOE" }, { value: "HOTSPOT", label: "HOTSPOT" }, { value: "STATIC", label: "STATIC" }]} onChange={setFProtocol} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Profile</span>
                <Dropdown value={fProfile} options={[{ value: "", label: "Select" }, ...profiles.map((p) => ({ value: p, label: p }))]} onChange={setFProfile} placeholder="Select" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">User Type</span>
                <Dropdown value={fUserType} options={[{ value: "Unique", label: "Unique" }, { value: "Duplicate", label: "Duplicate" }, { value: "", label: "All" }]} onChange={setFUserType} />
              </label>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={clearFilter} className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-600">
                <X size={13} /> Clear Filter
              </button>
              <button onClick={applyFilter} className="inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-600">
                <Search size={13} /> Apply Filter
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-white/5">
              <span className="text-xs text-slate-400">SHOW <select className="rounded border border-slate-200 bg-white px-2 py-1 dark:border-white/10 dark:bg-navy-800" defaultValue={100}><option>100</option><option>50</option><option>25</option></select> ENTRIES</span>
              <label className="flex items-center gap-1.5 text-xs text-slate-400">
                SEARCH: <input value={qInput} onChange={(e) => setQInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && applyFilter()} placeholder="" className="rounded border border-slate-200 bg-white px-2 py-1 text-sm dark:border-white/10 dark:bg-navy-800" />
              </label>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
              <span>{filtered.length} shown · {picked.size} selected · {dupCount} duplicate</span>
              <button onClick={toggleAll} disabled={selectable.length === 0} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-gold-500/15 hover:text-gold-500 disabled:opacity-40 dark:bg-white/5 dark:text-slate-300">
                {allChecked ? "Unselect all" : "Select all"}
              </button>
            </div>
          </div>

          {/* Table — 12 cols like screenshot */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap text-left text-xs">
                <thead className="bg-navy-900 text-[11px] uppercase tracking-wide text-slate-300">
                  <tr>
                    <th className="px-3 py-3">Name</th>
                    <th className="px-3 py-3">Password</th>
                    <th className="px-3 py-3">Service</th>
                    <th className="px-3 py-3">Profile</th>
                    <th className="px-3 py-3">Caller ID</th>
                    <th className="px-3 py-3">Server Name</th>
                    <th className="px-3 py-3">Logout Time</th>
                    <th className="px-3 py-3">User Status</th>
                    <th className="px-3 py-3">Branch</th>
                    <th className="px-3 py-3">Action</th>
                    <th className="px-3 py-3">Export</th>
                    <th className="px-3 py-3 text-center"><input type="checkbox" checked={allChecked} onChange={toggleAll} disabled={selectable.length === 0} className="h-4 w-4 rounded" /></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.name} className={`border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 ${picked.has(u.name) ? "bg-gold-500/5" : ""}`}>
                      <td className="px-3 py-2.5 font-medium text-slate-700 dark:text-slate-200">{u.name}</td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1.5 font-mono text-slate-600 dark:text-slate-300">
                          <span>{revealed.has(u.name) ? (u.password || "—") : "••••"}</span>
                          <button onClick={() => toggleReveal(u.name)} className="text-slate-400 hover:text-gold-500">{revealed.has(u.name) ? <EyeOff size={13} /> : <Eye size={13} />}</button>
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-500">{u.service || "pppoe"}</td>
                      <td className="px-3 py-2.5 text-slate-500">{u.profile || "—"}</td>
                      <td className="px-3 py-2.5 text-slate-500">{u.callerId || "N/A"}</td>
                      <td className="px-3 py-2.5 text-slate-500">{server?.name || "—"}</td>
                      <td className="px-3 py-2.5 text-slate-500">{u.lastLoggedOut || "—"}</td>
                      <td className="px-3 py-2.5">
                        <span className={`rounded px-2 py-1 text-[11px] font-semibold ${u.duplicate ? "bg-slate-400/15 text-slate-500" : "bg-amber-500 text-white"}`}>{u.duplicate ? "Exists" : "Unique"}</span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-500">N/A</td>
                      <td className="px-3 py-2.5">
                        <button
                          disabled={u.duplicate}
                          onClick={() => toggle(u.name)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${picked.has(u.name) ? "bg-sky-500" : "bg-slate-300 dark:bg-white/20"} disabled:opacity-40`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${picked.has(u.name) ? "translate-x-4" : "translate-x-0.5"}`} />
                        </button>
                      </td>
                      <td className="px-3 py-2.5">
                        <button onClick={() => doImport(u.name)} disabled={u.duplicate || importing} className="rounded p-1.5 text-emerald-500 hover:bg-emerald-500/10 disabled:opacity-40"><UserPlus size={14} /></button>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <input type="checkbox" checked={picked.has(u.name)} disabled={u.duplicate} onChange={() => toggle(u.name)} className="h-4 w-4 rounded disabled:opacity-30" />
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={12} className="py-10 text-center text-sm text-slate-400">No data available in table — <button onClick={clearFilter} className="font-semibold text-gold-500 hover:underline">clear filter</button></td></tr>}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-400 dark:border-white/5">
              <span>Showing {filtered.length} of {preview.users.length} entries</span>
              <span>Previous &nbsp; 1 &nbsp; Next</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
