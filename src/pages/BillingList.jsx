import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, FileStack, Users, UserX, Wallet, Coins, FileText, PiggyBank, Calendar, MoreVertical, CreditCard, Eye, FileSpreadsheet, History, ChevronDown, SlidersHorizontal } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { input } from "../ui";
import { statusStyle } from "../data";
import { clientLabel } from "../data";

const fmt = (n) => `৳${Number(n || 0).toLocaleString()}`;

export default function BillingList() {
  const { user, notify } = useStore();
  const { clients, refreshClients, toggleLine } = useStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [genOpen, setGenOpen] = useState(false);
  const [gen, setGen] = useState(false);
  const [err, setErr] = useState("");
  const [payRow, setPayRow] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [payBusy, setPayBusy] = useState(false);
  const [payErr, setPayErr] = useState("");
  const [menuOpen, setMenuOpen] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkOpen, setBulkOpen] = useState(null); // {type}
  const [bulkValue, setBulkValue] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkErr, setBulkErr] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [lookups, setLookups] = useState({ zones: [], packages: [], connTypes: [], clientTypes: [], protocolTypes: [], billingStatuses: [], boxes: [], subZones: [] });
  const [filters, setFilters] = useState({
    server: "", protocolType: "", profile: "", zone: "", subZone: "", box: "",
    package: "", billingStatus: "", paymentStatus: "", mikrotikStatus: "", connectionType: "", clientType: "",
    fromExDate: "", toExDate: "", fromEffective: "", toEffective: "", fromNonEffective: "", toNonEffective: "",
    customStatus: "", fromDate: "", toDate: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await api.billingList()); setErr(""); }
    catch (e) { setErr(e?.message || "Load fail"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [zones, packages, connTypes, clientTypes, protocolTypes, billingStatuses, boxes, subZones] = await Promise.all([
          api.listConfig("zones"), api.listPackages().then((p) => p.map((x) => ({ id: x.id, name: x.name }))).catch(() => []),
          api.listConfig("connection-types").catch(() => []), api.listConfig("client-types").catch(() => []),
          api.listConfig("protocol-types").catch(() => []), api.listConfig("billing-statuses").catch(() => []),
          api.listConfig("boxes").catch(() => []), api.listConfig("sub-zones").catch(() => []),
        ]);
        if (!alive) return;
        setLookups({ zones: zones || [], packages: packages || [], connTypes: connTypes || [], clientTypes: clientTypes || [], protocolTypes: protocolTypes || [], billingStatuses: billingStatuses || [], boxes: boxes || [], subZones: subZones || [] });
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  const filtered = rows.filter((r) => {
    if (q && !`${r.name} ${r.phone} ${r.pppoe} ${r.zone} ${r.package}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (filters.zone && r.zone !== filters.zone) return false;
    if (filters.package && r.package !== filters.package) return false;
    if (filters.connectionType && r.connectionType !== filters.connectionType) return false;
    if (filters.clientType && r.clientType !== filters.clientType) return false;
    if (filters.billingStatus && r.status !== filters.billingStatus) return false;
    if (filters.mikrotikStatus && String(r.online) !== String(filters.mikrotikStatus === "online")) return false;
    if (filters.paymentStatus) {
      const hasDue = (r.due || 0) > 0;
      if (filters.paymentStatus === "paid" && hasDue) return false;
      if (filters.paymentStatus === "due" && !hasDue) return false;
    }
    return true;
  });

  // Competitor-style stat tiles (frontend aggregate)
  const paidClients = rows.filter((r) => r.received > 0).length;
  const unpaidClients = rows.filter((r) => (r.received || 0) <= 0 && (r.monthlyBill || 0) > 0).length;
  const receivedBill = rows.reduce((s, r) => s + (r.received || 0), 0);
  const dueAmount = rows.reduce((s, r) => s + (r.due > 0 ? r.due : 0), 0);
  const monthlyBill = rows.reduce((s, r) => s + (r.monthlyBill || 0), 0);
  const advanceAmount = rows.reduce((s, r) => s + (r.advance || 0), 0);
  const generatedBill = rows.filter((r) => r.billedThisMonth).reduce((s, r) => s + (r.monthlyBill || 0), 0);

  const runGenerate = async () => {
    setGen(true);
    try { const res = await api.generateBills(); setGenOpen(false); notify(`${res.created} ta notun bill generate holo`, "success"); await load(); }
    catch (e) { notify(e.message); }
    finally { setGen(false); }
  };

  const openPay = (r) => { setPayRow(r); setPayAmount(String(r.due > 0 ? r.due : r.monthlyBill || "")); setPayMethod("Cash"); setPayErr(""); };
  const doPay = async () => {
    const amt = Number(payAmount);
    if (!amt || amt <= 0) { setPayErr("Amount din"); return; }
    setPayBusy(true);
    try {
      const c = clients.find((x) => x.id === payRow.id) || payRow;
      await api.collectPayment({ clientId: c.id, amount: amt, method: payMethod });
      setPayRow(null); setPayAmount("");
      await Promise.all([load(), refreshClients()]);
      notify("Payment collected", "success");
    } catch (e) { setPayErr(e.message); }
    finally { setPayBusy(false); }
  };
  const doDue = async (r) => {
    notify("Due: ekhane Pay kore due koman, ba Client edit theke due adjust korun.");
  };

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const toggleSelectAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  };
  const toggleSelect = (id) => setSelected((prev) => {
    const n = new Set(prev);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const selectedRows = rows.filter((r) => selected.has(r.id));
  const runBulk = async () => {
    if (!bulkOpen || selected.size === 0) return;
    const ids = [...selected];
    setBulkBusy(true); setBulkErr("");
    try {
      if (bulkOpen.type === "status") {
        const status = String(bulkValue || "").toLowerCase();
        if (!["active", "due", "expired", "suspended"].includes(status)) throw new Error("Status select korun");
        await Promise.all(ids.map((id) => api.updateClient(id, { status })));
      } else if (bulkOpen.type === "zone") {
        if (!bulkValue) throw new Error("Zone select korun");
        await Promise.all(ids.map((id) => api.updateClient(id, { zone: bulkValue })));
      } else if (bulkOpen.type === "package") {
        if (!bulkValue) throw new Error("Package select korun");
        const pkg = lookups.packages.find((p) => String(p.name) === String(bulkValue) || String(p.id) === String(bulkValue));
        const payload = pkg ? { package: pkg.name } : { package: String(bulkValue) };
        await Promise.all(ids.map((id) => api.updateClient(id, payload)));
      } else if (bulkOpen.type === "online") {
        const online = bulkValue === "online";
        await Promise.all(ids.map((id) => api.updateClient(id, { online })));
      } else if (bulkOpen.type === "connectionType") {
        const m = lookups.connTypes.find((x) => x.name === bulkValue);
        await Promise.all(ids.map((id) => api.updateClient(id, { connectionTypeId: m ? m.id : null })));
      } else if (bulkOpen.type === "clientType") {
        const m = lookups.clientTypes.find((x) => x.name === bulkValue);
        await Promise.all(ids.map((id) => api.updateClient(id, { clientTypeId: m ? m.id : null })));
      } else if (bulkOpen.type === "protocolType") {
        const m = lookups.protocolTypes.find((x) => x.name === bulkValue);
        await Promise.all(ids.map((id) => api.updateClient(id, { protocolTypeId: m ? m.id : null })));
      } else if (bulkOpen.type === "box") {
        const m = lookups.boxes.find((x) => x.name === bulkValue);
        await Promise.all(ids.map((id) => api.updateClient(id, { boxId: m ? m.id : null })));
      } else if (bulkOpen.type === "subZone") {
        const m = lookups.subZones.find((x) => x.name === bulkValue);
        await Promise.all(ids.map((id) => api.updateClient(id, { subZoneId: m ? m.id : null })));
      } else if (bulkOpen.type === "billingStatus") {
        await Promise.all(ids.map((id) => api.updateClient(id, { status: String(bulkValue).toLowerCase() })));
      } else if (bulkOpen.type === "vip") {
        const isVip = bulkValue === "vip";
        await Promise.all(ids.map((id) => api.updateClient(id, { isVip })));
      }
      setBulkOpen(null); setBulkValue(""); setSelected(new Set());
      await Promise.all([load(), refreshClients()]);
      notify("Bulk update done", "success");
    } catch (e) { setBulkErr(e.message || "Bulk failed"); }
    finally { setBulkBusy(false); }
  };
  const exportCsv = () => {
    const cols = ["C.Code", "ID/IP", "Cus. Name", "Mobile", "Zone", "Cus. Type", "Conn. Type", "Package", "Speed", "Ex. Date", "M.Bill", "Received", "VAT", "Balance Due", "Advance", "Pay Date", "Server", "M.Status", "B.Status"];
    const lines = [cols.join(",")];
    for (const r of filtered) {
      const vals = [
        String(r.id).padStart(4, "0"), r.pppoe || "", r.name || "", r.phone || "", r.zone || "", r.clientType || "", r.connectionType || "",
        r.package || "", r.speed || "", r.expiry || "", String(r.monthlyBill ?? 0), String(r.received ?? 0), String(r.vat ?? 0),
        String(r.due ?? 0), String(r.advance ?? 0), r.lastPayment || "", r.server || "", r.online ? "online" : "offline", r.status || "",
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(vals.join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `billing-list-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };
  const downloadInvoices = () => {
    notify("Download Invoice: protita selected client er jonno invoice generate hocche — Generate Bills use korun, ba Invoices page theke download korun.");
  };

  const G = { sky: "from-sky-500 to-blue-600", teal: "from-teal-500 to-emerald-600", violet: "from-violet-500 to-purple-600", slate: "from-slate-600 to-slate-800" };
  const tiles = [
    { label: "Paid Client", value: paidClients, sub: "Monthly paid client", icon: Users, grad: G.sky, raw: true },
    { label: "Unpaid Client", value: unpaidClients, sub: "Monthly unpaid client", icon: UserX, grad: G.teal, raw: true },
    { label: "Received Bill", value: receivedBill, sub: "Monthly received bill", icon: Wallet, grad: G.violet },
    { label: "Due Amount", value: dueAmount, sub: "All over due amount", icon: Coins, grad: G.slate },
    { label: "Generated Bill", value: generatedBill, sub: "Monthly generated bill", icon: FileText, grad: G.sky },
    { label: "Advance Amount", value: advanceAmount, sub: "Monthly advance amount", icon: PiggyBank, grad: G.teal },
    { label: "Monthly Bill", value: monthlyBill, sub: "Current month total customer bill", icon: Calendar, grad: G.violet },
  ];

  const th = "px-3 py-3 font-semibold whitespace-nowrap";
  const td = "px-3 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Billing List</h2>
          <p className="text-sm text-slate-400">All clients bill — ei maaser billing obostha</p>
        </div>
        {isAdmin && <button onClick={() => setGenOpen(true)} className="btn-gold"><FileStack size={16} /> Generate Bills</button>}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t, i) => (
          <motion.div key={t.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${t.grad} p-4 text-white shadow-lg`}>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/20"><t.icon size={20} /></div>
              <div className="min-w-0">
                <p className="text-xs font-medium opacity-90">{t.label}</p>
                <p className="font-display text-xl font-bold">{t.raw ? Number(t.value || 0).toLocaleString() : fmt(t.value)}</p>
              </div>
            </div>
            <p className="mt-2.5 truncate text-[11px] opacity-80">{t.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bulk Actions {selected.size > 0 && <span className="ml-2 rounded-full bg-gold-500 px-2 py-0.5 text-[11px] font-bold text-white">{selected.size} selected</span>}</p>
          <button onClick={() => setFiltersOpen((v) => !v)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <SlidersHorizontal size={14} /> Filters <ChevronDown size={14} className={`transition ${filtersOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ["Generate Excel", () => exportCsv()],
            ["Generate PDF", () => window.print()],
            ["Sync Clients & Servers", null, true],
            ["Disable Selected Clients", () => { setBulkValue("offline"); setBulkOpen({ type: "online" }); }, false, selected.size === 0],
            ["Bulk Status Change", () => setBulkOpen({ type: "status" }), false, selected.size === 0],
            ["Bulk Zone Change", () => setBulkOpen({ type: "zone" }), false, selected.size === 0],
            ["Bulk District Change", null, true],
            ["Bulk Thana Change", () => setBulkOpen({ type: "subZone" }), false, selected.size === 0],
            ["Enable Selected Clients", () => { setBulkValue("online"); setBulkOpen({ type: "online" }); }, false, selected.size === 0],
            ["Download Invoice", () => downloadInvoices()],
            ["SMS Selected Clients", null, true],
            ["Email Selected Clients", null, true],
            ["Info To Mikrotik", null, true],
            ["Bulk Billing Date Extend", null, true],
            ["Migrate one server to another", null, true],
            ["Bulk update to VIP client", () => { setBulkValue("vip"); setBulkOpen({ type: "vip" }); }, false, selected.size === 0],
            ["Bulk remove from VIP client", () => { setBulkValue("non-vip"); setBulkOpen({ type: "vip" }); }, false, selected.size === 0],
            ["Bulk Profile Change", () => setBulkOpen({ type: "protocolType" }), false, selected.size === 0],
          ].map(([label, action, comingSoon, disabled]) => (
            <button
              key={label}
              onClick={action || (() => notify(`${label}: Coming Soon`))}
              disabled={!!(comingSoon || disabled)}
              title={comingSoon ? "Coming Soon" : disabled ? "Select clients first" : label}
              className={`rounded-full px-3.5 py-2 text-xs font-semibold shadow-sm transition ${comingSoon || disabled ? "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500" : "bg-navy-900 text-white hover:bg-navy-800 dark:bg-navy-700"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {selected.size > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <button onClick={() => setSelected(new Set())} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium hover:bg-slate-50 dark:border-white/10 dark:bg-white/5">Clear selection</button>
            <span>{selected.size} row(s) selected — apply a bulk action above</span>
          </div>
        )}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 dark:border-white/5 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  ["Server", "server", [{ value: "", label: "Select" }]],
                  ["Protocol Type", "protocolType", [{ value: "", label: "Select" }, ...lookups.protocolTypes.map((x) => ({ value: x.name, label: x.name }))]],
                  ["Profiles", "profile", [{ value: "", label: "Select" }]],
                  ["Zone", "zone", [{ value: "", label: "Select" }, ...lookups.zones.map((x) => ({ value: x.name, label: x.name }))]],
                  ["Sub Zone", "subZone", [{ value: "", label: "Select" }, ...lookups.subZones.map((x) => ({ value: x.name, label: x.name }))]],
                  ["Box", "box", [{ value: "", label: "Select" }, ...lookups.boxes.map((x) => ({ value: x.name, label: x.name }))]],
                  ["Package", "package", [{ value: "", label: "Select" }, ...lookups.packages.map((x) => ({ value: x.name, label: x.name }))]],
                  ["Billing Status", "billingStatus", [{ value: "", label: "Select" }, ...lookups.billingStatuses.map((x) => ({ value: x.name, label: x.name }))]],
                  ["Payment Status", "paymentStatus", [{ value: "", label: "Select" }, { value: "paid", label: "Paid" }, { value: "due", label: "Due" }]],
                  ["Mikrotik Status", "mikrotikStatus", [{ value: "", label: "Select" }, { value: "online", label: "Online" }, { value: "offline", label: "Offline" }]],
                  ["Connection Type", "connectionType", [{ value: "", label: "Select" }, ...lookups.connTypes.map((x) => ({ value: x.name, label: x.name }))]],
                  ["Client Type", "clientType", [{ value: "", label: "Select" }, ...lookups.clientTypes.map((x) => ({ value: x.name, label: x.name }))]],
                ].map(([label, key, opts]) => (
                  <label key={String(key)} className="block">
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
                    <Dropdown value={filters[String(key)] || ""} options={opts} onChange={(v) => setFilters((f) => ({ ...f, [String(key)]: v }))} placeholder="Select" />
                  </label>
                ))}
                {[
                  ["From Ex. Date", "fromExDate"], ["To Ex. Date", "toExDate"],
                  ["From Effective To", "fromEffective"], ["To Effective To", "toEffective"],
                  ["From Non Effective To", "fromNonEffective"], ["To Non Effective To", "toNonEffective"],
                  ["From Date", "fromDate"], ["To Date", "toDate"],
                ].map(([label, key]) => (
                  <label key={String(key)} className="block">
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
                    <input type="date" className={input} value={filters[String(key)] || ""} onChange={(e) => setFilters((f) => ({ ...f, [String(key)]: e.target.value }))} />
                  </label>
                ))}
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Custom Status</span>
                  <Dropdown value={filters.customStatus || ""} options={[{ value: "", label: "Select" }, { value: "vip", label: "VIP" }, { value: "active", label: "Active" }]} onChange={(v) => setFilters((f) => ({ ...f, customStatus: v }))} placeholder="Select" />
                </label>
                <div className="col-span-2 flex items-end gap-2 sm:col-span-3 lg:col-span-6">
                  <button onClick={() => setFilters({ server: "", protocolType: "", profile: "", zone: "", subZone: "", box: "", package: "", billingStatus: "", paymentStatus: "", mikrotikStatus: "", connectionType: "", clientType: "", fromExDate: "", toExDate: "", fromEffective: "", toEffective: "", fromNonEffective: "", toNonEffective: "", customStatus: "", fromDate: "", toDate: "" })} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">Clear filters</button>
                  <span className="pb-2 text-xs text-slate-400">{filtered.length} / {rows.length} rows</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className={`${input} pl-9`} placeholder="Search customer / ID / zone..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <span className="text-xs text-slate-400">{filtered.length} entries</span>
      </div>

      {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-3"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="h-4 w-4 rounded border-slate-300" /></th>
                  <th className={th}>C.Code</th>
                  <th className={th}>ID/IP</th>
                  <th className={th}>Cus. Name</th>
                  <th className={th}>Mobile</th>
                  <th className={th}>Zone</th>
                  <th className={th}>Cus. Type</th>
                  <th className={th}>Conn. Type</th>
                  <th className={th}>Package</th>
                  <th className={th}>Speed</th>
                  <th className={th}>Ex. Date</th>
                  <th className={th}>M.Bill</th>
                  <th className={th}>Received</th>
                  <th className={th}>VAT</th>
                  <th className={th}>Balance Due</th>
                  <th className={th}>Advance</th>
                  <th className={th}>Pay Date</th>
                  <th className={th}>M.Status</th>
                  <th className={th}>B.Status</th>
                  <th className={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.012, 0.3) }}
                    className={`border-t border-slate-100 dark:border-white/5 ${selected.has(r.id) ? "bg-gold-500/5" : ""}`}>
                    <td className="px-3 py-3"><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} className="h-4 w-4 rounded border-slate-300" /></td>
                    <td className={`${td} font-mono text-xs`}>{String(r.id).padStart(4, "0")}</td>
                    <td className="px-3 py-3 whitespace-nowrap font-medium text-slate-700 dark:text-slate-200">{r.pppoe}</td>
                    <td className="px-3 py-3 whitespace-nowrap font-medium text-slate-700 dark:text-slate-200">{r.name}</td>
                    <td className={td}>{r.phone}</td>
                    <td className={td}>{r.zone || "—"}</td>
                    <td className={td}>{r.clientType || "—"}</td>
                    <td className={td}>{r.connectionType || "—"}</td>
                    <td className={td}>{r.package || "—"}</td>
                    <td className={td}>{r.speed || "—"}</td>
                    <td className={td}>{r.expiry || "—"}</td>
                    <td className="px-3 py-3 whitespace-nowrap font-semibold text-slate-700 dark:text-slate-200">{fmt(r.monthlyBill)}</td>
                    <td className="px-3 py-3 whitespace-nowrap font-semibold text-emerald-500">{r.received ? fmt(r.received) : "—"}</td>
                    <td className={td}>{r.vat || 0}</td>
                    <td className={`px-3 py-3 whitespace-nowrap font-semibold ${r.due > 0 ? "text-rose-500" : "text-slate-400"}`}>{r.due > 0 ? fmt(r.due) : "—"}</td>
                    <td className={td}>{r.advance ? fmt(r.advance) : "—"}</td>
                    <td className={td}>{r.lastPayment || "—"}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-slate-500">{r.server || "—"}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <button
                        onClick={async () => {
                          try { await toggleLine(r.id); await load(); }
                          catch (e) { notify(e.message); }
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${r.online ? "bg-sky-500" : "bg-slate-300 dark:bg-white/20"}`}
                        title={r.online ? "Online — click to disable" : "Offline — click to enable"}
                      >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${r.online ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap"><span className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle[r.status]}`}>{r.status}</span></td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openPay(r)} className="rounded-md bg-slate-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-slate-700">Pay</button>
                        <button onClick={() => doDue(r)} className="rounded-md bg-rose-500 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-rose-600">Due</button>
                        <div className="relative">
                          <button onClick={() => setMenuOpen(menuOpen === r.id ? null : r.id)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5">
                            <MoreVertical size={14} />
                          </button>
                          {menuOpen === r.id && (
                            <div className="absolute right-0 z-10 mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-navy-800">
                              <button onClick={() => { setMenuOpen(null); navigate(`/clients?search=${encodeURIComponent(r.name)}`); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5"><Eye size={14} /> View Client</button>
                              <button onClick={() => { setMenuOpen(null); openPay(r); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5"><CreditCard size={14} /> Collect Payment</button>
                              <button onClick={() => { setMenuOpen(null); navigate("/invoices"); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5"><FileSpreadsheet size={14} /> Invoices</button>
                              <button onClick={() => { setMenuOpen(null); navigate("/payments"); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5"><History size={14} /> Payments</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={20} className="py-12 text-center text-sm text-slate-400">Kono customer nei.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={genOpen} onClose={() => setGenOpen(false)} title="Generate Monthly Bills?" size="sm"
        footer={<><button onClick={() => setGenOpen(false)} className="btn-ghost">Cancel</button>
          <button onClick={runGenerate} disabled={gen} className="btn-gold">{gen ? <Loader2 size={15} className="animate-spin" /> : <FileStack size={15} />} Generate</button></>}>
        <p className="text-sm text-slate-500 dark:text-slate-300">Ei maase jader bill ekhono boshe nai, tader shobar jonno invoice toiri hobe ebong due barbe. Nishchit?</p>
      </Modal>

      <Modal open={!!payRow} onClose={() => setPayRow(null)} title={`Collect Payment — ${payRow?.name || ""}`} subtitle={payRow ? `${payRow.pppoe} · due ${fmt(payRow.due)}` : ""} size="sm"
        footer={<><button onClick={() => setPayRow(null)} className="btn-ghost">Cancel</button>
          <button onClick={doPay} disabled={payBusy} className="btn-gold">{payBusy ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />} Collect</button></>}>
        <div className="space-y-3">
          {payErr && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{payErr}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Amount (৳)</span>
            <input className={input} type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="500" autoFocus /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Method</span>
            <Dropdown value={payMethod} options={["Cash", "bKash", "Nagad", "Rocket", "Bank"]} onChange={setPayMethod} /></label>
        </div>
      </Modal>

      <Modal open={!!bulkOpen} onClose={() => setBulkOpen(null)} title={`Bulk ${bulkOpen?.type || ""}`} subtitle={`${selected.size} client(s) selected`} size="sm"
        footer={<><button onClick={() => setBulkOpen(null)} className="btn-ghost">Cancel</button>
          <button onClick={runBulk} disabled={bulkBusy} className="btn-gold">{bulkBusy ? <Loader2 size={15} className="animate-spin" /> : null} Apply</button></>}>
        <div className="space-y-3">
          {bulkErr && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{bulkErr}</p>}
          {bulkOpen?.type === "status" && (
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">New Status</span>
              <Dropdown value={bulkValue} options={["active", "due", "expired", "suspended"]} onChange={setBulkValue} placeholder="Select status" /></label>
          )}
          {bulkOpen?.type === "zone" && (
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">New Zone</span>
              <Dropdown value={bulkValue} options={lookups.zones.map((x) => x.name)} onChange={setBulkValue} placeholder="Select zone" /></label>
          )}
          {bulkOpen?.type === "package" && (
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">New Package</span>
              <Dropdown value={bulkValue} options={lookups.packages.map((x) => x.name)} onChange={setBulkValue} placeholder="Select package" /></label>
          )}
          {bulkOpen?.type === "subZone" && (
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">New Sub Zone / Thana</span>
              <Dropdown value={bulkValue} options={lookups.subZones.map((x) => x.name)} onChange={setBulkValue} placeholder="Select" /></label>
          )}
          {bulkOpen?.type === "connectionType" && (
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Connection Type</span>
              <Dropdown value={bulkValue} options={lookups.connTypes.map((x) => x.name)} onChange={setBulkValue} placeholder="Select" /></label>
          )}
          {bulkOpen?.type === "protocolType" && (
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Profile / Protocol Type</span>
              <Dropdown value={bulkValue} options={lookups.protocolTypes.map((x) => x.name)} onChange={setBulkValue} placeholder="Select" /></label>
          )}
          {bulkOpen?.type === "vip" && (
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">VIP</span>
              <Dropdown value={bulkValue} options={[{ value: "vip", label: "Mark VIP" }, { value: "non-vip", label: "Remove VIP" }]} onChange={setBulkValue} /></label>
          )}
          {bulkOpen?.type === "online" && <p className="text-sm text-slate-600 dark:text-slate-300">Set <b>{bulkValue === "online" ? "Enable (online)" : "Disable (offline)"}</b> for {selected.size} client(s)?</p>}
          {bulkOpen?.type === "billingStatus" && (
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Billing Status</span>
              <Dropdown value={bulkValue} options={lookups.billingStatuses.map((x) => x.name)} onChange={setBulkValue} placeholder="Select" /></label>
          )}
        </div>
      </Modal>
    </div>
  );
}
