import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2, UserCog } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

const ROLES = ["admin", "reseller", "collector"];
const roleColor = { admin: "text-gold-500 bg-gold-500/10", reseller: "text-indigo-500 bg-indigo-500/10", collector: "text-sky-500 bg-sky-500/10" };
const empty = { name: "", email: "", phone: "", role: "collector", password: "" };

export default function AppUsers() {
  const { notify } = useStore();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [toDelete, setToDelete] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => { setLoading(true); try { setRows(await api.sysUsers()); setErr(""); } catch (e) { setErr(e?.message || "Load fail"); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(empty); setErr(""); setEditing({}); };
  const openEdit = (u) => { setForm({ name: u.name, email: u.email, phone: u.phone, role: u.role, password: "" }); setErr(""); setEditing(u); };
  const save = async () => { setErr(""); try { if (editing.id) await api.sysUpdateUser(editing.id, form); else await api.sysCreateUser(form); setEditing(null); await load(); } catch (e) { setErr(e.message); } };
  const doDelete = async () => { try { await api.sysDeleteUser(toDelete.id); setToDelete(null); await load(); } catch (e) { notify(e.message); setToDelete(null); } };
  const toggleActive = async (u) => { try { await api.sysUpdateUser(u.id, { active: !u.active }); await load(); } catch (e) { notify(e.message); } };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">App Users</h2><p className="text-sm text-slate-400">System user (admin/reseller/collector) manage</p></div>
        <button onClick={openNew} className="btn-gold"><Plus size={16} /> Add User</button>
      </div>
      {err && !editing && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : (
        <div className="card overflow-hidden"><table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400"><tr>
            <th className="px-5 py-3 font-semibold">Name</th><th className="px-5 py-3 font-semibold">Email</th>
            <th className="px-5 py-3 font-semibold">Role</th><th className="px-5 py-3 font-semibold">Status</th>
            <th className="px-5 py-3 text-right font-semibold">Action</th></tr></thead>
          <tbody>
            {rows.map((u, i) => (
              <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="border-t border-slate-100 dark:border-white/5">
                <td className="px-5 py-3"><p className="font-medium text-slate-700 dark:text-slate-200">{u.name}</p><p className="text-xs text-slate-400">{u.phone}</p></td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{u.email}</td>
                <td className="px-5 py-3"><span className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${roleColor[u.role]}`}>{u.role}</span></td>
                <td className="px-5 py-3"><button onClick={() => toggleActive(u)} className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${u.active ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-400/10 text-slate-400"}`}>{u.active ? "Active" : "Inactive"}</button></td>
                <td className="px-5 py-3"><div className="flex justify-end gap-1">
                  <button onClick={() => openEdit(u)} className="rounded-lg p-2 text-slate-400 hover:bg-gold-500/10 hover:text-gold-500"><Pencil size={15} /></button>
                  <button onClick={() => setToDelete(u)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={15} /></button>
                </div></td>
              </motion.tr>
            ))}
          </tbody>
        </table></div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit User" : "Add User"}
        footer={<><button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {err && <p className="col-span-full rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Name</span>
            <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Email</span>
            <input className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!!editing?.id} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Phone</span>
            <input className={input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Role</span>
            <Dropdown value={form.role} options={ROLES} onChange={(v) => setForm({ ...form, role: v })} /></label>
          <label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Password {editing?.id ? "(khali = unchanged)" : ""}</span>
            <input className={input} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        </div>
      </Modal>
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete User?" subtitle={toDelete?.name} size="sm"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={doDelete} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"><Trash2 size={15} /> Delete</button></>}>
        <p className="text-sm text-slate-500 dark:text-slate-300"><b className="text-slate-700 dark:text-white">{toDelete?.name}</b> delete korbo?</p>
      </Modal>
    </div>
  );
}
