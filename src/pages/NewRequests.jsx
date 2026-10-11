import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Check, X, Trash2, Loader2, UserPlus } from "lucide-react";
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
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [reqs, pkgs] = await Promise.all([
        api.listRequests(filter === "all" ? undefined : filter),
        api.listPackages().catch(() => []),
      ]);
      setList(reqs);
      setPackages(pkgs);
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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">New Requests</h2>
          <p className="text-sm text-slate-400">Notun connection request — approve korle customer toiri hobe</p>
        </div>
        <button onClick={() => { setForm({}); setErr(""); setAdding(true); }} className="btn-gold"><Plus size={16} /> New Request</button>
      </div>

      <div className="flex gap-2">
        {["pending", "approved", "rejected", "all"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${filter === s ? "bg-gold-500/20 text-gold-500" : "text-slate-400 hover:bg-white/5"}`}>
            {s}
          </button>
        ))}
      </div>

      {err && !adding && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>
      ) : list.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center">
          <UserPlus className="text-slate-300 dark:text-white/20" size={40} />
          <p className="mt-3 text-sm text-slate-400">Kono {filter !== "all" ? filter : ""} request nei.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Phone</th>
                  <th className="px-5 py-3 font-semibold">Area</th>
                  <th className="px-5 py-3 font-semibold">Package</th>
                  <th className="px-5 py-3 font-semibold">PPPoE</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row, i) => (
                  <motion.tr key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-t border-slate-100 dark:border-white/5">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-700 dark:text-slate-200">{row.name}</p>
                      {row.address && <p className="text-xs text-slate-400">{row.address}</p>}
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{row.phone}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{row.area || "—"}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{row.package || "—"}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{row.pppoe || "—"}</td>
                    <td className="px-5 py-3"><span className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${reqStatusStyle[row.status]}`}>{row.status}</span></td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        {isAdmin && row.status === "pending" && (
                          <>
                            <button onClick={() => approve(row)} disabled={busy === row.id}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20 disabled:opacity-50">
                              {busy === row.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Approve
                            </button>
                            <button onClick={() => reject(row)} disabled={busy === row.id}
                              className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-500/20 disabled:opacity-50">
                              <X size={13} /> Reject
                            </button>
                          </>
                        )}
                        {isAdmin && (
                          <button onClick={() => remove(row)} disabled={busy === row.id}
                            className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="New Connection Request" subtitle="Notun connection er abedon"
        footer={<><button onClick={() => setAdding(false)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Submit</button></>}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {err && <p className="col-span-full rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Name</span>
            <input className={input} value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Customer name" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Phone</span>
            <input className={input} value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Area / Zone</span>
            <input className={input} value={form.area || ""} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="e.g. Mirpur" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">PPPoE Username</span>
            <input className={input} value={form.pppoe || ""} onChange={(e) => setForm({ ...form, pppoe: e.target.value })} placeholder="user1234" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Package</span>
            <Dropdown value={form.package || ""} options={packages.map((p) => ({ value: p.name, label: p.name }))} onChange={(v) => setForm({ ...form, package: v || "" })} placeholder="Package" /></label>
          <label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Address</span>
            <input className={input} value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address" /></label>
          <label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Note</span>
            <input className={input} value={form.note || ""} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional note" /></label>
        </div>
      </Modal>
    </div>
  );
}
