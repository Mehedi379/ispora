import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2, BookOpen, X } from "lucide-react";
import Modal from "../components/Modal";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";

const today = () => new Date().toISOString().slice(0, 10);
const blankLine = () => ({ accountId: "", debit: "", credit: "" });

// readOnly: true -> "Accounting Transactions" (list only, no create)
export default function AccJournal({ readOnly = false }) {
  const { notify } = useStore();
  const [rows, setRows] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [head, setHead] = useState({ date: today(), memo: "" });
  const [lines, setLines] = useState([blankLine(), blankLine()]);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const [j, a] = await Promise.all([api.accJournal(), api.accAccounts()]); setRows(j); setAccounts(a); }
    catch (e) { notify(e.message); } finally { setLoading(false); }
  }, [notify]);
  useEffect(() => { load(); }, [load]);

  const totDr = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totCr = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const openNew = () => { setHead({ date: today(), memo: "" }); setLines([blankLine(), blankLine()]); setErr(""); setAdding(true); };
  const setLine = (i, k, v) => setLines((ls) => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  const save = async () => {
    setErr("");
    try { await api.accCreateJournal({ ...head, lines: lines.filter((l) => l.accountId) }); setAdding(false); await load(); }
    catch (e) { setErr(e.message); }
  };
  const del = async (id) => { try { await api.accDeleteJournal(id); await load(); } catch (e) { notify(e.message); } };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">{readOnly ? "Accounting Transactions" : "Journal"}</h2><p className="text-sm text-slate-400">Double-entry journal {readOnly ? "list" : "(debit = credit)"}</p></div>
        {!readOnly && <button onClick={openNew} disabled={accounts.length === 0} className="btn-gold"><Plus size={16} /> New Entry</button>}
      </div>
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-gold-500" /></div> : rows.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center"><BookOpen className="text-slate-300 dark:text-white/20" size={40} /><p className="mt-3 text-sm text-slate-400">Kono journal entry nei.</p></div>
      ) : (
        <div className="space-y-3">
          {rows.map((e, i) => (
            <motion.div key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }} className="card p-4">
              <div className="flex items-center justify-between">
                <div><span className="text-xs font-semibold text-gold-500">JE-{e.id}</span> <span className="text-sm text-slate-500">{e.date}</span>{e.memo && <span className="text-sm text-slate-400"> · {e.memo}</span>}</div>
                {!readOnly && <button onClick={() => del(e.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 size={13} /></button>}
              </div>
              <table className="mt-2 w-full text-sm">
                <tbody>
                  {e.lines.map((l) => (
                    <tr key={l.id} className="border-t border-slate-50 dark:border-white/5">
                      <td className="py-1.5 text-slate-600 dark:text-slate-300">{l.code} {l.account}</td>
                      <td className="py-1.5 text-right text-emerald-600">{l.debit ? `৳${l.debit.toLocaleString()}` : ""}</td>
                      <td className="py-1.5 text-right text-rose-500">{l.credit ? `৳${l.credit.toLocaleString()}` : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          ))}
        </div>
      )}
      <Modal open={adding} onClose={() => setAdding(false)} title="New Journal Entry" size="lg"
        footer={<><button onClick={() => setAdding(false)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-gold">Post Entry</button></>}>
        <div className="space-y-4">
          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{err}</p>}
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Date</span>
              <input className={input} type="date" value={head.date} onChange={(e) => setHead({ ...head, date: e.target.value })} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Memo</span>
              <input className={input} value={head.memo} onChange={(e) => setHead({ ...head, memo: e.target.value })} /></label>
          </div>
          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <Dropdown
                  className="flex-1"
                  value={l.accountId}
                  options={accounts.map((a) => ({ value: a.id, label: `${a.code} ${a.name}` }))}
                  onChange={(v) => setLine(i, "accountId", v || "")}
                  placeholder="Account"
                />
                <input className={`${input} w-24`} type="number" placeholder="Dr" value={l.debit} onChange={(e) => setLine(i, "debit", e.target.value)} />
                <input className={`${input} w-24`} type="number" placeholder="Cr" value={l.credit} onChange={(e) => setLine(i, "credit", e.target.value)} />
                <button onClick={() => setLines((ls) => ls.length > 2 ? ls.filter((_, idx) => idx !== i) : ls)} className="rounded-lg p-2 text-slate-400 hover:text-rose-500"><X size={14} /></button>
              </div>
            ))}
            <button onClick={() => setLines((ls) => [...ls, blankLine()])} className="btn-ghost text-xs"><Plus size={13} /> Add Line</button>
          </div>
          <div className={`flex justify-end gap-4 text-sm font-semibold ${totDr === totCr && totDr > 0 ? "text-emerald-500" : "text-rose-500"}`}>
            <span>Dr: ৳{totDr.toLocaleString()}</span><span>Cr: ৳{totCr.toLocaleString()}</span>{totDr !== totCr && <span>(mismatch)</span>}
          </div>
        </div>
      </Modal>
    </div>
  );
}
