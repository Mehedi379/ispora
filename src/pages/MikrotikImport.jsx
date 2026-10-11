import { useState, useEffect, useCallback } from "react";
import { Loader2, Download, FlaskConical, CheckSquare, Square, MinusSquare, UserCheck, Eye, EyeOff, Search, FileSpreadsheet, Users, X } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";
import Dropdown from "../components/Dropdown";

export default function MikrotikImport() {
  const { notify, refreshClients } = useStore();
  const [servers, setServers] = useState([]);
  const [serverId, setServerId] = useState("");
  const [preview, setPreview] = useState(null); // { simulated, users:[{name,profile,disabled,duplicate}] }
  const [picked, setPicked] = useState(new Set());
  const [revealed, setRevealed] = useState(new Set()); // password show/hide per row
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [search, setSearch] = useState("");
  const [fProfile, setFProfile] = useState("");   // "" = all profiles
  const [fType, setFType] = useState("all");        // all | new | exists

  useEffect(() => {
    (async () => {
      try { const s = await api.mtServers(); setServers(s); if (s[0]) setServerId(String(s[0].id)); }
      catch (e) { notify(e.message); }
    })();
  }, [notify]);

  const loadPreview = useCallback(async () => {
    if (!serverId) return;
    setLoading(true); setResult(null); setPreview(null);
    setRevealed(new Set()); setSearch(""); setFProfile(""); setFType("all");
    try {
      const p = await api.mtImportPreview(serverId);
      setPreview(p);
      setPicked(new Set(p.users.filter((u) => !u.duplicate).map((u) => u.name)));
    } catch (e) { notify(e.message); }
    finally { setLoading(false); }
  }, [serverId, notify]);

  const toggle = (name) => setPicked((s) => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n; });
  const toggleReveal = (name) => setRevealed((s) => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n; });

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

  // Filter: profile + user-type + free-text search (sob client-side, live)
  const profiles = preview ? [...new Set(preview.users.map((u) => u.profile).filter(Boolean))] : [];
  const q = search.trim().toLowerCase();
  const filtered = preview ? preview.users.filter((u) => {
    if (fProfile && u.profile !== fProfile) return false;
    if (fType === "new" && u.duplicate) return false;
    if (fType === "exists" && !u.duplicate) return false;
    if (q && !`${u.name} ${u.profile} ${u.callerId} ${u.comment}`.toLowerCase().includes(q)) return false;
    return true;
  }) : [];
  const dupCount = preview ? preview.users.filter((u) => u.duplicate).length : 0;
  const clearFilter = () => { setSearch(""); setFProfile(""); setFType("all"); };

  // Select-all: filter-er moddhe thaka non-duplicate user gula selectable
  const selectable = filtered.filter((u) => !u.duplicate).map((u) => u.name);
  const allChecked = selectable.length > 0 && selectable.every((n) => picked.has(n));
  const someChecked = selectable.some((n) => picked.has(n));
  const toggleAll = () => setPicked((s) => {
    const n = new Set(s);
    if (allChecked) selectable.forEach((x) => n.delete(x));
    else selectable.forEach((x) => n.add(x));
    return n;
  });

  // CSV/Excel export (UTF-8 BOM diye jate Excel-e thik dekhay)
  const csvEscape = (v) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const buildCSV = (rows) => {
    const head = ["PPPoE", "Password", "Service", "Profile", "Caller ID", "Last Logout", "State", "Status"];
    const body = rows.map((u) => [u.name, u.password, u.service, u.profile, u.callerId, u.lastLoggedOut, u.disabled ? "Disabled" : "Enabled", u.duplicate ? "Already exists" : "New"].map(csvEscape).join(","));
    return [head.join(","), ...body].join("\r\n");
  };
  const download = (name, text) => {
    const blob = new Blob(["﻿" + text], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };
  const genExcel = () => { if (!filtered.length) return notify("Export korar moto kono row nei"); download(`mikrotik-${server?.name || "export"}.csv`, buildCSV(filtered)); };
  const exportMac = () => {
    const rows = filtered.filter((u) => picked.has(u.name));
    if (!rows.length) return notify("Age user select koro — tarpor MACReseller export");
    download(`macreseller-${server?.name || "export"}.csv`, buildCSV(rows));
  };

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
        <div className="space-y-4">
          {/* Toolbar: export actions + filters (competitor-style) */}
          <div className="card space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button onClick={genExcel} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110">
                <FileSpreadsheet size={15} /> Generate Excel
              </button>
              <button onClick={doImport} disabled={importing || picked.size === 0} className="btn-gold">
                {importing ? <Loader2 size={15} className="animate-spin" /> : <UserCheck size={15} />} Export To Client List
              </button>
              <button onClick={exportMac} disabled={picked.size === 0} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-gold-500/60 hover:text-gold-500 disabled:opacity-40">
                <Users size={15} /> Export To MACReseller
              </button>
            </div>
            <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-3 dark:border-white/5">
              <label className="block min-w-[140px] flex-1"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Protocol</span>
                <Dropdown value="pppoe" options={[{ value: "pppoe", label: "PPPoE" }]} onChange={() => {}} /></label>
              <label className="block min-w-[140px] flex-1"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Profile</span>
                <Dropdown value={fProfile} options={[{ value: "", label: "All profiles" }, ...profiles.map((p) => ({ value: p, label: p }))]} onChange={setFProfile} /></label>
              <label className="block min-w-[140px] flex-1"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">User Type</span>
                <Dropdown value={fType} options={[{ value: "all", label: "All" }, { value: "new", label: "New (unique)" }, { value: "exists", label: "Already exists" }]} onChange={setFType} /></label>
              <label className="block min-w-[180px] flex-[1.5]"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Search</span>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name / profile / caller id..." className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-gold-500/60 dark:border-white/10 dark:bg-navy-800 dark:text-white dark:placeholder-slate-500" />
                </div></label>
              <button onClick={clearFilter} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-400/40 px-3 py-2.5 text-sm font-semibold text-rose-500 transition hover:bg-rose-500/10">
                <X size={15} /> Clear Filter
              </button>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-white/5">
              <div className="flex items-center gap-3">
                <p className="text-sm text-slate-500">{filtered.length} shown · {picked.size} selected · {dupCount} duplicate</p>
                <button onClick={toggleAll} disabled={selectable.length === 0} className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300 transition hover:bg-gold-500/15 hover:text-gold-500 disabled:opacity-40">
                  {allChecked ? "Unselect all" : "Select all"}
                </button>
              </div>
              <button onClick={doImport} disabled={importing || picked.size === 0} className="btn-gold">{importing ? <Loader2 size={15} className="animate-spin" /> : <UserCheck size={15} />} Import Selected</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr><th className="px-5 py-3 w-10">
                    <button onClick={toggleAll} disabled={selectable.length === 0} title={allChecked ? "Unselect all" : "Select all"} className="align-middle text-slate-400 disabled:opacity-30">
                      {allChecked ? <CheckSquare size={18} className="text-gold-500" /> : someChecked ? <MinusSquare size={18} className="text-gold-500" /> : <Square size={18} />}
                    </button>
                  </th><th className="px-5 py-3 font-semibold">PPPoE</th><th className="px-5 py-3 font-semibold">Password</th><th className="px-5 py-3 font-semibold">Service</th><th className="px-5 py-3 font-semibold">Profile</th><th className="px-5 py-3 font-semibold">Caller ID</th><th className="px-5 py-3 font-semibold">Last Logout</th><th className="px-5 py-3 font-semibold">State</th><th className="px-5 py-3 font-semibold">Status</th></tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.name} className="border-t border-slate-100 dark:border-white/5">
                      <td className="px-5 py-3">
                        <button disabled={u.duplicate} onClick={() => toggle(u.name)} className="text-slate-400 disabled:opacity-30">
                          {picked.has(u.name) ? <CheckSquare size={18} className="text-gold-500" /> : <Square size={18} />}
                        </button>
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{u.name}</td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                        {u.password ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="font-mono text-xs">{revealed.has(u.name) ? u.password : "••••••••"}</span>
                            <button onClick={() => toggleReveal(u.name)} title={revealed.has(u.name) ? "Hide" : "Show"} className="text-slate-400 hover:text-gold-500">
                              {revealed.has(u.name) ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{u.service || "—"}</td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{u.profile || "—"}</td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{u.callerId || "—"}</td>
                      <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">{u.lastLoggedOut || "—"}</td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{u.disabled ? "Disabled" : "Enabled"}</td>
                      <td className="px-5 py-3">{u.duplicate ? <span className="rounded-lg bg-slate-400/10 px-2 py-0.5 text-xs font-semibold text-slate-400">Already exists</span> : <span className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-500">New</span>}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={9} className="px-5 py-10 text-center text-sm text-slate-400">Filter onujayi kono user nei — <button onClick={clearFilter} className="font-semibold text-gold-500 hover:underline">clear filter</button></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
