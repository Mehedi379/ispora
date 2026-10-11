import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wifi, Check, ArrowRight, Users, Zap, ShieldCheck, Router, BarChart3, Headset,
  Boxes, MessageSquare, CreditCard, Network, Server, Clock, TrendingUp, Lock,
  ChevronDown, Star, Sparkles, FileText, Wallet,
} from "lucide-react";
import { api } from "../api";
import { BRAND } from "../data";

const FEATURES = [
  { icon: Users, title: "Customer & Billing", desc: "Customer, package, invoice, due, auto-bill — puro billing cycle ek jaygay. PPPoE, zone, box, connection type soho full profile." },
  { icon: Router, title: "MikroTik Integration", desc: "RouterOS API diye PPPoE auto connect/disconnect, bulk import, backup. Mock + real mode — router chara-o test kora jay." },
  { icon: Server, title: "OLT & Network", desc: "OLT/ONU monitoring, PON port, optical signal, ar interactive network diagram (POP, link, distributed items)." },
  { icon: BarChart3, title: "Accounting & Reports", desc: "Double-entry accounting, income/expense, trial balance, profit-loss, BTRC monthly report, financial statement." },
  { icon: MessageSquare, title: "SMS & VAS", desc: "Bulk SMS, template, group, due reminder, ar VAS (IPTV, Static IP, Cloud) — extra revenue stream." },
  { icon: Headset, title: "HR, Support & Inventory", desc: "Employee, payroll, attendance, leave; support ticketing; inventory, assets, bandwidth buy/sale — full ERP." },
];

const BENEFITS = [
  { icon: Clock, title: "Mash-sheshe ghonta bachbe", desc: "Manual bill banano bondho — auto invoice, auto line-cut, auto reminder. 20+ ghonta kaj minute-e." },
  { icon: Wallet, title: "Revenue leak bondho", desc: "Prottek due track, grace period, auto expire — ekta taka-o miss hobe na. Collection report real-time." },
  { icon: ShieldCheck, title: "Secure & role-based", desc: "Admin/reseller/collector role, activity log, encrypted MikroTik/SMS/payment key — data surokkhito." },
  { icon: TrendingUp, title: "Scale koro nishchinte", desc: "100 theke 10,000+ customer — multi-tenant cloud, kono server jhamela nei. Jotodin cholbe totodin bill." },
];

const STEPS = [
  { n: "1", title: "Signup — 7 din free", desc: "Business tottho diye account khulun, card lage na. Shonge shonge pura software khule jabe." },
  { n: "2", title: "Setup korun", desc: "Zone, package, MikroTik server, customer import — kayek minute-e nijer ISP ready." },
  { n: "3", title: "Grow korun", desc: "Auto billing, SMS, accounting cholte thakbe — apni shudhu business barabe." },
];

const MODULES = [
  "Configuration", "VAS", "Clients", "Billing", "MikroTik Server", "HR & Payroll",
  "OLT Management", "Network Diagram", "Leave Management", "MAC Reseller", "Events",
  "Support & Ticketing", "Bandwidth Buy", "Task Management", "Bandwidth Sale",
  "Purchase", "Sales & Service", "Inventory", "Assets", "Accounting", "Reports",
  "SMS Service", "Affiliation", "System Setup",
];

const FAQS = [
  { q: "Trial-e ki ki pabo?", a: "Puro software — kono feature lock na. 7 din free, card lage na, kokhono auto-charge hobe na." },
  { q: "MikroTik router lage?", a: "Na. Mock mode-e router chara-i shob test kora jay. Real router thakle API diye connect kore PPPoE auto on/off." },
  { q: "Payment kivabe debo?", a: "bKash / Nagad / Rocket / Bank — ba online gateway (SSLCOMMERZ). Trial sesh-e nijer convenience moto renew korun." },
  { q: "Amar customer-der data surokkhito?", a: "Protita ISP-er data purodhik alada (multi-tenant isolation), encrypted key, role-based access ar activity log." },
  { q: "Koto customer porjonto cholbe?", a: "Plan onujayi — chhoto theke boro, user barle plan upgrade. Unlimited plan-o ache." },
];

export default function Landing() {
  const [plans, setPlans] = useState([]);
  const [faq, setFaq] = useState(0);
  useEffect(() => { api.publicPlans().then(setPlans).catch(() => {}); }, []);
  return (
    <div className="min-h-screen scroll-smooth bg-navy-950 text-white">
      {/* ===== Nav ===== */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-navy-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-navy-950 shadow-gold"><Wifi size={18} /></div>
            <span className="font-display text-lg font-extrabold">{BRAND.name}</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#features" className="hover:text-gold-400">Features</a>
            <a href="#benefits" className="hover:text-gold-400">Keno</a>
            <a href="#pricing" className="hover:text-gold-400">Pricing</a>
            <a href="#faq" className="hover:text-gold-400">FAQ</a>
          </nav>
          <div className="flex items-center gap-2.5">
            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-gold-400">Login</Link>
            <Link to="/signup" className="rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 px-4 py-2 text-sm font-semibold text-navy-950 shadow-gold transition hover:brightness-105">Free Trial</Link>
          </div>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-[-10%] h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gold-500/15 blur-[120px]" />
        <div className="relative mx-auto max-w-6xl px-5 pb-10 pt-16 text-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-xs font-semibold text-gold-300">
            <Sparkles size={13} /> Bangladesh-er #1 smart ISP software
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl font-extrabold leading-[1.1] sm:text-6xl">
            ISP business chalan<br /><span className="bg-gradient-to-r from-gold-300 via-gold-400 to-gold-600 bg-clip-text text-transparent">ekdom automatic</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">
            Customer, bill, MikroTik, OLT, accounting, HR, SMS — puro ISP ekta software-e. Auto billing, auto line-cut, real-time report. Aaj-i shuru korun, <b className="text-white">7 din free</b>.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/signup" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 px-7 py-3.5 font-semibold text-navy-950 shadow-gold transition hover:brightness-105">Start Free Trial <ArrowRight size={18} /></Link>
            <a href="#features" className="rounded-xl border border-white/15 px-7 py-3.5 font-semibold text-slate-200 transition hover:bg-white/5">Feature dekhun</a>
          </motion.div>
          <p className="mt-3 text-xs text-slate-500">Card lage na · 7 din free · kobhu auto-charge na</p>
          {/* App dashboard mockup */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="mx-auto mt-12 max-w-4xl rounded-2xl border border-white/10 bg-navy-900/70 p-3 shadow-premium">
            <div className="mb-3 flex items-center gap-1.5 px-2 pt-1"><span className="h-3 w-3 rounded-full bg-rose-400/70" /><span className="h-3 w-3 rounded-full bg-amber-400/70" /><span className="h-3 w-3 rounded-full bg-emerald-400/70" /></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[["Total Clients", "1,240", "text-sky-400"], ["This Month", "৳8.4L", "text-emerald-400"], ["Due", "৳62K", "text-rose-400"], ["Online", "1,118", "text-gold-400"]].map(([l, v, c]) => (
                <div key={l} className="rounded-xl bg-navy-800/80 p-4 text-left"><p className="text-[11px] uppercase tracking-wide text-slate-400">{l}</p><p className={`mt-1 font-display text-2xl font-bold ${c}`}>{v}</p></div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[Network, BarChart3, Router].map((Ic, i) => (<div key={i} className="flex h-20 items-center justify-center rounded-xl bg-navy-800/60"><Ic size={26} className="text-gold-500/60" /></div>))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== Trust bar ===== */}
      <section className="border-y border-white/5 bg-navy-900/40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-5 py-5 text-sm text-slate-400">
          <span className="flex items-center gap-2"><Boxes size={16} className="text-gold-500" /> 24+ modules</span>
          <span className="flex items-center gap-2"><Lock size={16} className="text-gold-500" /> Multi-tenant & secure</span>
          <span className="flex items-center gap-2"><CreditCard size={16} className="text-gold-500" /> bKash · Nagad · SSLCOMMERZ</span>
          <span className="flex items-center gap-2"><Router size={16} className="text-gold-500" /> MikroTik + OLT</span>
          <span className="flex items-center gap-2"><Zap size={16} className="text-gold-500" /> Auto billing engine</span>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-16">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-gold-400">Features</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Ja ja lagbe, shob ache</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">Ekta ISP chalate jei tool gula dorkar — billing theke network, accounting theke SMS — shob ek platform-e.</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(i * 0.05, 0.3) }}
              className="group rounded-2xl border border-white/10 bg-navy-900/60 p-6 transition hover:border-gold-500/40 hover:bg-navy-900">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-gold-500/15 text-gold-400 transition group-hover:scale-110"><f.icon size={22} /></div>
              <h3 className="mt-4 text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== Benefits (keno ISPora) ===== */}
      <section id="benefits" className="border-y border-white/5 bg-navy-900/40">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-gold-400">Keno ISPora</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Use korle ki lab</h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b, i) => (
              <motion.div key={b.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(i * 0.06, 0.3) }}
                className="rounded-2xl border border-white/10 bg-navy-950/60 p-6 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-400"><b.icon size={22} /></div>
                <h3 className="mt-4 font-semibold text-white">{b.title}</h3>
                <p className="mt-1.5 text-sm text-slate-400">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-gold-400">3 step-e shuru</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Kivabe kaj kore</h2>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div key={s.n} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="relative rounded-2xl border border-white/10 bg-navy-900/60 p-6">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 font-display text-lg font-bold text-navy-950">{s.n}</div>
              <h3 className="mt-4 font-semibold text-white">{s.title}</h3>
              <p className="mt-1.5 text-sm text-slate-400">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== Modules showcase ===== */}
      <section className="border-y border-white/5 bg-navy-900/40">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-gold-400">24+ modules</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Ekta software-e puro ERP</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">Alada alada software kinte hobe na — shob ek jaygay, ekta subscription-e.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {MODULES.map((m) => (
              <span key={m} className="rounded-full border border-white/10 bg-navy-950/60 px-3.5 py-1.5 text-sm text-slate-300 transition hover:border-gold-500/40 hover:text-gold-300">{m}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Pricing ===== */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-16">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-gold-400">Pricing</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Simple, customer-onujayi dam</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">Jotodin cholbe totodin bill. Jekono shomoy upgrade/cancel. Shob plan-e 7-din free trial.</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(i * 0.06, 0.3) }}
              className={`relative rounded-2xl border p-6 ${i === 0 ? "border-gold-500/50 bg-gradient-to-b from-gold-500/10 to-transparent" : "border-white/10 bg-navy-900/60"}`}>
              {i === 0 && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold-500 px-3 py-0.5 text-[11px] font-bold text-navy-950">Popular</span>}
              <h3 className="font-display text-xl font-bold text-white">{p.name}</h3>
              <p className="mt-3"><span className="font-display text-4xl font-extrabold text-gold-400">৳{p.priceMonthly.toLocaleString()}</span><span className="text-slate-400">/mo</span></p>
              <ul className="mt-5 space-y-2.5 text-sm text-slate-300">
                <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> {p.maxUsers === 0 ? "Unlimited customer" : `${p.maxUsers.toLocaleString()} porjonto customer`}</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> {p.features === "*" ? "Shob 24+ module" : p.features}</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> MikroTik + OLT + Accounting</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> 7-din free trial</li>
              </ul>
              <Link to="/signup" className={`mt-6 block rounded-xl py-2.5 text-center font-semibold transition ${i === 0 ? "bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950 shadow-gold hover:brightness-105" : "border border-white/15 text-white hover:bg-white/5"}`}>Shuru korun</Link>
            </motion.div>
          ))}
          {plans.length === 0 && <p className="col-span-full text-center text-sm text-slate-500">Plan load hocche...</p>}
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="border-t border-white/5 bg-navy-900/40">
        <div className="mx-auto max-w-3xl px-5 py-16">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-gold-400">FAQ</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Common proshno</h2>
          </div>
          <div className="mt-8 space-y-3">
            {FAQS.map((item, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-white/10 bg-navy-950/60">
                <button onClick={() => setFaq(faq === i ? -1 : i)} className="flex w-full items-center justify-between px-5 py-4 text-left">
                  <span className="font-medium text-white">{item.q}</span>
                  <ChevronDown size={18} className={`shrink-0 text-gold-500 transition ${faq === i ? "rotate-180" : ""}`} />
                </button>
                {faq === i && <p className="px-5 pb-4 text-sm leading-relaxed text-slate-400">{item.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA band ===== */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/15 blur-[120px]" />
        <div className="relative mx-auto max-w-3xl px-5 py-20 text-center">
          <div className="mx-auto mb-4 flex justify-center gap-1 text-gold-400">{[0, 1, 2, 3, 4].map((s) => <Star key={s} size={18} fill="currentColor" />)}</div>
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Aaj-i apnar ISP automate korun</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">7 din free try korun — card lage na. Pochondo na hole kichu dite hobe na.</p>
          <Link to="/signup" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 px-8 py-4 font-semibold text-navy-950 shadow-gold transition hover:brightness-105">Start Free Trial <ArrowRight size={18} /></Link>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 text-navy-950"><Wifi size={16} /></div>
            <span className="font-display font-bold">{BRAND.name}</span>
            <span className="text-sm text-slate-500">— {BRAND.tagline}</span>
          </div>
          <div className="flex items-center gap-5 text-sm text-slate-400">
            <a href="#features" className="hover:text-gold-400">Features</a>
            <a href="#pricing" className="hover:text-gold-400">Pricing</a>
            <Link to="/login" className="hover:text-gold-400">Login</Link>
            <Link to="/signup" className="font-semibold text-gold-400 hover:underline">Free Trial</Link>
          </div>
        </div>
        <p className="pb-6 text-center text-xs text-slate-600">© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
      </footer>
    </div>
  );
}
