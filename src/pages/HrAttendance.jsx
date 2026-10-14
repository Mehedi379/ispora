import { useState, useEffect, useCallback } from "react";
import { Loader2, Search, CalendarCheck } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";
import Dropdown from "../components/Dropdown";

export default function HrAttendance() {
  const { notify } = useStore();
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [startDate, setStartDate] = useState("2026-10-12");
  const [endDate, setEndDate] = useState("2026-10-12");
  const [appliedEmp, setAppliedEmp] = useState("");
  const [appliedStart, setAppliedStart] = useState("");
  const [appliedEnd, setAppliedEnd] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const emps = await api.hrList("employees"); setEmployees(Array.isArray(emps) ? emps : []); }
      catch (e) { notify(e.message); }
      finally { setInitialLoading(false); }
    })();
  }, [notify]);

  const search = useCallback(async () => {
    if (!selectedEmp) { notify("Employee select korun (required)"); return; }
    setAppliedEmp(selectedEmp);
    setAppliedStart(startDate);
    setAppliedEnd(endDate);
    setLoading(true);
    try {
      // Backend: GET /hr/attendance?date=YYYY-MM-DD returns rows for that date; fetch start date's marks
      const d = await api.hrAttendance(startDate);
      const empId = Number(selectedEmp);
      const hit = (d.rows || []).find((r) => Number(r.employeeId) === empId);
      // Build a single-row result for the date range
      setRows(hit ? [{ ...hit, date: startDate, officeIn: hit.inTime || "—", officeOut: hit.outTime || "—", inTime: hit.checkIn || "—", outTime: hit.checkOut || "—", workingHour: "—", type: hit.status || "—", lateEarly: "—", overTime: "—" }] : []);
    } catch (e) { notify(e.message); setRows([]); }
    finally { setLoading(false); }
  }, [selectedEmp, startDate, endDate, notify]);

  const exportCsv = () => {
    const cols = ["Date", "Office In Time", "Office Out Time", "In Time", "Out Time", "Working Hour", "Type", "Late+Early Out", "Over Time Real->Approved"];
    const lines = [cols.join(",")];
    for (const r of rows) {
      const vals = [r.date || "", r.officeIn || "", r.officeOut || "", r.inTime || "", r.outTime || "", r.workingHour || "", r.type || r.status || "", r.lateEarly || "", r.overTime || ""].map((v) => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(vals.join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `attendance-${appliedStart}_to_${appliedEnd}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  if (initialLoading) return <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>;

  return (
    <div className="space-y-5">
      <h2 className="font-display text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy-900 text-white text-xs">●</span>
        Employee Wise Attendance <span className="text-sm font-normal text-slate-400">Employee</span>
      </h2>

      <div className="card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Search Employee : <span className="text-rose-500">*</span></span>
            <Dropdown value={selectedEmp} options={employees.map((e) => ({ value: String(e.id), label: e.name }))} onChange={setSelectedEmp} placeholder="Search Employee" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Select Start Date :</span>
            <input type="date" className={input} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Select Ends Date :</span>
            <input type="date" className={input} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
          <div className="flex items-end gap-2">
            <button onClick={search} className="rounded bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600">Search</button>
            <div className="ml-auto flex gap-2">
              <button onClick={() => window.print()} className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">Generate PDF</button>
              <button onClick={exportCsv} className="rounded bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-600">Generate Excel</button>
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-xs">
            <thead className="bg-navy-900 text-[11px] uppercase tracking-wide text-slate-300">
              <tr>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Office In Time</th>
                <th className="px-3 py-3">Office Out Time</th>
                <th className="px-3 py-3">In Time</th>
                <th className="px-3 py-3">Out Time</th>
                <th className="px-3 py-3">Working Hour</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Late + Early Out</th>
                <th className="px-3 py-3">Over Time<br />Real → Approved</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="py-10 text-center"><Loader2 className="mx-auto animate-spin text-gold-500" size={18} /></td></tr>
              ) : !appliedEmp ? (
                <tr><td colSpan={9} className="py-10 text-center text-sm text-slate-400">Employee select kore Search korun.</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className="py-10 text-center text-sm text-slate-400">No data available in table</td></tr>
              ) : rows.map((r) => (
                <tr key={r.date} className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{r.date || appliedStart}</td>
                  <td className="px-3 py-2.5 text-slate-500">{r.officeIn || "—"}</td>
                  <td className="px-3 py-2.5 text-slate-500">{r.officeOut || "—"}</td>
                  <td className="px-3 py-2.5 text-slate-500">{r.inTime || "—"}</td>
                  <td className="px-3 py-2.5 text-slate-500">{r.outTime || "—"}</td>
                  <td className="px-3 py-2.5 text-slate-500">{r.workingHour || "—"}</td>
                  <td className="px-3 py-2.5 capitalize text-slate-500">{r.type || r.status || "—"}</td>
                  <td className="px-3 py-2.5 text-slate-500">{r.lateEarly || "—"}</td>
                  <td className="px-3 py-2.5 text-slate-500">{r.overTime || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-2 py-3 text-xs text-slate-400 dark:border-white/5">
          <span>Showing 0 to 0 of 0 entries</span>
          <span>Previous &nbsp; Next</span>
        </div>
      </div>
    </div>
  );
}
