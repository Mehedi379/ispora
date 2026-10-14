import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus, Trash2, Check, Search } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";
import Dropdown from "../components/Dropdown";
import Modal from "../components/Modal";
import { clientLabel } from "../data";

const today = () => new Date().toISOString().slice(0, 10);

export default function DailyCollection() {
  const { user, notify, clients } = useStore();
  const isAdmin = user?.role === "admin";
  const [from, setFrom] = useState("2026-10-12");
  const [to, setTo] = useState("2026-10-12");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [fUsername, setFUsername] = useState("All User");
  const [fReceivedBy, setFReceivedBy] = useState("");
  const [fApprovedBy, setFApprovedBy] = useState("");
  const [fCreatedBy, setFCreatedBy] = useState("");
  const [fTransStatus, setFTransStatus] = useState("");
  const [fPaymentMethod, setFPaymentMethod] = useState("");
  const [showReceive, setShowReceive] = useState(false);
  const [receiveForm, setReceiveForm] = useState({ clientId: "", amount: "", method: "Cash", note: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api.billingCollection({ from, to })); setErr(""); }
    catch (e) { setErr(e?.message || "Load fail"); }
    finally { setLoading(false); }
  }, [from, to]);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!data?.payments) return [];
    let out = data.payments;
    if (q) {
      const s = q.toLowerCase();
      out = out.filter((p) => `${p.username} ${p.client} ${p.phone} ${p.code}`.toLowerCase().includes(s));
    }
    if (fUsername !== "All User" && fUsername) out = out.filter((p) => p.username === fUsername);
    if (fPaymentMethod) out = out.filter((p) => p.method === fPaymentMethod);
    if (fTransStatus) {
      if (fTransStatus === "approved") out = out.filter((p) => p.approved);
      if (fTransStatus === "pending") out = out.filter((p) => !p.approved);
    }
    return out;
  }, [data, q, fUsername, fPaymentMethod, fTransStatus]);

  const toggleSelect = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.id)));
  };
  const bulkApprove = async () => {
    const ids = [...selected];
    if (ids.length === 0) { notify("Select transactions first."); return; }
    // If backend has approve endpoint, use it; else just notify
    for (const id of ids) { try { await api.approvePayment?.(id); } catch {} }
    setSelected(new Set()); await load(); notify(`${ids.length} transaction(s) approved.`);
  };
  const bulkDelete = async () => {
    const ids = [...selected];
    if (ids.length === 0) { notify("Select transactions first."); return; }
    for (const id of ids) { try { await api.voidPayment(id); } catch {} }
    setSelected(new Set()); await load(); notify(`${ids.length} transaction(s) deleted.`);
  };
  const saveReceive = async () => {
    if (!receiveForm.clientId || !receiveForm.amount) { notify("Client and amount required."); return; }
    try {
      await api.collectPayment({ clientId: Number(receiveForm.clientId), amount: Number(receiveForm.amount), method: receiveForm.method, note: receiveForm.note });
      setShowReceive(false); setReceiveForm({ clientId: "", amount: "", method: "Cash", note: "" });
      await load(); notify("Bill received.", "success");
    } catch (e) { notify(e.message); }
  };
  const exportCsv = () => {
    const cols = ["Date", "C.Code", "UserName", "Cus.Name", "MobileNo.", "Note/Remarks", "M.Bill", "Received", "VAT", "Discount", "BalanceDue", "PaymentMethod", "ReceivedBy", "ApprovedBy", "CreatedBy"];
    const lines = [cols.join(",")];
    for (const p of filtered) {
      const vals = [
        `${p.date} ${p.time || ""}`.trim(), p.code || "", p.username || "", p.client || "", p.phone || "", p.note || "",
        String(p.mBill ?? p.bill ?? 0), String(p.amount ?? 0), String(p.vat ?? 0), String(p.discount ?? 0), String(p.balanceDue ?? p.due ?? 0),
        p.method || "", p.collectedBy || "", p.approvedBy || "", p.createdBy || "",
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(vals.join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `daily-collection-${from}_to_${to}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-slate-800 dark:text-white">Daily Bill Collection <span className="text-sm font-normal text-slate-400">All Daily Collected Bills</span></h2>
      </div>

      {/* Collected Bills badge + stat cards — like screenshot */}
      <div className="card p-4">
        <div className="mb-4 flex items-center gap-2">
          <span className="rounded-full bg-navy-900 px-3 py-1 text-xs font-semibold text-white dark:bg-navy-700">Collected Bills</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Recieve", value: 0, sub: "Monthly paid client", grad: "from-sky-500 to-blue-600", icon: "৳" },
            { label: "Discount", value: 0, sub: "Monthly unpaid client", grad: "from-teal-500 to-emerald-500", icon: "◐" },
            { label: "Due", value: 0, sub: "Monthly recived bill", grad: "from-violet-500 to-indigo-500", icon: "◑" },
          ].map((t) => (
            <div key={t.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${t.grad} p-4 text-white shadow-lg`}>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 text-lg">{t.icon}</div>
                <div>
                  <p className="text-sm font-semibold">{t.label}</p>
                  <p className="font-display text-xl font-bold">{t.value}</p>
                </div>
              </div>
              <p className="mt-2 text-[11px] opacity-80">{t.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top actions + filters — like screenshot */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button onClick={exportCsv} className="rounded-full bg-navy-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-800">Generate CSV</button>
            <button onClick={() => window.print()} className="rounded-full bg-navy-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-800">Generate PDF</button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowReceive(true)} className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-800">
              <Plus size={14} /> Recieve Bill
            </button>
            <button onClick={bulkApprove} className="rounded-full bg-navy-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-800">Approve Selected Transaction</button>
            <button onClick={bulkDelete} className="rounded-full bg-navy-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-800">Delete Selected Transaction</button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Username</span>
            <Dropdown value={fUsername} options={[{ value: "All User", label: "All User" }, ...clients.map((c) => ({ value: c.pppoe, label: c.pppoe }))]} onChange={setFUsername} placeholder="All User" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">From Date</span>
            <input type="date" className={input} value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">To Date</span>
            <input type="date" className={input} value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Received By</span>
            <Dropdown value={fReceivedBy} options={[{ value: "", label: "" }]} onChange={setFReceivedBy} placeholder="" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Approved By</span>
            <Dropdown value={fApprovedBy} options={[{ value: "", label: "Select" }]} onChange={setFApprovedBy} placeholder="Select" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Created By</span>
            <Dropdown value={fCreatedBy} options={[{ value: "", label: "Select" }]} onChange={setFCreatedBy} placeholder="Select" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Trans. Status</span>
            <Dropdown value={fTransStatus} options={[{ value: "", label: "Select" }, { value: "approved", label: "Approved" }, { value: "pending", label: "Pending" }]} onChange={setFTransStatus} placeholder="Select" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Payment Method</span>
            <Dropdown value={fPaymentMethod} options={[{ value: "", label: "Select" }, { value: "Cash", label: "Cash" }, { value: "bKash", label: "bKash" }, { value: "Nagad", label: "Nagad" }, { value: "Bank", label: "Bank" }]} onChange={setFPaymentMethod} placeholder="Select" />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-white/5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            SHOW <select className="rounded border border-slate-200 bg-white px-2 py-1 dark:border-white/10 dark:bg-navy-800" defaultValue={25}><option>25</option><option>10</option><option>50</option></select> ENTRIES
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className={`${input} h-8 pl-7 text-xs`} />
          </div>
        </div>
      </div>

      {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-xs">
              <thead className="bg-navy-900 text-[11px] uppercase tracking-wide text-slate-300">
                <tr>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">C.Code</th>
                  <th className="px-3 py-3">UserName</th>
                  <th className="px-3 py-3">Cus.Name</th>
                  <th className="px-3 py-3">MobileNo.</th>
                  <th className="px-3 py-3">Note/Remarks</th>
                  <th className="px-3 py-3 text-right">M.Bill</th>
                  <th className="px-3 py-3 text-right">Received</th>
                  <th className="px-3 py-3 text-right">VAT</th>
                  <th className="px-3 py-3 text-right">Discount</th>
                  <th className="px-3 py-3 text-right">BalanceDue</th>
                  <th className="px-3 py-3">PaymentMethod</th>
                  <th className="px-3 py-3">ReceivedBy</th>
                  <th className="px-3 py-3">ApprovedBy</th>
                  <th className="px-3 py-3">CreatedBy</th>
                  <th className="px-3 py-3 text-right">Action</th>
                  <th className="px-3 py-3 text-center"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="h-4 w-4 rounded" /></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={17} className="py-10 text-center text-sm text-slate-400">No data available in table</td></tr>
                ) : filtered.map((p, i) => (
                  <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.015, 0.3) }}
                    className={`border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 ${selected.has(p.id) ? "bg-gold-500/5" : ""}`}>
                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-500 dark:text-slate-400">{p.date} <span className="text-[11px] text-slate-400">{p.time || ""}</span></td>
                    <td className="px-3 py-2.5 font-mono text-slate-500">{p.code}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-700 dark:text-slate-200">{p.username || "—"}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-700 dark:text-slate-200">{p.client}</td>
                    <td className="px-3 py-2.5 text-slate-500">{p.phone || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-500">{p.note || "—"}</td>
                    <td className="px-3 py-2.5 text-right text-slate-500">{p.mBill ?? p.bill ?? "—"}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-emerald-600">{p.amount != null ? `৳${Number(p.amount).toLocaleString()}` : "—"}</td>
                    <td className="px-3 py-2.5 text-right text-slate-500">{p.vat ?? 0}</td>
                    <td className="px-3 py-2.5 text-right text-slate-500">{p.discount ?? 0}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-rose-500">{p.balanceDue != null ? p.balanceDue.toLocaleString() : (p.due ?? 0).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-slate-500">{p.method}</td>
                    <td className="px-3 py-2.5 text-slate-500">{p.collectedBy || p.receivedBy || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-500">{p.approvedBy || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-500">{p.createdBy || p.collectedBy || "—"}</td>
                    <td className="px-3 py-2.5 text-right">
                      <button onClick={() => { if (isAdmin) api.voidPayment(p.id).then(() => load()).catch((e) => notify(e.message)); }} className="rounded p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={13} /></button>
                    </td>
                    <td className="px-3 py-2.5 text-center"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="h-4 w-4 rounded" /></td>
                  </motion.tr>
                ))}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold dark:border-white/10 dark:bg-white/5">
                    <td colSpan={6} className="px-3 py-2.5 text-right text-slate-700 dark:text-slate-200">TOTAL</td>
                    <td className="px-3 py-2.5 text-right text-slate-700 dark:text-slate-200">{filtered.reduce((s, p) => s + (Number(p.mBill ?? p.bill ?? 0) || 0), 0).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right text-emerald-600">{filtered.reduce((s, p) => s + (Number(p.amount) || 0), 0).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right text-slate-500">{filtered.reduce((s, p) => s + (Number(p.vat) || 0), 0).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right text-slate-500">{filtered.reduce((s, p) => s + (Number(p.discount) || 0), 0).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right text-rose-500">{filtered.reduce((s, p) => s + (Number(p.balanceDue ?? p.due ?? 0) || 0), 0).toLocaleString()}</td>
                    <td colSpan={6}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-400 dark:border-white/5">
            <span>Showing {filtered.length} of {data?.payments?.length ?? 0} entries</span>
            <span>Previous &nbsp; 1 &nbsp; Next</span>
          </div>
        </div>
      )}

      <Modal open={showReceive} onClose={() => setShowReceive(false)} title="Recieve Bill" subtitle="Collect a payment" size="md"
        footer={<><button onClick={() => setShowReceive(false)} className="btn-ghost">Cancel</button><button onClick={saveReceive} className="btn-gold">Collect</button></>}>
        <div className="space-y-3">
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Client</span>
            <Dropdown value={receiveForm.clientId} options={clients.map((c) => ({ value: c.id, label: clientLabel(c) }))} onChange={(v) => setReceiveForm((f) => ({ ...f, clientId: v || "" }))} placeholder="Select client" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Amount (৳)</span>
              <input type="number" className={input} value={receiveForm.amount} onChange={(e) => setReceiveForm((f) => ({ ...f, amount: e.target.value }))} placeholder="500" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Method</span>
              <Dropdown value={receiveForm.method} options={["Cash", "bKash", "Nagad", "Rocket", "Bank"]} onChange={(v) => setReceiveForm((f) => ({ ...f, method: v }))} /></label>
          </div>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Note</span>
            <input className={input} value={receiveForm.note} onChange={(e) => setReceiveForm((f) => ({ ...f, note: e.target.value }))} placeholder="Optional" /></label>
        </div>
      </Modal>
    </div>
  );
}
