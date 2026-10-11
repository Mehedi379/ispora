import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, ArrowRight, Sparkles } from "lucide-react";
import { useStore } from "../store";

// Feature locked — tenant-er plan-e ei module nei, upgrade dorkar
export default function Upgrade() {
  const { ent } = useStore();
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-md rounded-2xl border border-gold-500/30 bg-gold-500/5 p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gold-500/15 text-gold-500"><Lock size={26} /></div>
        <h2 className="mt-4 font-display text-2xl font-bold text-slate-800 dark:text-white">Ei feature-ta locked</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
          Apnar current plan {ent?.planName ? <b>({ent.planName})</b> : null}-e ei module nei. Upgrade korle khule jabe.
        </p>
        <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-amber-300">
          <Sparkles size={15} /> Upgrade-er jonno amader sathe jogajog korun
        </p>
        <Link to="/" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 px-5 py-2.5 font-semibold text-navy-950 shadow-gold transition hover:brightness-105">
          Dashboard e firun <ArrowRight size={16} />
        </Link>
      </motion.div>
    </div>
  );
}
