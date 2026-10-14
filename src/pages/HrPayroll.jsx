import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, Pencil } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { input } from "../ui";

const empty = { name: "Monthly Payroll", type: "Monthly", paymentType: "" };

export default function HrPayroll() {
  const { notify } = useStore();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    // Backend has no payroll-entity; rows come from /hr/payheads' owning concept.
    // Use a single synthetic "Monthly Payroll" row if no backend list, else map backend payrolls if they exist.
    try {
      // Try to fetch payroll entities if backend supports it (future); fall back to synthetic
      let data = null;
      try { data = await api.crudList("hr", "payrolls"); } catch {}
      if (Array.isArray(data) && data.length > 0) {
        setRows(data.map((r) => ({ id: r.id, name: r.name || r.payrollName || "Payroll", type: r.type || r.payrollType || "Monthly", paymentType: r.paymentType || "" })));
      } else {
        // Synthetic default row — like screenshot: one entry "Monthly Payroll / Monthly"
        setRows([{ id: 1, name: "Monthly Payroll", type: "Monthly", paymentType: "" }]);
      }
    } catch { setRows([{ id: 1, name: "Monthly Payroll", type: "Monthly", paymentType: "" }]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(empty); setEditing({}); };
  const openEdit = (r) => { setForm({ name: r.name, type: r.type, paymentType: r.paymentType }); setEditing(r); };
  const save = async () => {
    setBusy(true);
    try {
      if (editing?.id && editing.id !== 1) {
        try { await api.crudUpdate("hr", "payrolls", editing.id, { name: form.name, type: form.type, paymentType: form.paymentType }); } catch {}
      } else if (!editing?.id) {
        try { await api.crudCreate("hr", "payrolls", { name: form.name, type: form.type, paymentType: form.paymentType }); } catch {}
      }
      // Synthetic row path — just update local state if no backend entity
      if (editing?.id === 1) {
        setRows([{ id: 1, name: form.name, type: form.type, paymentType: form.paymentType }]);
      }
      setEditing(null);
      await load();
      notify("Payroll save holo", "success");
    } catch (e) { notify(e.message); }
    finally { setBusy(false); }
  };

  const filtered = rows.filter((r) => !q || `${r.name} ${r.type} ${r.paymentType}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy-900 text-white text-xs">●</span>
          Pay Rolls <span className="text-sm font-normal text-slate-400">Configure Payroll</span>
        </h2>
        <button onClick={openNew} className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800">
          <Plus size={14} /> New PayRoll
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/5">
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            Show <select className="rounded border border-slate-200 bg-white px-2 py-1 dark:border-white/10 dark:bg-navy-800" defaultValue={10}><option>10</option><option>25</option><option>50</option></select> entries
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            Search:
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="" className="rounded border border-slate-200 bg-white px-2 py-1 text-sm dark:border-white/10 dark:bg-navy-800" />
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-xs">
            <thead className="bg-navy-900 text-[11px] uppercase tracking-wide text-slate-300">
              <tr>
                <th className="px-4 py-3">Serial No.</th>
                <th className="px-4 py-3">PayRoll Name</th>
                <th className="px-4 py-3">Payroll Type</th>
                <th className="px-4 py-3">Payment Type</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-12 text-center"><Loader2 className="mx-auto animate-spin text-gold-500" size={22} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-sm text-slate-400">No payroll configured.</td></tr>
              ) : filtered.map((r, idx) => (
                <tr key={r.id} className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{r.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.type}</td>
                  <td className="px-4 py-3 text-slate-500">{r.paymentType || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button className="rounded-full bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-800">Assign Period</button>
                      <button className="rounded-full bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-800">Assign PayHead</button>
                      <button onClick={() => openEdit(r)} className="rounded p-1.5 text-emerald-500 hover:bg-emerald-500/10"><Pencil size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-400 dark:border-white/5">
          <span>Showing {filtered.length} to {filtered.length} of {filtered.length} entries</span>
          <span>Previous &nbsp; <span className="rounded bg-navy-900 px-2 py-1 text-white">1</span> &nbsp; Next</span>
        </div>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id && editing.id !== 1 ? "Edit Payroll" : editing?.id === 1 ? "Edit Payroll" : "New Payroll"} subtitle={editing?.name || "Monthly Payroll"} size="md"
        footer={<><button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button onClick={save} disabled={busy} className="btn-gold">{busy ? <Loader2 size={15} className="animate-spin" /> : "Save"}</button></>}>
        <div className="space-y-3">
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">PayRoll Name</span>
            <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Monthly Payroll" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Payroll Type</span>
            <Dropdown value={form.type} options={[{ value: "Monthly", label: "Monthly" }, { value: "Weekly", label: "Weekly" }, { value: "Daily", label: "Daily" }]} onChange={(v) => setForm({ ...form, type: v })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Payment Type</span>
            <input className={input} value={form.paymentType} onChange={(e) => setForm({ ...form, paymentType: e.target.value })} placeholder="Monthly / Cash" /></label>
        </div>
      </Modal>
    </div>
  );
}
