import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Check, X, Trash2, Loader2, UserPlus, Search } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

const reqStatusStyle = {
  pending: "text-amber-500 bg-amber-500/10",
  approved: "text-emerald-500 bg-emerald-500/10",
  rejected: "text-rose-500 bg-rose-500/10",
};

export default function NewRequests() {
  const { user, notify, refreshClients } = useStore();
  const isAdmin = user?.role === "admin";
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({});
  const [packages, setPackages] = useState([]);
  const [connTypes, setConnTypes] = useState([]);
  const [clientTypes, setClientTypes] = useState([]);
  const [zones, setZones] = useState([]);
  const [subZones, setSubZones] = useState([]);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  // Screenshot-style top filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [setupStatus, setSetupStatus] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [createdBy, setCreatedBy] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [reqs, pkgs, cts, clts, zs, szs] = await Promise.all([
        api.listRequests(filter === "all" ? undefined : filter),
        api.listPackages().catch(() => []),
        api.listConfig("connection-types").catch(() => []),
        api.listConfig("client-types").catch(() => []),
        api.listConfig("zones").catch(() => []),
        api.listConfig("sub-zones").catch(() => []),
      ]);
      setList(reqs);
      setPackages(pkgs);
      setConnTypes(cts);
      setClientTypes(clts);
      setZones(zs);
      setSubZones(szs);
      setErr("");
    } catch (e) { setErr(e?.message || "Load fail"); }
    finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setErr("");
    try { await api.createRequest(form); setAdding(false); setForm({}); await load(); }
    catch (e) { setErr(e.message); }
  };

  const approve = async (row) => {
    setBusy(row.id);
    try { await api.approveRequest(row.id); await load(); await refreshClients?.(); notify("Approve holo — notun customer toiri", "success"); }
    catch (e) { notify(e.message); }
    finally { setBusy(null); }
  };
  const reject = async (row) => {
    setBusy(row.id);
    try { await api.rejectRequest(row.id); await load(); }
    catch (e) { notify(e.message); }
    finally { setBusy(null); }
  };
  const remove = async (row) => {
    setBusy(row.id);
    try { await api.deleteRequest(row.id); await load(); }
    catch (e) { notify(e.message); }
    finally { setBusy(null); }
  };

  const filtered = list.filter((r) => {
    if (q && !`${r.name} ${r.phone} ${r.area} ${r.package} ${r.pppoe}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (fromDate) {
      const d = new Date(r.createdAt);
      if (d < new Date(fromDate)) return false;
    }
    if (toDate) {
      const d = new Date(r.createdAt);
      if (d > new Date(`${toDate}T23:59:59`)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Client Request</h2>
          <p className="text-sm text-slate-400">New Client Request — still pending / needs setup</p>
        </div>
        <button onClick={() => { setForm({}); setErr(""); setAdding(true); }} className="btn-gold"><Plus size={16} /> Client Request</button>
      </div>

      {/* Top filter bar — like screenshot */}
      <div className="card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">From Date</span>
            <input type="date" className={input} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">To Date</span>
            <input type="date" className={input} value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Setup Status</span>
            <Dropdown value={setupStatus} options={[{ value: "", label: "Select" }, { value: "pending", label: "Pending" }, { value: "done", label: "Done" }]} onChange={setSetupStatus} placeholder="Select" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Setup By / Assign To</span>
            <Dropdown value={assignTo} options={[{ value: "", label: "Select" }]} onChange={setAssignTo} placeholder="Select" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Created By</span>
            <Dropdown value={createdBy} options={[{ value: "", label: "Select" }]} onChange={setCreatedBy} placeholder="Select" />
          </label>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-2">
            {["pending", "approved", "rejected", "all"].map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${filter === s ? "bg-gold-500/20 text-gold-500" : "text-slate-400 hover:bg-white/5"}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="relative hidden sm:block">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className={`${input} h-8 pl-8 text-xs`} />
          </div>
        </div>
      </div>

      {err && !adding && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/5">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>SHOW</span>
              <span className="rounded border border-slate-200 px-2 py-1 dark:border-white/10">10</span>
              <span>ENTRIES</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              SEARCH: <span className="rounded border border-slate-200 px-2 py-1 dark:border-white/10">—</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-xs">
              <thead className="bg-navy-900 text-[11px] uppercase tracking-wide text-slate-300">
                <tr>
                  <th className="px-3 py-3">SN</th>
                  <th className="px-3 py-3">Cus.Name</th>
                  <th className="px-3 py-3">Mobile</th>
                  <th className="px-3 py-3">Address</th>
                  <th className="px-3 py-3">Zone</th>
                  <th className="px-3 py-3">Subzone</th>
                  <th className="px-3 py-3">Cus.Type</th>
                  <th className="px-3 py-3">Conn.Type</th>
                  <th className="px-3 py-3">Package</th>
                  <th className="px-3 py-3">M.Bill</th>
                  <th className="px-3 py-3">B.Date</th>
                  <th className="px-3 py-3">OTC(Conn.Charge)</th>
                  <th className="px-3 py-3">Phy.Connectivity</th>
                  <th className="px-3 py-3">Created By</th>
                  <th className="px-3 py-3">Created On</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">SetUp By</th>
                  <th className="px-3 py-3">SetUp Time</th>
                  <th className="px-3 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan={19} className="py-10 text-center text-sm text-slate-400">No data available in table</td></tr>
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
              <span>SHOW</span>
              <span className="rounded border border-slate-200 px-2 py-1 dark:border-white/10">10</span>
              <span>ENTRIES</span>
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
                  <th className="px-3 py-3">SN</th>
                  <th className="px-3 py-3">Cus.Name</th>
                  <th className="px-3 py-3">Mobile</th>
                  <th className="px-3 py-3">Address</th>
                  <th className="px-3 py-3">Zone</th>
                  <th className="px-3 py-3">Subzone</th>
                  <th className="px-3 py-3">Cus.Type</th>
                  <th className="px-3 py-3">Conn.Type</th>
                  <th className="px-3 py-3">Package</th>
                  <th className="px-3 py-3">M.Bill</th>
                  <th className="px-3 py-3">B.Date</th>
                  <th className="px-3 py-3">OTC</th>
                  <th className="px-3 py-3">Phy.Connectivity</th>
                  <th className="px-3 py-3">Created By</th>
                  <th className="px-3 py-3">Created On</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">SetUp By</th>
                  <th className="px-3 py-3">SetUp Time</th>
                  <th className="px-3 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, idx) => (
                  <motion.tr key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.015 }}
                    className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="px-3 py-2.5 text-slate-500">{idx + 1}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-700 dark:text-slate-200">{row.name}</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{row.phone}</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{row.address || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{row.area || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">—</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">—</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">—</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{row.package || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{packages.find((p) => p.name === row.package)?.price ?? "—"}</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">—</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">—</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">—</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">—</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{new Date(row.createdAt).toLocaleDateString("en-GB")}</td>
                    <td className="px-3 py-2.5"><span className={`rounded px-2 py-1 text-[11px] font-semibold capitalize ${reqStatusStyle[row.status]}`}>{row.status}</span></td>
                    <td className="px-3 py-2.5 text-slate-500">—</td>
                    <td className="px-3 py-2.5 text-slate-500">—</td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1.5">
                        {isAdmin && row.status === "pending" && (
                          <>
                            <button onClick={() => approve(row)} disabled={busy === row.id}
                              className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-500/20 disabled:opacity-50">
                              {busy === row.id ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Approve
                            </button>
                            <button onClick={() => reject(row)} disabled={busy === row.id}
                              className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-600 hover:bg-amber-500/20 disabled:opacity-50">
                              <X size={11} /> Reject
                            </button>
                          </>
                        )}
                        {isAdmin && (
                          <button onClick={() => remove(row)} disabled={busy === row.id}
                            className="rounded p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={13} /></button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-400 dark:border-white/5">
            <span>Showing {filtered.length} of {filtered.length} entries</span>
            <span className="text-slate-500">{filtered.length} row(s)</span>
          </div>
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="New Connection Request" subtitle="Notun connection er abedon" size="lg"
        footer={<><button onClick={() => setAdding(false)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Submit</button></>}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {err && <p className="col-span-full rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Customer Name <span className="text-rose-500">*</span></span>
            <input className={input} value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Mobile <span className="text-rose-500">*</span></span>
            <input className={input} value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Address</span>
            <input className={input} value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="House, road, area" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Zone / Area</span>
            <Dropdown value={form.area || ""} options={zones.map((z) => z.name)} onChange={(v) => setForm({ ...form, area: v || "" })} placeholder="Select zone" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Subzone</span>
            <Dropdown value={form.subzone || ""} options={subZones.map((z) => z.name)} onChange={(v) => setForm({ ...form, subzone: v || "" })} placeholder="Select subzone" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Customer Type</span>
            <Dropdown value={form.customerType || ""} options={clientTypes.map((c) => c.name)} onChange={(v) => setForm({ ...form, customerType: v || "" })} placeholder="Select" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Connection Type</span>
            <Dropdown value={form.connectionType || ""} options={connTypes.map((c) => c.name)} onChange={(v) => setForm({ ...form, connectionType: v || "" })} placeholder="Select" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Package</span>
            <Dropdown value={form.package || ""} options={packages.map((p) => ({ value: p.name, label: `${p.name} — ৳${p.price}` }))} onChange={(v) => setForm({ ...form, package: v || "" })} placeholder="Select package" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">PPPoE Username</span>
            <input className={input} value={form.pppoe || ""} onChange={(e) => setForm({ ...form, pppoe: e.target.value })} placeholder="user1234" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Monthly Bill</span>
            <input className={input} type="number" value={form.monthlyBill || ""} onChange={(e) => setForm({ ...form, monthlyBill: e.target.value })} placeholder="Package price" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Billing Date</span>
            <input className={input} type="date" value={form.billingDate || ""} onChange={(e) => setForm({ ...form, billingDate: e.target.value })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">OTC (Conn. Charge)</span>
            <input className={input} type="number" value={form.otc || ""} onChange={(e) => setForm({ ...form, otc: e.target.value })} placeholder="0" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Physical Connectivity</span>
            <input className={input} value={form.physicalConnectivity || ""} onChange={(e) => setForm({ ...form, physicalConnectivity: e.target.value })} placeholder="Fiber / Wireless / UTP" /></label>
          <label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Note</span>
            <input className={input} value={form.note || ""} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional note" /></label>
        </div>
      </Modal>
    </div>
  );
}
