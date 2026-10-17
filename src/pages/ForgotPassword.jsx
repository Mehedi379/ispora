import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, KeyRound, ArrowLeft, Loader2, Check } from "lucide-react";
import { api } from "../api";
import { BRAND } from "../data";
import { LogoMark } from "../components/Logo";

const I = (C) => <C size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email"); // email -> reset
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  const requestReset = async (e) => {
    e.preventDefault();
    setErr(""); setOk(""); setBusy(true);
    try {
      const r = await api.forgotPassword(email.trim().toLowerCase());
      if (r.resetUrl) setResetUrl(r.resetUrl); // dev-only
      if (r.resetUrl) { setStep("reset"); setToken(""); } else { setOk("Password reset link email e pathano hoyeche (check koro)."); }
    } catch (e2) { setErr(e2.message || "Failed"); } finally { setBusy(false); }
  };

  const doReset = async (e) => {
    e.preventDefault();
    setErr(""); setOk("");
    if (!token) return setErr("Token din (email er link theke)");
    if (password.length < 6) return setErr("Password 6+ char");
    setBusy(true);
    try {
      await api.resetPassword(token, password);
      setOk("Password reset holo! Login korun.");
      setStep("done");
      setTimeout(() => navigate("/login"), 2000);
    } catch (e2) { setErr(e2.message || "Failed"); } finally { setBusy(false); }
  };

  if (step === "done") {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-br from-navy-900 via-navy-950 to-black p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", damping: 20 }}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-navy-900/80 p-8 shadow-premium backdrop-blur-xl text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-400"><Check size={28} /></div>
          <h2 className="font-display text-2xl font-bold text-white mb-2">Password Reset Success!</h2>
          <p className="text-sm text-slate-300 mb-4">Password change hoyeche. Abor login korun.</p>
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-gold-400 hover:underline">Login page-e</Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-navy-900 via-navy-950 to-black p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 20 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-navy-900/80 p-7 shadow-premium backdrop-blur-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center"><LogoMark size={56} /></div>
          <h1 className="mt-3 font-display text-2xl font-bold text-white">{BRAND.name}</h1>
          <p className="text-sm text-slate-400">
            {step === "email" ? "Forgot password? Reset korte email din" : "Enter notun password + reset token"}
          </p>
        </div>

        {step === "email" ? (
          <form onSubmit={requestReset} className="space-y-3">
            <div className="relative">
              {I(Mail)}
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address"
                autoComplete="username" required
                className="w-full rounded-xl border border-white/10 bg-navy-800 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 outline-none focus:border-gold-500/60" />
            </div>
            {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{err}</p>}
            {ok && <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">{ok}</p>}
            {resetUrl && (
              <div className="rounded-lg bg-sky-500/10 px-3 py-2 text-xs">
                <p className="text-sky-400 mb-1">Dev mode — reset URL:</p>
                <p className="break-all text-slate-300">{resetUrl}</p>
                <p className="mt-1 text-xs text-slate-500">Token auto-filled below. Production-e email theke token copy kore paste korun.</p>
                <button type="button" onClick={() => {
                  const u = new URL(resetUrl);
                  setToken(u.searchParams.get("token") || "");
                  setStep("reset");
                }} className="mt-1 text-xs text-gold-400 hover:underline">Use this token</button>
              </div>
            )}
            {!resetUrl && (
              <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 py-2.5 font-semibold text-navy-950 shadow-gold transition hover:brightness-105 disabled:opacity-60">
                {busy ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                {busy ? "Sending..." : "Send Reset Link"}
              </button>
            )}
          </form>
        ) : (
          <form onSubmit={doReset} className="space-y-3">
            <div className="relative">
              {I(KeyRound)}
              <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Reset Token (from email link)" required
                className="w-full rounded-xl border border-white/10 bg-navy-800 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 outline-none focus:border-gold-500/60 font-mono text-xs" />
            </div>
            <div className="relative">
              {I(Lock)}
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password (6+ char)" required minLength={6}
                autoComplete="new-password"
                className="w-full rounded-xl border border-white/10 bg-navy-800 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 outline-none focus:border-gold-500/60" />
            </div>
            {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{err}</p>}
            <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 py-2.5 font-semibold text-navy-950 shadow-gold transition hover:brightness-105 disabled:opacity-60">
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
              {busy ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className="mt-4 border-t border-white/5 pt-3 text-center">
          <Link to="/login" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-gold-400">
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
