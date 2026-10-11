import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2, Users, UserPlus } from "lucide-react";
import Modal from "../components/Modal";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

export default function SmsGroups() {
  const { notify } = useStore();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [manage, setManage] = useState(null); // group
  const [recipients, setRecipients] = useState([]);
  const [recForm, setRecForm] = useState({ name: "", phone: "" });
  const [err, setErr] = useState("");

  const load = useCallback(async () => { setLoading(true); try { setRows(await api.crudList("sms", "groups")); } catch (e) { notify(e.message); } finally { setLoading(false); } }, [notify]);
  useEffect(() => { load(); }, [load]);

  const create = async () => { setErr(""); try { await api.crudCreate("sms", "groups", { name }); setAdding(false); setName(""); await load(); } catch (e) { setErr(e.message); } };
  const del = async (g) => { try { await api.crudDelete("sms", "groups", g.id); await load(); } catch (e) { notify(e.message); } };
  const openManage = async (g) => { setManage(g); setRecForm({ name: "", phone: "" }); try { setRecipients(await api.smsGroupRecipients(g.id)); } catch (e) { notify(e.message); } };
  const addRec = async () => { try { await api.smsAddRecipient(manage.id, recForm); setRecForm({ name: "", phone: "" }); setRecipients(await api.smsGroupRecipients(manage.id)); await load(); } catch (e) { notify(e.message); } };
  const delRec = async (id) => { try { await api.smsDeleteRecipient(id); setRecipients(await api.smsGroupRecipients(manage.id)); await load(); } catch (e) { notify(e.message); } };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">SMS Group</h2><p className="text-sm text-slate-400">Recipient group — bulk SMS er jonno</p></div>
        <button onClick={() => { setName(""); setErr(""); setAdding(true); }} className="btn-gold"><Plus size={16} /> Add Group</button>
      </div>
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : rows.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><Users className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono group nei.</p></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((g) => (
            <div key={g.id} className="card p-5">
              <div className="flex items-center justify-between"><p className="font-semibold text-slate-800 dark:text-white">{g.name}</p>
                <span className="rounded-lg bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-500">{g.count} recipient</span></div>
              <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3 dark:border-white/5">
                <button onClick={() => openManage(g)} className="inline-flex items-center gap-1 rounded-lg bg-gold-500/10 px-2.5 py-1.5 text-xs font-semibold text-gold-600 hover:bg-gold-500/20"><UserPlus size={13} /> Manage</button>
                <button onClick={() => del(g)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={adding} onClose={() => setAdding(false)} title="Add Group" size="sm"
        footer={<><button onClick={() => setAdding(false)} className="btn-ghost">Cancel</button><button onClick={create} className="btn-gold">Save</button></>}>
        {err && <p className="mb-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
        <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name (e.g. Mirpur Zone)" />
      </Modal>
      <Modal open={!!manage} onClose={() => setManage(null)} title="Manage Recipients" subtitle={manage?.name}>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input className={input} value={recForm.name} onChange={(e) => setRecForm({ ...recForm, name: e.target.value })} placeholder="Name (opt)" />
            <input className={input} value={recForm.phone} onChange={(e) => setRecForm({ ...recForm, phone: e.target.value })} placeholder="01XXXXXXXXX" />
            <button onClick={addRec} className="btn-gold shrink-0"><Plus size={15} /></button>
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {recipients.map((rc) => (
              <div key={rc.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 dark:border-white/5">
                <span className="text-sm text-slate-700 dark:text-slate-200">{rc.name || "—"} · {rc.phone}</span>
                <button onClick={() => delRec(rc.id)} className="text-slate-400 hover:text-rose-500"><Trash2 size={14} /></button>
              </div>
            ))}
            {recipients.length === 0 && <p className="py-4 text-center text-sm text-slate-400">Kono recipient nei.</p>}
          </div>
        </div>
      </Modal>
    </div>
  );
}
