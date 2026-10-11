import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Loader2, KeyRound, Power, Pencil } from "lucide-react";
import Modal from "../components/Modal";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

export default function PortalManage() {
  const { notify } = useStore();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState(null); // client row for credential modal
  const [form, setForm] = useState({ portalUser: "", password: "" });
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await api.listPortal()); setErr(""); }
    catch (e) { setErr(e?.message || "Load fail"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter((r) => !q || `${r.name} ${r.pppoe} ${r.portalUser}`.toLowerCase().includes(q.toLowerCase()));

  const toggle = async (r) => {
    setBusy(r.id);
    try {
      if (r.portalEnabled) await api.disablePortal(r.id);
      else await api.enablePortal(r.id, {});
      await load();
    } catch (e) { notify(e.message); } finally { setBusy(null); }
  };

  const openEdit = (r) => { setForm({ portalUser: r.portalUser || r.pppoe || "", password: "" }); setErr(""); setEdit(r); };
  const save = async () => {
    setErr("");
    try {
      if (edit.portalEnabled) await api.updatePortal(edit.id, form);
      else await api.enablePortal(edit.id, form);
      setEdit(null); await load();
    } catch (e) { setErr(e.message); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Portal Manage</h2>
        <p className="text-sm text-slate-400">Customer der self-service portal access (login username/password)</p>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className={`${input} pl-9`} placeholder="Search customer..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {err && !edit && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Zone</th>
                  <th className="px-5 py-3 font-semibold">Portal Username</th>
                  <th className="px-5 py-3 font-semibold">Password</th>
                  <th className="px-5 py-3 font-semibold">Portal</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.015, 0.3) }} className="border-t border-slate-100 dark:border-white/5">
                    <td className="px-5 py-3"><p className="font-medium text-slate-700 dark:text-slate-200">{r.name}</p><p className="text-xs text-slate-400">{r.phone}</p></td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{r.zone || "—"}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{r.portalUser || "—"}</td>
                    <td className="px-5 py-3">{r.hasPassword ? <span className="text-xs text-emerald-500">●●●● set</span> : <span className="text-xs text-slate-400">not set</span>}</td>
                    <td className="px-5 py-3"><span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${r.portalEnabled ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-400/10 text-slate-400"}`}>{r.portalEnabled ? "Enabled" : "Disabled"}</span></td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => openEdit(r)} className="inline-flex items-center gap-1 rounded-lg bg-gold-500/10 px-2.5 py-1.5 text-xs font-semibold text-gold-600 hover:bg-gold-500/20"><KeyRound size={13} /> Credentials</button>
                        <button onClick={() => toggle(r)} disabled={busy === r.id} title={r.portalEnabled ? "Disable" : "Enable"} className={`rounded-lg p-2 transition ${r.portalEnabled ? "text-emerald-500 hover:bg-emerald-500/10" : "text-slate-400 hover:bg-slate-500/10"}`}>{busy === r.id ? <Loader2 size={15} className="animate-spin" /> : <Power size={15} />}</button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-sm text-slate-400">Kono customer nei.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={!!edit} onClose={() => setEdit(null)} title="Portal Credentials" subtitle={edit?.name}
        footer={<><button onClick={() => setEdit(null)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save & Enable</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Portal Username</span>
            <input className={input} value={form.portalUser} onChange={(e) => setForm({ ...form, portalUser: e.target.value })} placeholder="e.g. pppoe username" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Password {edit?.hasPassword ? "(notun dile reset hobe)" : ""}</span>
            <input className={input} type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password (4+ char)" /></label>
          <p className="rounded-lg bg-gold-500/10 px-3 py-2 text-xs text-gold-600 dark:text-gold-400">Save korle portal access enable hoye jabe. Customer ei username/password diye nijer bill/info dekhte parbe (portal page future-e).</p>
        </div>
      </Modal>
    </div>
  );
}
