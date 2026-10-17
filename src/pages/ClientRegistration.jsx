import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Phone, Mail, MapPin, Package, UserPlus, Check, Building } from "lucide-react";
import { api } from "../api";
import { BRAND } from "../data";
import { LogoMark } from "../components/Logo";

const I = (C) => <C size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />;
const field = (icon, props) => (
  <div className="relative">
    {icon}
    <input {...props} className="w-full rounded-xl border border-white/10 bg-navy-800 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 outline-none focus:border-gold-500/60" />
  </div>
);

export default function ClientRegistration() {
  const navigate = useNavigate();
  const [f, setF] = useState({ name: "", phone: "", email: "", address: "", area: "", package: "", note: "" });
  const [zones, setZones] = useState([]);
  const [packages, setPackages] = useState([]);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    api.listZones?.().then(setZones).catch(() => {});
    api.listPackages?.().then(setPackages).catch(() => {});
  }, []);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setOk(false);
    if (!f.name || !f.phone) return setErr("Name o phone minimum din");
    try {
      await api.clientRegister(f);
      setOk(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (e2) {
      setErr(e2.message || "Request failed");
    }
  };

  if (ok) {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-br from-navy-900 via-navy-950 to-black p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", damping: 20 }}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-navy-900/80 p-8 shadow-premium backdrop-blur-xl text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-400"><Check size={28} /></div>
          <h2 className="font-display text-2xl font-bold text-white mb-2">Registration Successful!</h2>
          <p className="text-sm text-slate-300 mb-4">Apnar request ta pathano hoyeche. Admin review kore portal credentials issue korbe.</p>
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-gold-400 hover:underline">Login page-e pherot</Link>
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
          <h1 className="mt-3 font-display text-2xl font-bold text-white">{BRAND.name} — Client Registration</h1>
          <p className="text-sm text-slate-400">Nijer account khulun, admin approve korle portal access paben</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {field(I(User), { value: f.name, onChange: set("name"), placeholder: "Full Name", required: true })}
          {field(I(Phone), { value: f.phone, onChange: set("phone"), placeholder: "Mobile Number", required: true, type: "tel" })}
          {field(I(Mail), { value: f.email, onChange: set("email"), placeholder: "Email (optional)", type: "email" })}
          {field(I(MapPin), { value: f.address, onChange: set("address"), placeholder: "Present Address" })}
          <div className="relative">
            <Building size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input list="zone-select" value={f.area} onChange={set("area")} placeholder="Zone / Area"
              className="w-full rounded-xl border border-white/10 bg-navy-800 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 outline-none focus:border-gold-500/60" />
            <datalist id="zone-select">{zones.map((z) => <option key={z.id} value={z.name} />)}</datalist>
          </div>
          <div className="relative">
            <Package size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input list="pkg-select" value={f.package} onChange={set("package")} placeholder="Package (optional)"
                className="w-full rounded-xl border border-white/10 bg-navy-800 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 outline-none focus:border-gold-500/60" />
            <datalist id="pkg-select">{packages.map((p) => <option key={p.id} value={p.name} />)}</datalist>
          </div>
          <div className="relative">
            <textarea value={f.note} onChange={set("note")} placeholder="Note (optional)" rows={3}
              className="w-full rounded-xl border border-white/10 bg-navy-800 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 outline-none focus:border-gold-500/60" />
          </div>

          {err && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{err}</p>}

          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 py-2.5 font-semibold text-navy-950 shadow-gold transition hover:brightness-105">
            <UserPlus size={18} /> Submit Registration
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-400">
          Staff login? <Link to="/login" className="font-semibold text-gold-400 hover:underline">Login here</Link>
        </p>
      </motion.div>
    </div>
  );
}
