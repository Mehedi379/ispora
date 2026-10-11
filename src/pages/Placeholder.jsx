import { motion } from "framer-motion";
import { Construction } from "lucide-react";

export default function Placeholder({ title, note }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="grid min-h-[60vh] place-items-center">
      <div className="card max-w-md p-10 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-navy-950 shadow-gold">
          <Construction size={28} />
        </div>
        <h2 className="mt-5 font-display text-xl font-bold text-slate-800 dark:text-white">{title}</h2>
        <p className="mt-2 text-sm text-slate-400">
          {note || "Ei module ta porer phase e banano hobe. Core (Dashboard, Clients, Invoices, Packages, Payments) ekhon ready."}
        </p>
      </div>
    </motion.div>
  );
}
