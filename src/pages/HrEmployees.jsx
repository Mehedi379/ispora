import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2, UserMinus, RotateCcw, Search } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

function Section({ title, children }) {
  return (
    <div className="col-span-full rounded-xl border border-slate-100 p-4 dark:border-white/5">
      <h4 className="mb-3 font-display text-sm font-bold text-slate-700 dark:text-slate-200">{title}</h4>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </div>
  );
}

// view: "list" | "resignation" | "rejoin" | "add"
export default function HrEmployees({ view = "list" }) {
  const { notify } = useStore();
  const [rows, setRows] = useState([]);
  const [depts, setDepts] = useState([]);
  const [positions, setPositions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [upazilas, setUpazilas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [toDelete, setToDelete] = useState(null);
  const [resignTarget, setResignTarget] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");
  const [params, setParams] = useSearchParams();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const statusFilter = view === "rejoin" ? "resigned" : view === "resignation" ? undefined : undefined;
      const [emps, d, p, dists, ups] = await Promise.all([
        api.hrList("employees", statusFilter ? { status: statusFilter } : {}),
        api.hrList("departments").catch(() => []),
        api.hrList("positions").catch(() => []),
        api.listConfig("districts").catch(() => []),
        api.listConfig("upazilas").catch(() => []),
      ]);
      setRows(emps); setDepts(d); setPositions(p); setDistricts(dists); setUpazilas(ups); setErr("");
    } catch (e) { setErr(e?.message || "Load fail"); }
    finally { setLoading(false); }
  }, [view]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (params.get("new") && (view === "list" || view === "add")) {
      setForm({}); setEditing({}); params.delete("new"); setParams(params, { replace: true });
    }
  }, [params, view, setParams]);

  const F = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openNew = () => { setForm({}); setErr(""); setEditing({}); };
  const openEdit = (e) => {
    setForm({
      name: e.name || "", phone: e.phone || "", email: e.email || "", nid: e.nid || "",
      officeContact: e.officeContact || "", guardianContact: e.guardianContact || "",
      dob: e.dob || "", gender: e.gender || "", maritalStatus: e.maritalStatus || "",
      facebook: e.facebook || "", reference: e.reference || "", district: e.district || "", upazila: e.upazila || "",
      workExperience: e.workExperience || "", presentAddress: e.presentAddress || e.address || "", permanentAddress: e.permanentAddress || "",
      device: e.device || "", punchCardId: e.punchCardId || "", inTime: e.inTime || "", outTime: e.outTime || "",
      lastDegree: e.lastDegree || "", institution: e.institution || "", passingYear: e.passingYear || "",
      joiningDate: e.joinDate || "", departmentId: e.departmentId || "", positionId: e.positionId || "",
      basicSalary: e.basicSalary ?? 0,
    });
    setErr(""); setEditing(e);
  };
  const save = async () => {
    setErr("");
    try { if (editing.id) await api.hrUpdate("employees", editing.id, form); else await api.hrCreate("employees", form); setEditing(null); await load(); }
    catch (e) { setErr(e.message); }
  };
  const doResign = async () => {
    setBusy(resignTarget.id);
    try { await api.hrResign(resignTarget.id, reason); setResignTarget(null); setReason(""); await load(); notify("Employee resigned", "success"); }
    catch (e) { notify(e.message); } finally { setBusy(null); }
  };
  const rejoin = async (e) => {
    setBusy(e.id);
    try { await api.hrRejoin(e.id); await load(); notify("Employee rejoined", "success"); }
    catch (er) { notify(er.message); } finally { setBusy(null); }
  };
  const doDelete = async () => {
    try { await api.hrDelete("employees", toDelete.id); setToDelete(null); await load(); }
    catch (e) { notify(e.message); setToDelete(null); }
  };

  const base = view === "rejoin" ? rows.filter((e) => e.status === "resigned")
    : view === "resignation" ? rows.filter((e) => e.status === "active")
    : rows;
  const filtered = base.filter((e) => !q || `${e.name} ${e.phone} ${e.department} ${e.position}`.toLowerCase().includes(q.toLowerCase()));
  const title = view === "resignation" ? "Resignation" : view === "rejoin" ? "Rejoin" : view === "add" ? "Add Employee" : "Employees";
  const sub = view === "resignation" ? "Active employee resign koran" : view === "rejoin" ? "Resigned employee abar rejoin koran" : view === "add" ? "Notun employee er sob tottho din" : "Shob employee";
  const showAddBtn = view === "list" || view === "add";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">{title}</h2><p className="text-sm text-slate-400">{sub}</p></div>
        {showAddBtn && <button onClick={openNew} className="btn-gold"><Plus size={16} /> Add Employee</button>}
      </div>
      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className={`${input} pl-9`} placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {err && !editing && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : (
        <div className="card overflow-hidden"><div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
              <th className="px-5 py-3 font-semibold">Name</th><th className="px-5 py-3 font-semibold">Department</th>
              <th className="px-5 py-3 font-semibold">Position</th><th className="px-5 py-3 font-semibold">Basic</th>
              <th className="px-5 py-3 font-semibold">Join</th><th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 text-right font-semibold">Action</th></tr></thead>
            <tbody>
              {filtered.map((e, i) => (
                <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="border-t border-slate-100 dark:border-white/5">
                  <td className="px-5 py-3"><p className="font-medium text-slate-700 dark:text-slate-200">{e.name}</p><p className="text-xs text-slate-400">{e.phone}</p></td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{e.department || "—"}</td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{e.position || "—"}</td>
                  <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-200">৳{e.basicSalary}</td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{e.joinDate}</td>
                  <td className="px-5 py-3"><span className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${e.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-400/10 text-slate-400"}`}>{e.status}</span></td>
                  <td className="px-5 py-3"><div className="flex justify-end gap-1.5">
                    {view === "rejoin" ? (
                      <button onClick={() => rejoin(e)} disabled={busy === e.id} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20 disabled:opacity-50">{busy === e.id ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Rejoin</button>
                    ) : view === "resignation" ? (
                      <button onClick={() => { setResignTarget(e); setReason(""); }} className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-500/20"><UserMinus size={13} /> Resign</button>
                    ) : (
                      <>
                        <button onClick={() => openEdit(e)} className="rounded-lg p-2 text-slate-400 hover:bg-gold-500/10 hover:text-gold-500"><Pencil size={15} /></button>
                        <button onClick={() => setToDelete(e)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={15} /></button>
                      </>
                    )}
                  </div></td>
                </motion.tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-400">Kono employee nei.</td></tr>}
            </tbody>
          </table>
        </div></div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Employee" : "Add Employee"} subtitle={editing?.id ? editing.name : "Notun employee"} size="xl"
        footer={<><button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="space-y-2">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}

          <Section title="Basic Information">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Employee Name <span className="text-rose-500">*</span></span><input className={input} value={form.name || ""} onChange={F("name")} placeholder="Full name" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Date of Birth</span><input type="date" className={input} value={form.dob || ""} onChange={F("dob")} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Gender</span><Dropdown value={form.gender || ""} options={[{ value: "", label: "Select" }, { value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Other", label: "Other" }]} onChange={(v) => set("gender", v)} placeholder="Select" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Personal Contact No. <span className="text-rose-500">*</span></span><input className={input} value={form.phone || ""} onChange={F("phone")} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Office Contact No. <span className="text-rose-500">*</span></span><input className={input} value={form.officeContact || ""} onChange={F("officeContact")} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Guardian Contact No.</span><input className={input} value={form.guardianContact || ""} onChange={F("guardianContact")} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Marital Status</span><Dropdown value={form.maritalStatus || ""} options={[{ value: "", label: "Select" }, { value: "Single", label: "Single" }, { value: "Married", label: "Married" }]} onChange={(v) => set("maritalStatus", v)} placeholder="Select" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">NID / Birth Certificate</span><input className={input} value={form.nid || ""} onChange={F("nid")} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Email</span><input className={input} value={form.email || ""} onChange={F("email")} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Facebook ID Link</span><input className={input} value={form.facebook || ""} onChange={F("facebook")} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Reference</span><input className={input} value={form.reference || ""} onChange={F("reference")} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">District</span><Dropdown value={form.district || ""} options={[{ value: "", label: "Select" }, ...districts.map((d) => ({ value: d.name, label: d.name }))]} onChange={(v) => set("district", v)} placeholder="Select" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Upazila</span><Dropdown value={form.upazila || ""} options={[{ value: "", label: "Select" }, ...upazilas.map((u) => ({ value: u.name, label: u.name }))]} onChange={(v) => set("upazila", v)} placeholder="Select" /></label>
            <label className="block lg:col-span-4"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Working Experience</span><textarea className={`${input} min-h-[56px]`} value={form.workExperience || ""} onChange={F("workExperience")} rows={2} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Present Address</span><textarea className={`${input} min-h-[56px]`} value={form.presentAddress || form.address || ""} onChange={F("presentAddress")} rows={2} /></label>
            <label className="block col-span-2 lg:col-span-3"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Permanent Address</span><textarea className={`${input} min-h-[56px]`} value={form.permanentAddress || ""} onChange={F("permanentAddress")} rows={2} /></label>
          </Section>

          <Section title="Attendance Information">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Device</span><Dropdown value={form.device || ""} options={[{ value: "", label: "Select Device" }, { value: "Fingerprint", label: "Fingerprint" }, { value: "Manual", label: "Manual" }]} onChange={(v) => set("device", v)} placeholder="Select Device" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Punch Card ID</span><input className={input} value={form.punchCardId || ""} onChange={F("punchCardId")} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">In Time <span className="text-rose-500">*</span></span><input className={input} type="time" value={form.inTime || ""} onChange={F("inTime")} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Out Time <span className="text-rose-500">*</span></span><input className={input} type="time" value={form.outTime || ""} onChange={F("outTime")} /></label>
          </Section>

          <Section title="Educational Qualification">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Last Achieved Degree</span><input className={input} value={form.lastDegree || ""} onChange={F("lastDegree")} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Institution / Board</span><input className={input} value={form.institution || ""} onChange={F("institution")} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Passing Year</span><input className={input} value={form.passingYear || ""} onChange={F("passingYear")} /></label>
          </Section>

          <Section title="Posting Information">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Joining Date <span className="text-rose-500">*</span></span><input type="date" className={input} value={form.joiningDate || form.joinDate || ""} onChange={F("joinDate")} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Department</span><Dropdown value={form.departmentId || ""} options={depts.map((d) => ({ value: d.id, label: d.name }))} onChange={(v) => set("departmentId", v || "")} placeholder="Select" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Position / Designation <span className="text-rose-500">*</span></span><Dropdown value={form.positionId || ""} options={positions.map((p) => ({ value: p.id, label: p.name }))} onChange={(v) => set("positionId", v || "")} placeholder="Select" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Basic Salary (৳)</span><input className={input} type="number" value={form.basicSalary ?? ""} onChange={F("basicSalary")} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Comment</span><input className={input} value={form.comment || ""} onChange={F("comment")} /></label>
          </Section>
        </div>
      </Modal>

      <Modal open={!!resignTarget} onClose={() => setResignTarget(null)} title="Resign Employee?" subtitle={resignTarget?.name} size="sm"
        footer={<><button onClick={() => setResignTarget(null)} className="btn-ghost">Cancel</button><button onClick={doResign} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"><UserMinus size={15} /> Resign</button></>}>
        <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Reason</span>
          <input className={input} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" /></label>
      </Modal>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete Employee?" subtitle={toDelete?.name} size="sm"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={doDelete} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"><Trash2 size={15} /> Delete</button></>}>
        <p className="text-sm text-slate-500 dark:text-slate-300"><b className="text-slate-700 dark:text-white">{toDelete?.name}</b> ebong er attendance/payslip delete hobe. Nishchit?</p>
      </Modal>
    </div>
  );
}
