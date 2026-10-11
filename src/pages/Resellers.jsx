import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Store, Plus, Users, Wallet, Phone, Pencil, Trash2, Loader2, Eye } from "lucide-react";
import Modal from "../components/Modal";
import { useStore } from "../store";
import { api } from "../api";
import { statusStyle } from "../data";

import { input } from "../ui";

export default function Resellers() {
  const { user } = useStore();
  const isAdmin = user?.role === "admin";
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // reseller obj or {} for new
  const [toDelete, setToDelete] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [err, setErr] = useState("");
  const [viewing, setViewing] = useState(null); // reseller card jar clients dekhbo
  const [vClients, setVClients] = useState([]);
  const [vLoading, setVLoading] = useState(false);

  const openView = async (rr) => {
    setViewing(rr); setVClients([]); setVLoading(true);
    try { setVClients(await api.resellerClients(rr.id)); }
    catch (e) { setErr(e?.message || "Client list ana jayni"); }
    finally { setVLoading(false); }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try { setList(await api.listResellers()); setErr(""); }
    catch (e) { setErr(e?.message || "Reseller load fail holo"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({ name: "", email: "", phone: "", password: "" }); setErr(""); setEditing({}); };
  const openEdit = (x) => { setForm({ name: x.name, email: x.email, phone: x.phone, password: "" }); setErr(""); setEditing(x); };

  const save = async () => {
    setErr("");
    try {
      if (editing.id) await api.updateReseller(editing.id, { name: form.name, phone: form.phone, ...(form.password ? { password: form.password } : {}) });
      else await api.createReseller(form);
      setEditing(null);
      await load();
    } catch (e) { setErr(e.message); }
  };

  const doDelete = async () => {
    setErr("");
    try { await api.deleteReseller(toDelete.id); setToDelete(null); await load(); }
    catch (e) { setErr(e.message); setToDelete(null); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Resellers</h2>
          <p className="text-sm text-slate-400">Sub-dealer o tader balance manage korun</p>
        </div>
        {isAdmin && <button onClick={openNew} className="btn-gold"><Plus size={16} /> Add Reseller</button>}
      </div>

      {err && !editing && !toDelete && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {list.map((rr, i) => (
            <motion.div key={rr.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              whileHover={{ y: -4 }} className="card group p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-navy-700 to-navy-900 text-gold-400"><Store size={20} /></div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">{rr.name}</p>
                    <p className="text-xs text-slate-400">{rr.zone}</p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <button onClick={() => openEdit(rr)} className="rounded-lg p-1.5 text-slate-400 hover:bg-gold-500/10 hover:text-gold-500"><Pencil size={14} /></button>
                    <button onClick={() => setToDelete(rr)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <p className="flex items-center justify-between text-slate-500"><span className="flex items-center gap-1.5"><Users size={14} /> Clients</span><span className="font-semibold text-slate-700 dark:text-slate-200">{rr.clients}</span></p>
                {rr.phone && <p className="flex items-center justify-between text-slate-500"><span className="flex items-center gap-1.5"><Phone size={14} /> {rr.phone}</span></p>}
                <p className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-2 text-slate-500">
                  <span className="flex items-center gap-1.5"><Wallet size={14} /> Outstanding Due</span>
                  <span className={`font-bold ${rr.balance > 0 ? "text-rose-500" : "text-emerald-500"}`}>৳ {rr.balance.toLocaleString()}</span>
                </p>
              </div>
              <button onClick={() => openView(rr)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 py-2 text-xs font-semibold text-slate-500 transition hover:border-gold-400 hover:text-gold-500">
                <Eye size={14} /> View Clients
              </button>
            </motion.div>
          ))}
          {list.length === 0 && <p className="col-span-full py-12 text-center text-sm text-slate-400">Kono reseller nei. Add Reseller diye shuru korun.</p>}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)}
        title={editing?.id ? "Edit Reseller" : "Add Reseller"} subtitle={editing?.id ? editing.name : "Notun sub-dealer account"}
        footer={<><button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Save</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Name</span>
            <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dhaka Net Hub" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Email {editing?.id && <span className="text-slate-500 normal-case">(change kora jabe na)</span>}</span>
            <input className={input} type="email" value={form.email} disabled={!!editing?.id} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="reseller@ispora.app" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Phone</span>
            <input className={input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">{editing?.id ? "New Password (optional)" : "Password"}</span>
            <input className={input} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editing?.id ? "Khali rakhle age er ta thakbe" : "Login password"} /></label>
        </div>
      </Modal>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete Reseller?" subtitle={toDelete?.name} size="sm"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={doDelete} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600"><Trash2 size={15} /> Delete</button></>}>
        <p className="text-sm text-slate-500 dark:text-slate-300"><b className="text-slate-700 dark:text-white">{toDelete?.name}</b> reseller delete korbo?</p>
      </Modal>

      <Modal open={!!viewing} onClose={() => setViewing(null)}
        title={`${viewing?.name || ""} — Clients`} subtitle={viewing ? `${viewing.clients} jon customer • Due ৳ ${viewing.balance?.toLocaleString()}` : ""} size="lg">
        {vLoading ? (
          <div className="grid place-items-center py-16"><Loader2 className="animate-spin text-gold-500" /></div>
        ) : vClients.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">Ei reseller er under e kono client nei.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-2.5">Customer</th><th className="px-4 py-2.5">Zone</th>
                  <th className="px-4 py-2.5">Package</th><th className="px-4 py-2.5">Due</th>
                  <th className="px-4 py-2.5">Expiry</th><th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {vClients.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100 dark:border-white/5">
                    <td className="px-4 py-2.5">
                      <p className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
                        <span className={`h-2 w-2 rounded-full ${c.online ? "bg-emerald-500" : "bg-slate-400"}`} />{c.name}
                      </p>
                      <p className="text-xs text-slate-400">{c.phone}</p>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{c.zone || "—"}</td>
                    <td className="px-4 py-2.5 text-slate-500">{c.package || "—"}</td>
                    <td className={`px-4 py-2.5 font-semibold ${c.due > 0 ? "text-rose-500" : "text-slate-500"}`}>৳ {c.due}</td>
                    <td className="px-4 py-2.5 text-slate-500">{c.expiry || "—"}</td>
                    <td className="px-4 py-2.5"><span className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle[c.status]}`}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
