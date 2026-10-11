import { useState, useEffect, useCallback } from "react";
import { Loader2, Save, CalendarCheck } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

const today = () => new Date().toISOString().slice(0, 10);
const STATES = ["present", "absent", "leave", "late"];
const color = { present: "text-emerald-500", absent: "text-rose-500", leave: "text-amber-500", late: "text-sky-500" };

export default function HrAttendance() {
  const { notify } = useStore();
  const [date, setDate] = useState(today());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const d = await api.hrAttendance(date); setRows(d.rows.map((r) => ({ ...r, status: r.status || "present" }))); }
    catch (e) { notify(e.message); }
    finally { setLoading(false); }
  }, [date, notify]);
  useEffect(() => { load(); }, [load]);

  const setStatus = (id, status) => setRows((rs) => rs.map((r) => r.employeeId === id ? { ...r, status } : r));
  const save = async () => {
    setSaving(true);
    try { const res = await api.hrSaveAttendance(date, rows.map((r) => ({ employeeId: r.employeeId, status: r.status }))); notify(`${res.saved} jon er attendance save holo`, "success"); }
    catch (e) { notify(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Attendance</h2><p className="text-sm text-slate-400">Protyek diner employee attendance mark korun</p></div>
        <div className="flex items-end gap-2">
          <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Date</span>
            <input type="date" className={input} value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <button onClick={save} disabled={saving || rows.length === 0} className="btn-gold">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save</button>
        </div>
      </div>
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : rows.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><CalendarCheck className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono active employee nei.</p></div>
      ) : (
        <div className="card overflow-hidden"><table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
            <th className="px-5 py-3 font-semibold">Employee</th><th className="px-5 py-3 font-semibold">Department</th><th className="px-5 py-3 font-semibold">Status</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.employeeId} className="border-t border-slate-100 dark:border-white/5">
                <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">{r.name}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{r.department || "—"}</td>
                <td className="px-5 py-3">
                  <div className="flex gap-1.5">
                    {STATES.map((s) => (
                      <button key={s} onClick={() => setStatus(r.employeeId, s)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition ${r.status === s ? `bg-white/5 ${color[s]} ring-1 ring-current` : "text-slate-400 hover:bg-white/5"}`}>{s}</button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </div>
  );
}
