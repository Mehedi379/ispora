import { useState } from "react";
import { motion } from "framer-motion";
import { Wifi, Mail, Lock, LogIn, Loader2 } from "lucide-react";
import { useStore } from "../store";
import { BRAND } from "../data";

export default function Login() {
  const { login } = useStore();
  // Demo credential prefill/printage chilo — production-e public login page-e
  // sheta sekondi kache admin account khule dito. Kew ekhon only UI theke janbe na.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try { await login(email.trim().toLowerCase(), password); }
    catch (e2) { setErr(e2.message || "Login failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-navy-900 via-navy-950 to-black p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 20 }}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-navy-900/80 p-7 shadow-premium backdrop-blur-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-navy-950 shadow-gold">
            <Wifi size={26} />
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold text-white">{BRAND.name}</h1>
          <p className="text-sm text-slate-400">{BRAND.tagline}</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
              autoComplete="username" required
              className="w-full rounded-xl border border-white/10 bg-navy-800 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 outline-none focus:border-gold-500/60" />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
              autoComplete="current-password" required
              className="w-full rounded-xl border border-white/10 bg-navy-800 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 outline-none focus:border-gold-500/60" />
          </div>

          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{err}</p>}

          <button type="submit" disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 py-2.5 font-semibold text-navy-950 shadow-gold transition hover:brightness-105 disabled:opacity-60">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
            {busy ? "Login hocche..." : "Login"}
          </button>
        </form>

      </motion.div>
    </div>
  );
}
