import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, Search, Info, FileText, ChevronDown, Building2, Briefcase, Phone, Mail, Calendar } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";
import Dropdown from "../components/Dropdown";

export default function HrPayslips() {
  const { notify } = useStore();
  const [employees, setEmployees] = useState([]);
  const [filter, setFilter] = useState("Active");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [monthByEmp, setMonthByEmp] = useState({}); // {employeeId: "Oct-24"}
  const [busy, setBusy] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [expanded, setExpanded] = useState(new Set()); // View More expanded

  const loadEmployees = useCallback(async () => {
    try {
      const emps = await api.hrList("employees", filter === "Active" ? { status: "active" } : undefined);
      setEmployees(Array.isArray(emps) ? emps : []);
      // Default month = current month-year label, e.g. Oct-24 style via first available
      const now = new Date();
      const short = now.toLocaleDateString("en-US", { month: "short" }).slice(0, 3);
      const yy = String(now.getFullYear()).slice(-2);
      const def = `${short}-${yy}`;
      setMonthByEmp((prev) => {
        const next = { ...prev };
        for (const e of (Array.isArray(emps) ? emps : [])) if (!next[e.id]) next[e.id] = def;
        return next;
      });
    } catch (e) { notify(e.message); }
  }, [filter, notify]);
  useEffect(() => { loadEmployees(); }, [loadEmployees]);

  const filtered = employees.filter((e) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return `${e.name} ${e.phone}`.toLowerCase().includes(s);
  });
  const allChecked = filtered.length > 0 && filtered.every((e) => selected.has(e.id));
  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(filtered.map((e) => e.id)));
  };
  const toggleOne = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const generateFor = async (emp) => {
    const label = monthByEmp[emp.id];
    if (!label) return notify("Month select korun");
    // Parse "Oct-24" -> month/year (supports "Oct-24" or "Oct-26")
    const m = label.match(/([A-Za-z]{3})-(\d{2})/);
    if (!m) return notify("Month format Oct-26 er moto din");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIdx = months.findIndex((x) => x.toLowerCase() === m[1].toLowerCase()) + 1;
    const year = 2000 + Number(m[2]);
    if (!monthIdx) return notify("Month parse failed");
    setBusy(emp.id);
    try {
      const res = await api.hrGeneratePayroll(monthIdx, year);
      notify(res?.created ? `${res.created} payslip(s) created for ${label}` : `Payroll queued for ${label}`, "success");
    } catch (e) { notify(e.message); }
    finally { setBusy(null); }
  };
  const toggleExpand = (id) => setExpanded((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-slate-800 dark:text-white">Payslip Manager</h2>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={() => setShowRules((v) => !v)} className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:underline">
            View Rules <Info size={14} />
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              Employee Type:
              <Dropdown value={filter} options={["Active", "All"]} onChange={setFilter} className="w-28" />
            </label>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              Search Employee
              <Dropdown value={search ? `search:${search}` : ""} options={["", ...employees.map((e) => ({ value: e.name, label: e.name }))]} onChange={(v) => setSearch(v || "")} placeholder="Search Employee" className="w-44" />
            </label>
          </div>
        </div>

        {showRules && (
          <div className="mt-3 rounded-xl bg-sky-500/10 p-3 text-sm text-slate-600 dark:text-slate-300">
            Per-employee payslip generates Basic + active PayHeads for that month. Already-generated month will be skipped.
          </div>
        )}

        <div className="mt-4 border-t border-slate-100 pt-3 dark:border-white/5">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <input type="checkbox" checked={allChecked} onChange={toggleAll} className="h-4 w-4 rounded" />
            Select All Employee
          </label>

          <div className="mt-3 space-y-3">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No employees.</p>
            ) : filtered.map((emp) => {
              const isExp = expanded.has(emp.id);
              return (
              <div key={emp.id} className="rounded-xl border border-slate-100 bg-white p-3 dark:border-white/5 dark:bg-white/5">
                <div className="flex flex-wrap items-center gap-3">
                  <input type="checkbox" checked={selected.has(emp.id)} onChange={() => toggleOne(emp.id)} className="h-4 w-4 rounded" />
                  <div className="min-w-[140px] flex-1">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{emp.name}</p>
                    <button onClick={() => toggleExpand(emp.id)} className="inline-flex items-center gap-1 text-xs text-sky-600 hover:underline">
                      View More... <ChevronDown size={12} className={`transition ${isExp ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                  <div className="flex min-w-[180px] items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 dark:border-white/10 dark:bg-navy-800">
                    <input
                      value={monthByEmp[emp.id] || ""}
                      onChange={(e) => setMonthByEmp((m) => ({ ...m, [emp.id]: e.target.value }))}
                      placeholder="Oct-26"
                      className="flex-1 bg-transparent text-sm outline-none"
                    />
                    <button onClick={() => setMonthByEmp((m) => ({ ...m, [emp.id]: "" }))} className="text-slate-400 hover:text-rose-500">×</button>
                  </div>
                  <div className="min-w-[180px] flex-1 text-xs leading-relaxed text-slate-500">
                    Generate Payslip for : <span className="font-semibold text-rose-500">{monthByEmp[emp.id] || "—"}</span>
                    <br />
                    <span className="text-slate-400">→ {emp.position || emp.department || "—"} (Monthly Payroll)</span>
                  </div>
                  <button onClick={() => generateFor(emp)} disabled={busy === emp.id} className="rounded p-1.5 text-sky-600 hover:bg-sky-500/10 disabled:opacity-40">
                    {busy === emp.id ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                  </button>
                  <span className="text-xs text-slate-400">Payheads Total : 0</span>
                </div>
                <AnimatePresence>
                  {isExp && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs dark:border-white/5 sm:grid-cols-4">
                        <span className="flex items-center gap-1.5 text-slate-500"><Building2 size={13} /> Dept: {emp.department || "—"}</span>
                        <span className="flex items-center gap-1.5 text-slate-500"><Briefcase size={13} /> Position: {emp.position || "—"}</span>
                        <span className="flex items-center gap-1.5 text-slate-500"><Phone size={13} /> {emp.phone || "—"}</span>
                        <span className="flex items-center gap-1.5 text-slate-500"><Mail size={13} /> {emp.email || "—"}</span>
                        <span className="flex items-center gap-1.5 text-slate-500"><Calendar size={13} /> Join: {emp.joinDate ? new Date(emp.joinDate).toLocaleDateString("en-GB") : "—"}</span>
                        <span className="text-slate-500">Basic: ৳{emp.basicSalary ?? 0}</span>
                        <span className="text-slate-500">NID: {emp.nid || "—"}</span>
                        <span className="text-slate-500">Address: {emp.address || "—"}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
