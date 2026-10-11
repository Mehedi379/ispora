import { motion } from "framer-motion";
import { Lock, LogOut } from "lucide-react";
import { useStore } from "../store";
import PayPanel from "../components/PayPanel";

// Trial/subscription sesh hole pura app lock — pay/renew kore active na kora porjonto.
// Ei screen kata jay na (close nei) — shudhu pay ba logout.
export default function LockScreen() {
  const { ent, logout } = useStore();
  const expiredTrial = ent?.status === "trial";
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-navy-900 via-navy-950 to-black p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-navy-900/80 p-7 text-center shadow-premium backdrop-blur-xl">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-500/15 text-rose-400"><Lock size={26} /></div>
        <h1 className="mt-4 font-display text-2xl font-bold text-white">{expiredTrial ? "Trial sesh hoye geche" : "Subscription inactive"}</h1>
        <p className="mt-2 text-sm text-slate-400">
          {ent?.planName ? <>Plan: <b className="text-slate-200">{ent.planName}</b>. </> : null}
          Bill pay korle shonge shonge abar shob kaj khule jabe.
        </p>

        <div className="mt-6 text-left">
          <PayPanel status={ent?.status} />
        </div>

        <button onClick={logout} className="mt-5 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200">
          <LogOut size={15} /> Log out
        </button>
      </motion.div>
    </div>
  );
}
