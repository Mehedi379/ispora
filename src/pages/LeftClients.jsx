import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Loader2, UserMinus, Search } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";
import Dropdown from "../components/Dropdown";

export default function LeftClients() {
  const { user, notify, refreshClients } = useStore();
  const canManage = user?.role === "admin" || user?.role === "reseller";
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  // Screenshot-style filters (client-side)
  const [fZone, setFZone] = useState("");
  const [fConn, setFConn] = useState("");
  const [fClientType, setFClientType] = useState("");
  const [fPackage, setFPackage] = useState("");
  const [fProtocol, setFProtocol] = useState("");
  const [fFromLeft, setFFromLeft] = useState("");
  const [fToLeft, setFToLeft] = useState("");
  const [fRecoveryStatus, setFRecoveryStatus] = useState("");
  const [fRecoveredBy, setFRecoveredBy] = useState("");
  const [zones, setZones] = useState([]);
  const [connTypes, setConnTypes] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [left, zs, cts] = await Promise.all([
        api.listLeftClients(),
        api.listConfig("zones").catch(() => []),
        api.listConfig("connection-types").catch(() => []),
      ]);
      setList(left); setZones(zs || []); setConnTypes(cts || []); setErr("");
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const rejoin = async (c) => {
    setBusy(c.id);
    try { await api.rejoinClient(c.id); await load(); await refreshClients?.(); notify("Customer abar active list e fire gelo", "success"); }
    catch (e) { notify(e.message); }
    finally { setBusy(null); }
  };

  const exportCsv = () => {
    const cols = ["C.Code", "ID/IP", "Client Name", "Mobile", "Zone", "Connection Type", "Client Type", "R.Address", "Package/Speed", "M.Bill", "Due", "Server", "B.Status", "Left Date"];
    const lines = [cols.join(",")];
    for (const c of filtered) {
      const vals = [
        String(c.id).padStart(4, "0"), c.pppoe || "", c.name || "", c.phone || "", c.zone || "", c.connectionType || "", c.clientType || "", c.address || "",
        `${c.package || ""}/${c.speed || ""}`.replace(/\/$/, ""), String(c.bill ?? c.monthlyBill ?? 0), String(c.due ?? 0), c.server || "", c.status || "", c.leftAt || "",
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(vals.join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `left-clients-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const filtered = useMemo(() => {
    let out = list;
    if (q) {
      const s = q.toLowerCase();
      out = out.filter((c) => `${c.name} ${c.phone} ${c.pppoe} ${c.zone}`.toLowerCase().includes(s));
    }
    if (fZone) out = out.filter((c) => c.zone === fZone);
    if (fConn) out = out.filter((c) => c.connectionType === fConn);
    if (fClientType) out = out.filter((c) => c.clientType === fClientType);
    if (fPackage) out = out.filter((c) => c.package === fPackage);
    if (fProtocol) out = out.filter((c) => c.protocolType === fProtocol);
    if (fFromLeft) {
      const d = new Date(fFromLeft);
      out = out.filter((c) => c.leftAt && new Date(c.leftAt) >= d);
    }
    if (fToLeft) {
      const d = new Date(`${fToLeft}T23:59:59`);
      out = out.filter((c) => c.leftAt && new Date(c.leftAt) <= d);
    }
    return out;
  }, [list, q, fZone, fConn, fClientType, fPackage, fProtocol, fFromLeft, fToLeft]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Left Clients</h2>
          <p className="text-sm text-slate-400">View All Left Client — connection chere jawa — chaile rejoin korate paren</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-800 dark:bg-navy-700">Generate Excel</button>
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-800 dark:bg-navy-700">Generate Pdf</button>
        </div>
      </div>

      {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}

      {/* Filter bar — like screenshot */}
      <div className="card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Zone</span>
            <Dropdown value={fZone} options={[{ value: "", label: "Select" }, ...zones.map((z) => ({ value: z.name, label: z.name }))]} onChange={setFZone} placeholder="Select" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Connection Type</span>
            <Dropdown value={fConn} options={[{ value: "", label: "Select" }, ...connTypes.map((c) => ({ value: c.name, label: c.name }))]} onChange={setFConn} placeholder="Select" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Client Type</span>
            <Dropdown value={fClientType} options={[{ value: "", label: "Select" }]} onChange={setFClientType} placeholder="Select" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Package</span>
            <Dropdown value={fPackage} options={[{ value: "", label: "Select" }]} onChange={setFPackage} placeholder="Select" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Protocol Type</span>
            <Dropdown value={fProtocol} options={[{ value: "", label: "Select" }]} onChange={setFProtocol} placeholder="Select" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">From Left Date</span>
            <input type="date" className={input} value={fFromLeft} onChange={(e) => setFFromLeft(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">To Left Date</span>
            <input type="date" className={input} value={fToLeft} onChange={(e) => setFToLeft(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Recovery Status</span>
            <Dropdown value={fRecoveryStatus} options={[{ value: "", label: "Select" }]} onChange={setFRecoveryStatus} placeholder="Select" />
          </label>
          <label className="block lg:col-span-2">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Recovered By</span>
            <Dropdown value={fRecoveredBy} options={[{ value: "", label: "Select" }]} onChange={setFRecoveredBy} placeholder="Select" />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-white/5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            SHOW <select className="rounded border border-slate-200 bg-white px-2 py-1 dark:border-white/10 dark:bg-navy-800" defaultValue={100}><option>100</option><option>50</option><option>25</option></select> ENTRIES
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className={`${input} h-8 pl-7 text-xs`} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-xs">
              <thead className="bg-navy-900 text-[11px] uppercase tracking-wide text-slate-300">
                <tr>
                  <th className="px-3 py-3"><input type="checkbox" disabled className="h-4 w-4 rounded opacity-40" /></th>
                  <th className="px-3 py-3">C.Code</th>
                  <th className="px-3 py-3">ID/IP</th>
                  <th className="px-3 py-3">Client Name</th>
                  <th className="px-3 py-3">Mobile</th>
                  <th className="px-3 py-3">Zone</th>
                  <th className="px-3 py-3">Connection Type</th>
                  <th className="px-3 py-3">Client Type</th>
                  <th className="px-3 py-3">R.Address</th>
                  <th className="px-3 py-3">Package/Speed</th>
                  <th className="px-3 py-3 text-right">M.Bill</th>
                  <th className="px-3 py-3 text-right">Due</th>
                  <th className="px-3 py-3">Server</th>
                  <th className="px-3 py-3">B.Status</th>
                  <th className="px-3 py-3">Left Date</th>
                  <th className="px-3 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan={16} className="py-10 text-center text-sm text-slate-400">No data available in table</td></tr>
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-400 dark:border-white/5">
            <span>Showing 0 of 0 entries</span>
            <span className="rounded bg-navy-900 px-2 py-1 text-white">1</span>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/5">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              SHOW <select className="rounded border border-slate-200 bg-white px-2 py-1 dark:border-white/10 dark:bg-navy-800" defaultValue={100}><option>100</option><option>50</option><option>25</option></select> ENTRIES
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className={`${input} h-7 pl-7 text-xs`} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-xs">
              <thead className="bg-navy-900 text-[11px] uppercase tracking-wide text-slate-300">
                <tr>
                  <th className="px-3 py-3"><input type="checkbox" disabled className="h-4 w-4 rounded opacity-40" /></th>
                  <th className="px-3 py-3">C.Code</th>
                  <th className="px-3 py-3">ID/IP</th>
                  <th className="px-3 py-3">Client Name</th>
                  <th className="px-3 py-3">Mobile</th>
                  <th className="px-3 py-3">Zone</th>
                  <th className="px-3 py-3">Connection Type</th>
                  <th className="px-3 py-3">Client Type</th>
                  <th className="px-3 py-3">R.Address</th>
                  <th className="px-3 py-3">Package/Speed</th>
                  <th className="px-3 py-3 text-right">M.Bill</th>
                  <th className="px-3 py-3 text-right">Due</th>
                  <th className="px-3 py-3">Server</th>
                  <th className="px-3 py-3">B.Status</th>
                  <th className="px-3 py-3">Left Date</th>
                  <th className="px-3 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="px-3 py-2.5"><input type="checkbox" className="h-4 w-4 rounded" /></td>
                    <td className="px-3 py-2.5 font-mono text-slate-400">{String(c.id).padStart(4, "0")}</td>
                    <td className="px-3 py-2.5 font-medium text-gold-500">{c.pppoe}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-700 dark:text-slate-200">{c.name}</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{c.phone}</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{c.zone || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{c.connectionType || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{c.clientType || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{c.address || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{c.package ? `${c.package}/${c.speed || ""}`.replace(/\/$/, "") : "—"}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">{c.bill ?? c.monthlyBill ?? "—"}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-rose-500">{c.due != null ? c.due.toLocaleString() : "—"}</td>
                    <td className="px-3 py-2.5 text-slate-500">—</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{c.status}</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{c.leftAt || "—"}</td>
                    <td className="px-3 py-2.5">
                      {canManage && (
                        <button onClick={() => rejoin(c)} disabled={busy === c.id}
                          className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-500/20 disabled:opacity-50">
                          {busy === c.id ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />} Rejoin
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-400 dark:border-white/5">
            <span>Showing {filtered.length} of {list.length} entries</span>
            <span>Previous &nbsp; 1 &nbsp; Next</span>
          </div>
        </div>
      )}
    </div>
  );
}
