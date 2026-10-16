import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Check, X, Trash2, Loader2, Paperclip } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";
import Dropdown from "../components/Dropdown";

const stStyle = { pending: "text-amber-500 bg-amber-500/10", approved: "text-emerald-500 bg-emerald-500/10", rejected: "text-rose-500 bg-rose-500/10" };
const emptyForm = { employeeId: "", subject: "", categoryId: "", reason: "", fromDate: "", toDate: "" };
const todayYmd = () => new Date().toLocaleDateString("en-CA");
// Backend-er sathe mil rekhe: max 2 MB, ei extension gula
const ATTACH_EXT = ["pdf", "jpg", "jpeg", "png", "webp", "gif", "doc", "docx"];
const MAX_ATTACH = 2 * 1024 * 1024;
const readBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
  reader.onerror = () => reject(new Error("File read fail"));
  reader.readAsDataURL(file);
});

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
    {children}
  </label>
);

// view: "apply" | "approval"
export default function LeaveApplications({ view = "apply" }) {
  const { notify } = useStore();
  const isApproval = view === "approval";
  const [rows, setRows] = useState([]);
  const [emps, setEmps] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");
  const [formErr, setFormErr] = useState("");
  const [q, setQ] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const activeFilter = isApproval ? filter : "all";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [apps, e, c] = await Promise.all([
        api.crudList("leave", "applications", activeFilter === "all" ? {} : { status: activeFilter }),
        api.crudList("hr", "employees", { status: "active" }).catch(() => []),
        api.crudList("leave", "categories").catch(() => []),
      ]);
      setRows(apps); setEmps(e); setCats(c); setErr("");
    } catch (er) { setErr(er?.message || "Load fail"); } finally { setLoading(false); }
  }, [activeFilter]);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? rows.filter((a) => `${a.employee} ${a.category} ${a.subject || ""} ${a.status} ${a.reason}`.toLowerCase().includes(s)) : rows;
  }, [rows, q]);
  const pages = Math.max(1, Math.ceil(shown.length / pageSize));
  const cur = Math.min(page, pages);
  const pageRows = shown.slice((cur - 1) * pageSize, cur * pageSize);

  const reset = () => { setForm(emptyForm); setFile(null); setFileKey((k) => k + 1); setFormErr(""); };

  const pickFile = (e) => {
    const f = e.target.files?.[0] || null;
    setFormErr("");
    if (f && !ATTACH_EXT.includes(f.name.split(".").pop().toLowerCase())) {
      setFormErr("Attachment: shudhu PDF, JPG, PNG, WEBP, GIF, DOC, DOCX file din");
    } else if (f && f.size > MAX_ATTACH) {
      setFormErr("Attachment 2 MB-er beshi hote parbe na");
    } else { setFile(f); return; }
    setFile(null); setFileKey((k) => k + 1);
  };

  const save = async () => {
    setFormErr("");
    if (!form.employeeId || !form.categoryId || !form.fromDate || !form.toDate) { setFormErr("Employee, leave type, start o end date din"); return; }
    setBusy("form");
    try {
      const attachment = file ? { name: file.name, data: await readBase64(file) } : undefined;
      await api.leaveApply({ employeeId: form.employeeId, categoryId: form.categoryId, fromDate: form.fromDate, toDate: form.toDate, subject: form.subject, reason: form.reason, attachment });
      reset();
      notify("Leave apply hoyeche", "success");
      await load();
    } catch (e) { setFormErr(e.message); }
    finally { setBusy(null); }
  };
  const act = async (fn, id, ok) => { setBusy(id); try { await fn(id); await load(); if (ok) notify(ok, "success"); } catch (e) { notify(e.message); } finally { setBusy(null); } };
  const download = async (a) => {
    setBusy(`file${a.id}`);
    try {
      const f = await api.leaveAttachment(a.id);
      const bytes = Uint8Array.from(atob(f.data), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: f.type }));
      const link = document.createElement("a"); link.href = url; link.download = f.name; link.click(); URL.revokeObjectURL(url);
    } catch (e) { notify(e.message); } finally { setBusy(null); }
  };

  return (
    <div className="space-y-5">
      <h2 className="font-display text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy-900 text-white text-xs">●</span>
        {isApproval ? "Leave Approval" : "Leave Apply"}
        <span className="text-sm font-normal text-slate-400">{isApproval ? "Pending leave approve/reject korun" : "Employee leave application"}</span>
      </h2>

      {!isApproval && (
        <div className="card p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Employee Name : *">
              <Dropdown value={form.employeeId} options={emps.map((e) => ({ value: e.id, label: e.name }))} onChange={(v) => setForm({ ...form, employeeId: v || "" })} placeholder="Select Employee" />
            </Field>
            <Field label="Subject :">
              <input className={input} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject" />
            </Field>
            <Field label="Leave Type : *">
              <Dropdown value={form.categoryId} options={cats.map((c) => ({ value: c.id, label: c.name }))} onChange={(v) => setForm({ ...form, categoryId: v || "" })} placeholder="Select Category" />
            </Field>
            <Field label="Apply Date :">
              <input className={input} value={todayYmd()} readOnly />
            </Field>
            <Field label="Start Date : *">
              <input type="date" className={input} value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} />
            </Field>
            <Field label="End Date : *">
              <input type="date" className={input} value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} />
            </Field>
            <Field label="Reason :">
              <textarea rows={2} className={`${input} min-h-[64px]`} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </Field>
            <Field label="Upload Attachment :">
              <input key={fileKey} type="file" accept={ATTACH_EXT.map((x) => `.${x}`).join(",")} onChange={pickFile} className="block w-full text-xs text-slate-500 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold dark:text-slate-400 dark:file:bg-white/10" />
              <span className="mt-1 block text-[11px] text-slate-400">PDF, image ba Word — max 2 MB</span>
            </Field>
          </div>
          {formErr && <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{formErr}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={reset} className="rounded border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">Reset</button>
            <button onClick={save} disabled={busy === "form"} className="inline-flex items-center gap-1.5 rounded bg-sky-500 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-50">
              {busy === "form" && <Loader2 size={14} className="animate-spin" />} Submit
            </button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {isApproval && (
          <div className="flex gap-2 border-b border-slate-100 px-4 py-3 dark:border-white/5">
            {["pending", "approved", "rejected", "all"].map((s) => (
              <button key={s} onClick={() => { setFilter(s); setPage(1); }} className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${filter === s ? "bg-gold-500/20 text-gold-500" : "text-slate-400 hover:bg-white/5"}`}>{s}</button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/5">
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            SHOW <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="rounded border border-slate-200 bg-white px-2 py-1 dark:border-white/10 dark:bg-navy-800">{[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}</select> ENTRIES
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            SEARCH: <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="rounded border border-slate-200 bg-white px-2 py-1 text-sm dark:border-white/10 dark:bg-navy-800" />
          </span>
        </div>

        {err && <p className="mx-4 mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}

        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-xs">
            <thead className="bg-navy-900 text-[11px] uppercase tracking-wide text-slate-300">
              <tr>
                <th className="px-4 py-3">Employee Name</th>
                <th className="px-4 py-3">Leave Type</th>
                <th className="px-4 py-3">Apply Date</th>
                <th className="px-4 py-3">Start Date</th>
                <th className="px-4 py-3">End Date</th>
                <th className="px-4 py-3 text-right">Days</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center"><Loader2 className="mx-auto animate-spin text-gold-500" size={22} /></td></tr>
              ) : pageRows.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center text-sm text-slate-400">No data available in table</td></tr>
              ) : pageRows.map((a) => (
                <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-slate-100 hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5">
                  <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200">{a.employee}</td>
                  <td className="px-4 py-2.5 text-slate-500">
                    {a.category}
                    {a.subject && <span className="block max-w-[200px] truncate text-[11px] text-slate-400" title={a.subject}>{a.subject}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{a.applyDate || "—"}</td>
                  <td className="px-4 py-2.5 text-slate-500">{a.fromDate}</td>
                  <td className="px-4 py-2.5 text-slate-500">{a.toDate}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">{a.days}</td>
                  <td className="px-4 py-2.5"><span className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${stStyle[a.status]}`}>{a.status}</span></td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1.5">
                      {a.attachmentName && (
                        <button onClick={() => download(a)} disabled={busy === `file${a.id}`} title={a.attachmentName} className="rounded-lg p-2 text-slate-400 hover:bg-sky-500/10 hover:text-sky-500 disabled:opacity-50">
                          {busy === `file${a.id}` ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
                        </button>
                      )}
                      {a.status === "pending" && (
                        <>
                          <button onClick={() => act(api.leaveApprove, a.id, "Approved")} disabled={busy === a.id} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20 disabled:opacity-50">{busy === a.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Approve</button>
                          <button onClick={() => act(api.leaveReject, a.id)} disabled={busy === a.id} className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-500/20 disabled:opacity-50"><X size={13} /> Reject</button>
                        </>
                      )}
                      <button onClick={() => act(api.crudDelete.bind(null, "leave", "applications"), a.id)} disabled={busy === a.id} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-400 dark:border-white/5">
          <span>Showing {shown.length ? (cur - 1) * pageSize + 1 : 0} to {Math.min(cur * pageSize, shown.length)} of {shown.length} entries</span>
          <span className="flex items-center gap-2">
            <button disabled={cur <= 1} onClick={() => setPage(cur - 1)} className="hover:text-slate-600 disabled:opacity-40">Previous</button>
            <span className="rounded bg-navy-900 px-2 py-1 text-white">{cur}</span>
            <button disabled={cur >= pages} onClick={() => setPage(cur + 1)} className="hover:text-slate-600 disabled:opacity-40">Next</button>
          </span>
        </div>
      </div>
    </div>
  );
}
