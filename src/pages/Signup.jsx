import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Wifi, Mail, Lock, Building2, User, Phone, UserPlus, Loader2 } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";
import { BRAND } from "../data";
import { LogoMark } from "../components/Logo";

// Self-serve signup — notun ISP register kore 7-din free trial pay, shonge shonge dukhe jay
export default function Signup() {
  const { signup } = useStore();
  const [f, setF] = useState({ businessName: "", ownerName: "", email: "", phone: "", password: "" });
  const [plans, setPlans] = useState([]);
  const [planId, setPlanId] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => { api.publicPlans().then((p) => { setPlans(p); if (p[0]) setPlanId(p[0].id); }).catch(() => {}); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try { await signup({ ...f, email: f.email.trim().toLowerCase(), planId }); }
    catch (e2) { setErr(e2.message || "Signup failed"); }
    finally { setBusy(false); }
  };

  const field = (icon, props) => (
    <div className="relative">
      {icon}
      <input {...props} className="w-full rounded-xl border border-white/10 bg-navy-800 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 outline-none focus:border-gold-500/60" />
    </div>
  );
  const I = (C) => <C size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />;

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-navy-900 via-navy-950 to-black p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 20 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-navy-900/80 p-7 shadow-premium backdrop-blur-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center"><LogoMark size={56} /></div>
          <h1 className="mt-3 font-display text-2xl font-bold text-white">{BRAND.name} e account khulun</h1>
          <p className="text-sm text-slate-400">7-din free trial — card lage na</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {field(I(Building2), { value: f.businessName, onChange: set("businessName"), placeholder: "ISP / Company name", required: true })}
          {field(I(User), { value: f.ownerName, onChange: set("ownerName"), placeholder: "Apnar naam" })}
          {field(I(Mail), { type: "email", value: f.email, onChange: set("email"), placeholder: "Email (login er jonno)", autoComplete: "username", required: true })}
          {field(I(Phone), { value: f.phone, onChange: set("phone"), placeholder: "Mobile" })}
          {field(I(Lock), { type: "password", value: f.password, onChange: set("password"), placeholder: "Password (6+ char)", autoComplete: "new-password", required: true })}

          {plans.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Plan baccha korun</p>
              <div className="grid grid-cols-1 gap-2">
                {plans.map((p) => (
                  <button type="button" key={p.id} onClick={() => setPlanId(p.id)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition ${planId === p.id ? "border-gold-500 bg-gold-500/10" : "border-white/10 bg-navy-800 hover:border-white/20"}`}>
                    <span className="text-white">{p.name} <span className="text-slate-400">· {p.maxUsers === 0 ? "unlimited" : p.maxUsers + " user"}</span></span>
                    <span className="font-semibold text-gold-400">৳{p.priceMonthly.toLocaleString()}/mo</span>
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[11px] text-slate-500">7-din free trial — tarpor ei plan-er bill.</p>
            </div>
          )}

          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{err}</p>}

          <button type="submit" disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 py-2.5 font-semibold text-navy-950 shadow-gold transition hover:brightness-105 disabled:opacity-60">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
            {busy ? "Account toiri hocche..." : "Start Free Trial"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-400">
          Age thekei account ache? <Link to="/login" className="font-semibold text-gold-400 hover:underline">Login korun</Link>
        </p>
      </motion.div>
    </div>
  );
}
