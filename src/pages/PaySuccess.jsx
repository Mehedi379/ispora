import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useStore } from "../store";

// SSLCOMMERZ redirect-er por landing (success/fail). IPN server-side activate kore,
// ekhane shudhu entitlements recheck kore app-e firiye di.
export default function PaySuccess({ fail = false }) {
  const { refreshEntitlements } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isFail = fail || location.pathname.includes("fail");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    (async () => { await refreshEntitlements(); setBusy(false); })();
  }, [refreshEntitlements]);

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-navy-900 via-navy-950 to-black p-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-navy-900/80 p-7 text-center text-white shadow-premium">
        {busy ? <Loader2 size={34} className="mx-auto animate-spin text-gold-500" /> : isFail ? (
          <><XCircle size={44} className="mx-auto text-rose-400" /><h1 className="mt-3 font-display text-xl font-bold">Payment hoyni</h1><p className="mt-1 text-sm text-slate-400">Abar try korun.</p></>
        ) : (
          <><CheckCircle2 size={44} className="mx-auto text-emerald-400" /><h1 className="mt-3 font-display text-xl font-bold">Payment successful!</h1><p className="mt-1 text-sm text-slate-400">Subscription active hoye geche.</p></>
        )}
        {!busy && (
          <button onClick={() => navigate("/")} className="mt-5 w-full rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 py-2.5 font-semibold text-navy-950 shadow-gold transition hover:brightness-105">
            Dashboard e jan
          </button>
        )}
      </motion.div>
    </div>
  );
}
