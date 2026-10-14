import { useState, useEffect, useCallback } from "react";
import { Loader2, Search } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";
import Dropdown from "../components/Dropdown";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function HrSalarySheet() {
  const { notify } = useStore();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [tab, setTab] = useState("payment"); // payment | payroll | employee
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  // Screenshot-style filters
  const [payrollType, setPayrollType] = useState("All Payroll Types");
  const [periods, setPeriods] = useState("All Periods");
  const [employee, setEmployee] = useState("All Employee");
  const [paidBy, setPaidBy] = useState("All Users");
  const [fromDate, setFromDate] = useState("2026-10-12");
  const [toDate, setToDate] = useState("2026-10-12");

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api.hrSalarySheet(month, year)); }
    catch (e) { notify(e.message); }
    finally { setLoading(false); }
  }, [month, year, notify]);
  useEffect(() => { load(); }, [load]);

  const t = data?.totals;
  const filtered = (data?.rows || []).filter((p) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return `${p.employee} ${p.department}`.toLowerCase().includes(s);
  });

  const exportCsv = () => {
    const cols = ["Date", "Employee Id", "Employee Name", "Salary Period", "Net Salary", "Paid Salary", "Remarks", "Paid By"];
    const lines = [cols.join(",")];
    for (const p of filtered) {
      const vals = [
        p.month && p.year ? `${String(p.month).padStart(2, "0")}/${p.year}` : "", `E${String(p.employeeId || "").padStart(4, "0")}`, p.employee || "", `${MONTHS[(p.month || 1) - 1]} ${p.year || ""}`,
        String(p.net ?? 0), String(p.status === "paid" ? p.net : 0), p.note || "", p.paidBy || "",
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(vals.join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `salary-sheet-${year}-${String(month).padStart(2, "0")}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <h2 className="font-display text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy-900 text-white text-xs">▦</span>
        Salary <span className="text-sm font-normal text-slate-400">View Salary List</span>
      </h2>

      <div className="card overflow-hidden">
        {/* Tabs — like screenshot */}
        <div className="flex gap-4 border-b border-slate-100 px-4 pt-3 text-sm dark:border-white/5">
          {[
            ["Salary Payment History", "payment"],
            ["Payroll wise salary sheet", "payroll"],
            ["Employee wise salary sheet", "employee"],
          ].map(([label, key]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`border-b-2 px-1 pb-2 font-medium transition ${tab === key ? "border-navy-900 text-navy-900 dark:border-white dark:text-white" : "border-transparent text-slate-400 hover:text-slate-600"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Payroll Type :</span>
              <Dropdown value={payrollType} options={["All Payroll Types", "Monthly Payroll"]} onChange={setPayrollType} />
            </label>
            <label className="block">
              <span className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Periods : <span className="grid h-4 w-4 place-items-center rounded-full bg-navy-900 text-[10px] text-white">i</span></span>
              <Dropdown value={periods} options={["All Periods", ...MONTHS.map((m) => `${m} ${year}`)]} onChange={(v) => {
                setPeriods(v);
                const idx = MONTHS.findIndex((m) => v.startsWith(m));
                if (idx >= 0) setMonth(idx + 1);
              }} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Employee :</span>
              <Dropdown value={employee} options={["All Employee", ...(data?.rows?.map((r) => r.employee) ?? [])]} onChange={setEmployee} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Paid By :</span>
              <Dropdown value={paidBy} options={["All Users"]} onChange={setPaidBy} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">From Date :</span>
              <input type="date" className={input} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">To Date :</span>
              <input type="date" className={input} value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </label>
            <div className="flex items-end justify-end gap-2 lg:col-span-2">
              <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded bg-sky-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-600">
                Generate PDF
              </button>
              <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded bg-sky-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-600">
                Generate Excel
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-white/5">
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              SHOW <select className="rounded border border-slate-200 bg-white px-2 py-1 dark:border-white/10 dark:bg-navy-800" defaultValue={100}><option>100</option><option>25</option><option>50</option></select> ENTRIES
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              SEARCH: <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="" className="rounded border border-slate-200 bg-white px-2 py-1 text-sm dark:border-white/10 dark:bg-navy-800" />
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-xs">
            <thead className="bg-navy-900 text-[11px] uppercase tracking-wide text-slate-300">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Employee Id</th>
                <th className="px-4 py-3">Employee Name</th>
                <th className="px-4 py-3">Salary Period</th>
                <th className="px-4 py-3 text-right">Net Salary</th>
                <th className="px-4 py-3 text-right">Paid Salary</th>
                <th className="px-4 py-3">Remarks</th>
                <th className="px-4 py-3">Paid By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center"><Loader2 className="mx-auto animate-spin text-gold-500" size={22} /></td></tr>
              ) : filtered.length === 0 ? (
                <>
                  <tr><td colSpan={8} className="py-10 text-center text-sm text-slate-400">No data available in table</td></tr>
                  <tr className="border-t-2 border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
                    <td colSpan={4} className="px-4 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">Total</td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-700 dark:text-slate-200">0</td>
                    <td className="px-4 py-2.5 text-right font-bold text-emerald-600">0</td>
                    <td colSpan={2}></td>
                  </tr>
                </>
              ) : (
                <>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                      <td className="px-4 py-2.5 text-slate-500">{p.month && p.year ? `${String(p.month).padStart(2, "0")}/${p.year}` : "—"}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-500">E{String(p.employeeId || p.id).padStart(4, "0")}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200">{p.employee}</td>
                      <td className="px-4 py-2.5 text-slate-500">{p.month ? `${MONTHS[p.month - 1]} ${p.year}` : "—"}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">৳{p.net?.toLocaleString() ?? 0}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-emerald-600">৳{(p.status === "paid" ? p.net : 0).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-slate-500">{p.note || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-500">{p.paidBy || "—"}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold dark:border-white/10 dark:bg-white/5">
                    <td colSpan={4} className="px-4 py-2.5 text-right text-slate-700 dark:text-slate-200">Total</td>
                    <td className="px-4 py-2.5 text-right text-slate-700 dark:text-slate-200">{filtered.reduce((s, p) => s + (Number(p.net) || 0), 0).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-emerald-600">{filtered.filter((p) => p.status === "paid").reduce((s, p) => s + (Number(p.net) || 0), 0).toLocaleString()}</td>
                    <td colSpan={2}></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-400 dark:border-white/5">
          <span>Showing 0 to 0 of 0 entries</span>
          <span>Previous &nbsp; Next</span>
        </div>
      </div>
    </div>
  );
}
