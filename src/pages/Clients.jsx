import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Plus, Phone, Pencil, Trash2, Filter, UserMinus, Eye, EyeOff, FileSpreadsheet, FileText, ArrowRightLeft, Link2, Link2Off, ServerCog, Info, Check, X, Crown } from "lucide-react";
import Dropdown from "../components/Dropdown";
import Modal from "../components/Modal";
import ClientForm from "../components/ClientForm";
import { useStore } from "../store";
import { api } from "../api";
import { statusStyle } from "../data";

export default function Clients({ filterStatus }) {
  const { clients, loading, addClient, updateClient, deleteClient, toggleLine, user, refreshClients, ent } = useStore();
  const isAdmin = user?.role === "admin";
  const navigate = useNavigate();
  const [toLeft, setToLeft] = useState(null);
  const [q, setQ] = useState("");
  const [zone, setZone] = useState("All Zones");
  const [status, setStatus] = useState("All Status");
  const [showMore, setShowMore] = useState(false);
  const [pkg, setPkg] = useState("All Packages");
  const [conn, setConn] = useState("All");
  const [sort, setSort] = useState("Default");
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [seatLimit, setSeatLimit] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const [revealed, setRevealed] = useState(new Set());
  const [selected, setSelected] = useState(new Set());
  const [bulkOpen, setBulkOpen] = useState(null); // {type}
  const [bulkValue, setBulkValue] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

  // For bulk target selects
  const [lookups, setLookups] = useState({ zones: [], packages: [], boxes: [], subZones: [] });
  useEffect(() => {
    (async () => {
      try {
        const [zs, pkgs] = await Promise.all([api.listConfig("zones").catch(() => []), api.listPackages().catch(() => [])]);
        setLookups((l) => ({ ...l, zones: zs || [], packages: pkgs || [] }));
      } catch {}
    })();
  }, []);

  const notify = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  };
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  const toggleReveal = (id) => setRevealed((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelect = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((c) => c.id)));
  };

  const handleToggle = async (c) => {
    const locked = c.status === "expired" || c.status === "suspended";
    if (locked && !c.online) { notify(`${c.name}: package ${c.status} — age renew korun`); return; }
    try { await toggleLine(c.id); } catch { /* handled in store */ }
  };

  const [params, setParams] = useSearchParams();
  useEffect(() => {
    const urlQ = params.get("q");
    const isNew = params.get("new");
    if (urlQ !== null) setQ(urlQ);
    if (isNew) { setEditing({}); setDraft(null); }
    if (urlQ !== null || isNew) {
      params.delete("q"); params.delete("new");
      setParams(params, { replace: true });
    }
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const pkgOptions = useMemo(() => ["All Packages", ...Array.from(new Set(clients.map((c) => c.package).filter(Boolean)))], [clients]);
  const zoneOptions = useMemo(() => ["All Zones", ...Array.from(new Set(clients.map((c) => c.zone).filter(Boolean)))], [clients]);

  const rows = useMemo(() => {
    let out = clients.filter((c) => {
      if (filterStatus === "due") { if (!(c.status === "due" || (c.due || 0) > 0)) return false; }
      else if (filterStatus && c.status !== filterStatus) return false;
      if (zone !== "All Zones" && c.zone !== zone) return false;
      if (status !== "All Status" && c.status !== status.toLowerCase()) return false;
      if (pkg !== "All Packages" && c.package !== pkg) return false;
      if (conn === "Online" && !c.online) return false;
      if (conn === "Offline" && c.online) return false;
      if (q && !(`${c.name} ${c.phone} ${c.pppoe}`.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
    if (sort === "Name A–Z") out = [...out].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    else if (sort === "Bill (high→low)") out = [...out].sort((a, b) => (b.bill || 0) - (a.bill || 0));
    else if (sort === "Expiry (soonest)") out = [...out].sort((a, b) => (a.expiry || "").localeCompare(b.expiry || ""));
    return out;
  }, [clients, q, zone, status, filterStatus, pkg, conn, sort]);

  // Keep filtered alias for bulk pills logic that uses filtered
  const filtered = rows;

  const resetFilters = () => { setZone("All Zones"); setStatus("All Status"); setPkg("All Packages"); setConn("All"); setSort("Default"); };
  const title = filterStatus === "due" ? "Due Clients" : "Customers";
  const openNew = () => { setEditing({}); setDraft(null); };
  const openEdit = (c) => { setEditing(c); setDraft(null); };
  const save = () => {
    if (!draft?.name) return;
    const op = editing.id ? updateClient({ ...editing, ...draft }) : addClient(draft);
    op.then(() => setEditing(null)).catch((e) => { if (e?.code === "SEAT_LIMIT") { setEditing(null); setSeatLimit(true); } });
  };

  // Stat cards (like screenshot: Running/New/Renewed/Waiver)
  const runningCount = rows.filter((c) => c.status === "active" && !c.leftAt).length;
  const newCount = rows.filter((c) => { const d = c.createdAt ? new Date(c.createdAt) : null; if (!d) return false; const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length || 0;
  const renewedCount = rows.filter((c) => c.status === "active" && c.expiry).length; // proxy until renewal tracking exists
  const waiverCount = rows.filter((c) => c.isVip).length;

  const exportCsv = () => {
    const cols = ["C.Code", "ID/IP", "Password", "Cus. Name", "Mobile", "Zone", "Conn. Type", "Cus. Type", "Package/Speed", "M.Bill", "MAC", "Server", "B.Status", "M.Status"];
    const lines = [cols.join(",")];
    for (const c of filtered) {
      const vals = [
        String(c.id).padStart(4, "0"), c.pppoe || "", "", c.name || "", c.phone || "", c.zone || "", c.connectionType || "", c.clientType || "",
        `${c.package || ""}/${c.speed || ""}`.replace(/\/$/, ""), String(c.bill ?? c.monthlyBill ?? 0), c.deviceMac || "", c.server || "", c.status || "", c.online ? "online" : "offline",
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(vals.join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const runBulk = async () => {
    if (!bulkOpen || selected.size === 0) return;
    const ids = [...selected];
    setBulkBusy(true);
    try {
      if (bulkOpen.type === "profile") {
        const m = lookups.protocolTypes?.find?.((x) => x.name === bulkValue) ?? null;
        const pid = m ? m.id : null;
        await Promise.all(ids.map((id) => updateClient({ id, protocolTypeId: pid })));
      } else if (bulkOpen.type === "package") {
        const pkgFound = lookups.packages.find((p) => String(p.name) === String(bulkValue) || String(p.id) === String(bulkValue));
        await Promise.all(ids.map((id) => updateClient({ id, package: pkgFound ? pkgFound.name : String(bulkValue) })));
      } else if (bulkOpen.type === "status") {
        await Promise.all(ids.map((id) => updateClient({ id, status: String(bulkValue).toLowerCase() })));
      } else if (bulkOpen.type === "mac-unbind") {
        await Promise.all(ids.map((id) => updateClient({ id, deviceMac: "" })));
      } else if (bulkOpen.type === "mac-bind") {
        // Bind needs per-row MAC — placeholder: notify
        throw new Error("Bind: protita client er jonno alada MAC lagbe — row er Edit theke set korun.");
      }
      setBulkOpen(null); setBulkValue(""); setSelected(new Set());
      await refreshClients();
      notify("Bulk update done", "success");
    } catch (e) { notify(e.message || "Bulk failed"); }
    finally { setBulkBusy(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">{title}</h2>
          <p className="text-sm text-slate-400">
            {rows.length} customer paoa gelo
            {filterStatus === "due" && <span> · jader taka baki <b className="font-semibold text-amber-500">৳{rows.reduce((s, c) => s + (c.due || 0), 0).toLocaleString()}</b> (status active hoileo)</span>}
          </p>
        </div>
        <button onClick={openNew} className="btn-gold"><Plus size={16} /> Add Customer</button>
      </div>

      {ent && !ent.unlimited && ent.maxUsers > 0 && (
        <div className={`rounded-xl border px-4 py-2.5 text-sm ${ent.usedUsers >= ent.maxUsers ? "border-rose-500/30 bg-rose-500/10 text-rose-500" : "border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-navy-800 dark:text-slate-400"}`}>
          Plan <b>{ent.planName}</b> — customer: <b>{ent.usedUsers}</b> / {ent.maxUsers}
          {ent.usedUsers >= ent.maxUsers ? <span className="font-semibold"> · limit sesh, upgrade korun</span> : <span> ({ent.remaining} baki)</span>}
        </div>
      )}

      {/* Bulk bar — screenshot top pills */}
      <div className="flex flex-wrap gap-2">
        {[
          ["Generate Excel", () => exportCsv()],
          ["Generate PDF", () => window.print()],
          ["Bulk Profile Change", () => setBulkOpen({ type: "profile" }), false, selected.size === 0],
          ["Bulk Package Change", () => setBulkOpen({ type: "package" }), false, selected.size === 0],
          ["Bulk Status Change", () => setBulkOpen({ type: "status" }), false, selected.size === 0],
          ["Unbind All PPPoE MAC Address", () => setBulkOpen({ type: "mac-unbind" }), false, selected.size === 0],
          ["Bind All PPPoE MAC Address", () => setBulkOpen({ type: "mac-bind" }), false, selected.size === 0],
          ["Sync Clients & Servers", null, true],
          ["Info To Mikrotik", null, true],
        ].map(([label, action, comingSoon, disabled]) => (
          <button
            key={label}
            onClick={action || (() => notify(`${label}: Coming Soon`))}
            disabled={!!(comingSoon || disabled)}
            title={comingSoon ? "Coming Soon" : disabled ? "Select clients first" : label}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold shadow-sm transition ${comingSoon || disabled ? "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500" : "bg-navy-900 text-white hover:bg-navy-800 dark:bg-navy-700"}`}
          >
            {label === "Generate Excel" && <FileSpreadsheet size={12} />}
            {label === "Generate PDF" && <FileText size={12} />}
            {label.startsWith("Bulk") && <ArrowRightLeft size={12} />}
            {label.startsWith("Unbind") && <Link2Off size={12} />}
            {label.startsWith("Bind All") && <Link2 size={12} />}
            {label.startsWith("Sync") && <ServerCog size={12} />}
            {label.startsWith("Info") && <Info size={12} />}
            {label}
          </button>
        ))}
      </div>

      {/* Stat cards — screenshot: Running/New/Renewed/Waiver */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Running Clients", value: runningCount, sub: "Number of clients without LeftOut status", grad: "from-sky-500 to-cyan-500", icon: Check },
          { label: "New Clients", value: newCount, sub: "Monthly number of clients those are new", grad: "from-teal-500 to-emerald-500", icon: Plus },
          { label: "Renewed Clients", value: renewedCount, sub: "Monthly number of newly renewed clients", grad: "from-violet-500 to-indigo-500", icon: ArrowRightLeft },
          { label: "Waiver Clients", value: waiverCount, sub: "Number of clients those are free/personal", grad: "from-slate-600 to-slate-700", icon: X },
        ].map((c) => (
          <div key={c.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.grad} p-4 text-white shadow-lg`}>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/20"><c.icon size={18} /></div>
              <div><p className="text-sm font-semibold">{c.label}</p><p className="font-display text-2xl font-bold">{c.value}</p></div>
            </div>
            <p className="mt-2 text-xs opacity-80">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, phone, PPPoE..."
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-navy-800 py-2.5 pl-10 pr-4 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-gold-400" />
          </div>
          <Dropdown value={zone} options={zoneOptions} onChange={setZone} className="w-40" />
          {!filterStatus && <Dropdown value={status} options={["All Status", "Active", "Due", "Expired", "Suspended"]} onChange={setStatus} className="w-40" />}
          <button onClick={() => setShowMore((o) => !o)} className={`btn-ghost ${showMore ? "text-gold-500" : ""}`}>
            <Filter size={15} /> More
          </button>
        </div>

        {showMore && (
          <motion.div initial={{ opacity: 0, height: 0, overflow: "hidden" }} animate={{ opacity: 1, height: "auto", transitionEnd: { overflow: "visible" } }} className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 dark:border-white/5 pt-3">
            <Dropdown value={pkg} options={pkgOptions} onChange={setPkg} className="w-44" />
            <Dropdown value={conn} options={["All", "Online", "Offline"]} onChange={setConn} className="w-36" />
            <Dropdown value={sort} options={["Default", "Name A–Z", "Bill (high→low)", "Expiry (soonest)"]} onChange={setSort} className="w-48" />
            <button onClick={resetFilters} className="btn-ghost text-rose-500">Reset</button>
          </motion.div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-xs">
            <thead className="bg-navy-900 text-[11px] uppercase tracking-wide text-slate-300">
              <tr>
                <th className="px-2 py-3"><input type="checkbox" checked={selected.size === rows.length && rows.length > 0} onChange={toggleSelectAll} className="h-4 w-4 rounded" /></th>
                <th className="px-3 py-3">C.Code</th>
                <th className="px-3 py-3">ID/IP</th>
                <th className="px-3 py-3">Password</th>
                <th className="px-3 py-3">Cus. Name</th>
                <th className="px-3 py-3">Mobile</th>
                <th className="px-3 py-3">Zone</th>
                <th className="px-3 py-3">Conn. Type</th>
                <th className="px-3 py-3">Cus. Type</th>
                <th className="px-3 py-3">Package/Speed</th>
                <th className="px-3 py-3 text-right">M.Bill</th>
                <th className="px-3 py-3">MAC Addrs</th>
                <th className="px-3 py-3">Server</th>
                <th className="px-3 py-3">B.Status</th>
                <th className="px-3 py-3">M.Status</th>
                <th className="px-3 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c, i) => (
                <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.012, 0.3) }}
                  className={`border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 ${selected.has(c.id) ? "bg-gold-500/5" : ""}`}>
                  <td className="px-2 py-2.5"><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} className="h-4 w-4 rounded" /></td>
                  <td className="px-3 py-2.5 font-mono text-slate-400">{String(c.id).padStart(4, "0")}</td>
                  <td className="px-3 py-2.5 font-medium text-gold-500">{c.pppoe}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1.5">
                      <span>{revealed.has(c.id) ? (c.pppoePassword || c.pppoe || "—") : "••••••••••"}</span>
                      <button onClick={() => toggleReveal(c.id)} className="text-slate-400 hover:text-gold-500">{revealed.has(c.id) ? <EyeOff size={13} /> : <Eye size={13} />}</button>
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-medium text-slate-700 dark:text-slate-200">{c.name}</td>
                  <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{c.phone}</td>
                  <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{c.zone || "—"}</td>
                  <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{c.connectionType || "—"}</td>
                  <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{c.clientType || "—"}</td>
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{c.package ? `${c.package}/${c.speed || ""}`.replace(/\/$/, "") : "—"}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">{c.bill != null ? c.bill : (c.monthlyBill ?? "—")}</td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-slate-500">{c.deviceMac || "—"}</td>
                  <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{c.server || "—"}</td>
                  <td className="px-3 py-2.5"><span className={`rounded px-2 py-1 text-[11px] font-semibold capitalize ${statusStyle[c.status]}`}>{c.status}</span></td>
                  <td className="px-3 py-2.5">
                    <button onClick={() => handleToggle(c)} title={c.online ? "Line ON (click to off)" : "Line OFF"}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${c.online ? "bg-sky-500" : "bg-slate-400/50"}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${c.online ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-0.5">
                      <button onClick={() => openEdit(c)} aria-label={`${c.name} edit`} className="rounded-lg p-1.5 text-slate-400 hover:bg-gold-500/10 hover:text-gold-500"><Pencil size={14} /></button>
                      {isAdmin && <button onClick={() => setToLeft(c)} title="Left mark" className="rounded-lg p-1.5 text-slate-400 hover:bg-amber-500/10 hover:text-amber-500"><UserMinus size={14} /></button>}
                      <button onClick={() => setToDelete(c)} aria-label={`${c.name} delete`} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {loading && <p className="py-12 text-center text-sm text-slate-400">Customer load hocche...</p>}
          {!loading && rows.length === 0 && <p className="py-12 text-center text-sm text-slate-400">Kono customer nei.</p>}
        </div>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Customer" : "Add Customer"} subtitle={editing?.id ? editing.name : "Notun customer er tottho din"} size="xl"
        footer={<><button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">{editing?.id ? "Save Changes" : "Add Customer"}</button></>}>
        {editing && <ClientForm initial={editing.id ? editing : null} onChange={setDraft} />}
      </Modal>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete Customer?" subtitle={toDelete?.name} size="sm"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={() => { deleteClient(toDelete.id).catch(() => {}); setToDelete(null); }} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600"><Trash2 size={15} /> Delete</button></>}>
        <p className="text-sm text-slate-500 dark:text-slate-300"><b className="text-slate-700 dark:text-white">{toDelete?.name}</b> ke delete korle Deleted Customers e chole jabe. Nishchit?</p>
      </Modal>

      <Modal open={!!toLeft} onClose={() => setToLeft(null)} title="Mark as Left?" subtitle={toLeft?.name} size="sm"
        footer={<><button onClick={() => setToLeft(null)} className="btn-ghost">Cancel</button>
          <button onClick={async () => { try { await api.markLeft(toLeft.id); await refreshClients(); } catch {} setToLeft(null); }} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"><UserMinus size={15} /> Mark Left</button></>}>
        <p className="text-sm text-slate-500 dark:text-slate-300"><b className="text-slate-700 dark:text-white">{toLeft?.name}</b> connection chere geche? Left Customers list e jabe, line off hobe. Data thakbe, chaile rejoin kora jabe.</p>
      </Modal>

      <Modal open={!!bulkOpen} onClose={() => setBulkOpen(null)} title={`Bulk ${bulkOpen?.type || ""}`} subtitle={`${selected.size} selected`} size="sm"
        footer={<><button onClick={() => setBulkOpen(null)} className="btn-ghost">Cancel</button><button onClick={runBulk} disabled={bulkBusy} className="btn-gold">{bulkBusy ? <Loader2 size={15} className="animate-spin" /> : "Apply"}</button></>}>
        {bulkOpen?.type === "profile" && <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Profile / Protocol</span><Dropdown value={bulkValue} options={["PPPoE", "Static", "DHCP", "Hotspot"]} onChange={setBulkValue} placeholder="Select" /></label>}
        {bulkOpen?.type === "package" && <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Package</span><Dropdown value={bulkValue} options={lookups.packages.map((p) => p.name)} onChange={setBulkValue} placeholder="Select package" /></label>}
        {bulkOpen?.type === "status" && <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Billing Status</span><Dropdown value={bulkValue} options={["Active", "Due", "Expired", "Suspended"]} onChange={setBulkValue} placeholder="Select" /></label>}
        {bulkOpen?.type === "mac-unbind" && <p className="text-sm text-slate-600 dark:text-slate-300">Unbind MAC for {selected.size} client(s)? Device MAC clear hoye jabe.</p>}
        {bulkOpen?.type === "mac-bind" && <p className="text-sm text-slate-600 dark:text-slate-300">Bind needs per-client MAC — Edit theke protita client er MAC alada set korun.</p>}
      </Modal>

      <Modal open={seatLimit} onClose={() => setSeatLimit(false)} title="User limit sesh" subtitle={ent?.planName || ""} size="sm"
        footer={<><button onClick={() => setSeatLimit(false)} className="btn-ghost">Thik ache</button><button onClick={() => { setSeatLimit(false); navigate("/subscription"); }} className="btn-gold">User baran / Upgrade</button></>}>
        <p className="text-sm text-slate-500 dark:text-slate-300">Apnar plan-e <b className="text-slate-700 dark:text-white">{ent?.maxUsers}</b> user porjonto — limit sesh hoye geche. Aro customer add korte hole boro plan nin (beshi user = beshi taka). Subscription page theke upgrade kore abar try korun.</p>
      </Modal>

      {toast && <motion.div role="status" aria-live="polite" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-amber-500/30 bg-navy-900 px-4 py-3 text-sm font-medium text-amber-300 shadow-xl">{toast}</motion.div>}
    </div>
  );
}
