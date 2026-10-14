import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Check, X, Trash2, Loader2, Repeat, Search } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";
import { clientLabel } from "../data";

const stStyle = { pending: "text-amber-500 bg-amber-500/10", approved: "text-emerald-500 bg-emerald-500/10", rejected: "text-rose-500 bg-rose-500/10" };

export default function ChangeRequests() {
  const { user, notify, clients, refreshClients } = useStore();
  const isAdmin = user?.role === "admin";
  const [list, setList] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ clientId: "", type: "package", detail: "", note: "" });
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [learn, setLearn] = useState(false);
  const [fType, setFType] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fFromDate, setFFromDate] = useState("2026-10-01");
  const [fToDate, setFToDate] = useState("2026-10-12");
  const [fOccurring, setFOccurring] = useState("");
  const [selected, setSelected] = useState(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, pkgs] = await Promise.all([
        api.listChangeRequests(filter === "all" ? undefined : filter),
        api.listPackages().catch(() => []),
      ]);
      setList(rows); setPackages(pkgs); setErr("");
    } catch (e) { setErr(e?.message || "Load fail"); }
    finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  const filtered = list.filter((r) => {
    if (q && !`${r.client} ${r.detail} ${r.type}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (fType && r.type !== fType) return false;
    if (fStatus && r.status !== fStatus) return false;
    return true;
  });
  const toggleSelect = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  };
  const bulkApprove = async () => {
    const ids = [...selected].filter((id) => filtered.find((r) => r.id === id)?.status === "pending");
    if (ids.length === 0) { notify("Approve korar moto pending request nei."); return; }
    for (const id of ids) { try { await api.approveChangeRequest(id); } catch {} }
    setSelected(new Set()); await load(); await refreshClients?.(); notify(`${ids.length} request approved.`, "success");
  };
  const bulkCancel = async () => {
    const ids = [...selected];
    if (ids.length === 0) { notify("Select korun."); return; }
    for (const id of ids) { try { await api.rejectChangeRequest(id); } catch {} }
    setSelected(new Set()); await load(); notify(`${ids.length} request cancelled.`);
  };
  const exportCsv = () => {
    const cols = ["Code", "ID/IP", "Name", "Mobile", "Zone", "CurrentPackage", "RequestedPackage", "CurrentBillDate", "RequestedBillDate", "Remarks/Note", "CreatedBy", "CreatedDate", "OccurringDate", "Status"];
    const lines = [cols.join(",")];
    for (const r of filtered) {
      const vals = [
        String(r.id).padStart(4, "0"), r.clientPppoe || "", r.client || "", r.phone || "", r.zone || "",
        r.currentPackage || "", r.detail || "", r.currentBillDate || "", r.requestedBillDate || "", r.note || "",
        r.createdBy || "", r.createdAt || "", r.occurringDate || "", r.status || "",
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(vals.join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `change-requests-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const save = async () => {
    setErr("");
    try { await api.createChangeRequest(form); setAdding(false); setForm({ clientId: "", type: "package", detail: "", note: "" }); await load(); }
    catch (e) { setErr(e.message); }
  };
  const approve = async (row) => {
    setBusy(row.id);
    try { await api.approveChangeRequest(row.id); await load(); await refreshClients?.(); notify("Approve holo", "success"); }
    catch (e) { notify(e.message); } finally { setBusy(null); }
  };
  const act = async (fn, row, ok) => {
    setBusy(row.id);
    try { await fn(row.id); await load(); if (ok) notify(ok, "success"); }
    catch (e) { notify(e.message); } finally { setBusy(null); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-800 dark:text-white">Change Request <span className="text-sm font-normal text-slate-400">(Package & Exp. Date)</span></h2>
        </div>
      </div>

      {/* Learn banner — like screenshot */}
      <div className="card p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Learn what will happen after changes request approval?</p>
          <button
            onClick={() => setLearn((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${learn ? "bg-sky-500" : "bg-slate-300 dark:bg-white/20"}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${learn ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
        {learn && (
          <div className="mt-3 rounded-xl bg-sky-500/10 p-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Approve korle client er package / expiry / bill date poroborti billing cycle theke apply hobe. Rejected hole kono change hobe na.
          </div>
        )}
      </div>

      {/* Filter + top actions — like screenshot */}
      <div className="card p-4">
        <div className="flex flex-wrap justify-end gap-2">
          <button onClick={bulkCancel} className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-800 dark:bg-navy-700">Cancel Request</button>
          <button onClick={bulkApprove} className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-800 dark:bg-navy-700">Approve Request</button>
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-800 dark:bg-navy-700">Generate PDF</button>
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-800 dark:bg-navy-700">Generate CSV</button>
          <button onClick={() => { setForm({ clientId: "", type: "package", detail: "", note: "" }); setErr(""); setAdding(true); }} className="inline-flex items-center gap-1.5 rounded-full bg-gold-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-gold-600">
            <Plus size={14} /> New
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Request Type</span>
            <Dropdown value={fType} options={[{ value: "", label: "Select" }, { value: "package", label: "Package" }, { value: "info", label: "Info" }, { value: "other", label: "Other" }]} onChange={setFType} placeholder="Select" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Request Status</span>
            <Dropdown value={fStatus} options={[{ value: "", label: "Select" }, { value: "pending", label: "Pending" }, { value: "approved", label: "Approved" }, { value: "rejected", label: "Rejected" }]} onChange={setFStatus} placeholder="Select" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">From Date</span>
            <input type="date" className={input} value={fFromDate} onChange={(e) => setFFromDate(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">To Date</span>
            <input type="date" className={input} value={fToDate} onChange={(e) => setFToDate(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Occurring Date</span>
            <input type="date" className={input} value={fOccurring} onChange={(e) => setFOccurring(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Created By</span>
            <Dropdown value="" options={[{ value: "", label: "Select" }]} onChange={() => {}} placeholder="Select" />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {["pending", "approved", "rejected", "all"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${filter === s ? "bg-gold-500/20 text-gold-500" : "text-slate-400 hover:bg-white/5"}`}>{s}</button>
          ))}
          <span className="ml-auto flex items-center gap-2 text-xs text-slate-400">
            SHOW <select className="rounded border border-slate-200 bg-white px-2 py-1 dark:border-white/10 dark:bg-navy-800" defaultValue={25}><option>25</option><option>10</option><option>50</option></select> ENTRIES
          </span>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className={`${input} h-8 pl-7 text-xs`} />
          </div>
        </div>
      </div>

      {err && !adding && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-xs">
              <thead className="bg-navy-900 text-[11px] uppercase tracking-wide text-slate-300">
                <tr>
                  <th className="px-3 py-3">Code</th>
                  <th className="px-3 py-3">ID/IP</th>
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Mobile</th>
                  <th className="px-3 py-3">Zone</th>
                  <th className="px-3 py-3">CurrentPackage</th>
                  <th className="px-3 py-3">RequestedPackage</th>
                  <th className="px-3 py-3">CurrentBillDate</th>
                  <th className="px-3 py-3">RequestedBillDate</th>
                  <th className="px-3 py-3">Remarks/Note</th>
                  <th className="px-3 py-3">CreatedBy</th>
                  <th className="px-3 py-3">CreatedDate</th>
                  <th className="px-3 py-3">OccurringDate</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-center"><input type="checkbox" disabled className="h-4 w-4 rounded opacity-40" /></th>
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan={15} className="py-10 text-center text-sm text-slate-400">No data available in table</td></tr>
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-400 dark:border-white/5">
            <span>Showing 0 to 0 of 0 entries</span>
            <span>Previous &nbsp; Next</span>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/5">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              SHOW <select className="rounded border border-slate-200 bg-white px-2 py-1 dark:border-white/10 dark:bg-navy-800" defaultValue={25}><option>25</option><option>10</option><option>50</option></select> ENTRIES
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
                  <th className="px-3 py-3">Code</th>
                  <th className="px-3 py-3">ID/IP</th>
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Mobile</th>
                  <th className="px-3 py-3">Zone</th>
                  <th className="px-3 py-3">CurrentPackage</th>
                  <th className="px-3 py-3">RequestedPackage</th>
                  <th className="px-3 py-3">CurrentBillDate</th>
                  <th className="px-3 py-3">RequestedBillDate</th>
                  <th className="px-3 py-3">Remarks/Note</th>
                  <th className="px-3 py-3">CreatedBy</th>
                  <th className="px-3 py-3">CreatedDate</th>
                  <th className="px-3 py-3">OccurringDate</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-center"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="h-4 w-4 rounded" /></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <motion.tr key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }} className={`border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 ${selected.has(row.id) ? "bg-gold-500/5" : ""}`}>
                    <td className="px-3 py-2.5 font-mono text-slate-400">{String(row.id).padStart(4, "0")}</td>
                    <td className="px-3 py-2.5 font-medium text-gold-500">{row.clientPppoe || "—"}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-700 dark:text-slate-200">{row.client}</td>
                    <td className="px-3 py-2.5 text-slate-500">{row.phone || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-500">{row.zone || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-500">{row.currentPackage || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-700 dark:text-slate-200">{row.detail || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-500">{row.currentBillDate || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-500">{row.requestedBillDate || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-500">{row.note || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-500">{row.createdBy || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-500">{row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-GB") : "—"}</td>
                    <td className="px-3 py-2.5 text-slate-500">{row.occurringDate || "—"}</td>
                    <td className="px-3 py-2.5"><span className={`rounded px-2 py-1 text-[11px] font-semibold capitalize ${stStyle[row.status]}`}>{row.status}</span></td>
                    <td className="px-3 py-2.5 text-center"><input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleSelect(row.id)} className="h-4 w-4 rounded" /></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-400 dark:border-white/5">
            <span>Showing {filtered.length} of {list.length} entries</span>
            <span className="rounded bg-navy-900 px-2 py-1 text-white">1</span>
          </div>
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="New Change Request" subtitle="Client er package/info change" size="lg"
        footer={<><button onClick={() => setAdding(false)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Submit</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Client</span>
            <Dropdown value={form.clientId} options={clients.map((c) => ({ value: c.id, label: clientLabel(c) }))} onChange={(v) => setForm({ ...form, clientId: v || "" })} placeholder="Client select korun" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Type</span>
            <Dropdown value={form.type} options={[{ value: "package", label: "Package change" }, { value: "info", label: "Info change" }, { value: "other", label: "Other" }]} onChange={(v) => setForm({ ...form, type: v, detail: "" })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">{form.type === "package" ? "New Package" : "Detail"}</span>
            {form.type === "package" ? (
              <Dropdown value={form.detail} options={packages.map((p) => ({ value: p.name, label: `${p.name} (৳${p.price})` }))} onChange={(v) => setForm({ ...form, detail: v || "" })} placeholder="Package" />
            ) : (
              <input className={input} value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} placeholder="Ki change korte chay" />
            )}</label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Note</span>
            <input className={input} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional" /></label>
        </div>
      </Modal>
    </div>
  );
}
