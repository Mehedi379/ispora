import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Check, X, Trash2, Loader2, Repeat } from "lucide-react";
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
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Change Requests</h2>
          <p className="text-sm text-slate-400">Package/info change er abedon — approve korle auto apply hobe</p>
        </div>
        <button onClick={() => { setForm({ clientId: "", type: "package", detail: "", note: "" }); setErr(""); setAdding(true); }} className="btn-gold"><Plus size={16} /> New Change Request</button>
      </div>

      <div className="flex gap-2">
        {["pending", "approved", "rejected", "all"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${filter === s ? "bg-gold-500/20 text-gold-500" : "text-slate-400 hover:bg-white/5"}`}>{s}</button>
        ))}
      </div>

      {err && !adding && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>
      ) : list.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center">
          <Repeat className="text-slate-300 dark:text-white/20" size={40} />
          <p className="mt-3 text-sm text-slate-400">Kono {filter !== "all" ? filter : ""} change request nei.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Client</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Current</th>
                  <th className="px-5 py-3 font-semibold">Requested</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row, i) => (
                  <motion.tr key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-t border-slate-100 dark:border-white/5">
                    <td className="px-5 py-3"><p className="font-medium text-slate-700 dark:text-slate-200">{row.client}</p><p className="text-xs text-slate-400">{row.phone}</p></td>
                    <td className="px-5 py-3 capitalize text-slate-500 dark:text-slate-400">{row.type}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{row.type === "package" ? row.currentPackage || "—" : "—"}</td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-200">{row.detail || "—"}</td>
                    <td className="px-5 py-3"><span className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${stStyle[row.status]}`}>{row.status}</span></td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        {isAdmin && row.status === "pending" && (
                          <>
                            <button onClick={() => approve(row)} disabled={busy === row.id} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20 disabled:opacity-50">{busy === row.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Approve</button>
                            <button onClick={() => act(api.rejectChangeRequest, row)} disabled={busy === row.id} className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-500/20 disabled:opacity-50"><X size={13} /> Reject</button>
                          </>
                        )}
                        {isAdmin && <button onClick={() => act(api.deleteChangeRequest, row)} disabled={busy === row.id} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="New Change Request" subtitle="Client er package/info change"
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
