import { useState, useRef, useEffect, useMemo } from "react";
import { Search, Bell, Menu, Moon, Sun, LogOut, AlertTriangle, Clock, X, FileText, CalendarClock, LifeBuoy, MonitorSmartphone, Info, UserRound, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store";
import SubscriptionModal from "./SubscriptionModal";
import ContactSupportModal from "./ContactSupportModal";

export default function Topbar({ onMenu, dark, setDark }) {
  const navigate = useNavigate();
  const { user, logout, clients, ent } = useStore();
  const initial = (user?.name || "A").charAt(0).toUpperCase();
  const roleLabel = user?.role === "admin" ? "Super Admin" : user?.role === "reseller" ? "Reseller" : "Collector";

  const [q, setQ] = useState("");
  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const isOwner = user?.isPlatformOwner;
  const bellRef = useRef(null);
  const menuRef = useRef(null);
  const [seen, setSeen] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("ispora.seenNotifs") || "[]")); }
    catch { return new Set(); }
  });

  const dueList = useMemo(() => clients.filter((c) => c.status === "due" || (c.due || 0) > 0), [clients]);
  const expiringList = useMemo(() => {
    const soon = new Date(); soon.setDate(soon.getDate() + 5);
    const today = new Date().toISOString().slice(0, 10);
    const limit = soon.toISOString().slice(0, 10);
    return clients.filter((c) => c.expiry && c.expiry >= today && c.expiry <= limit);
  }, [clients]);
  const notifKeys = useMemo(() => [...dueList.map((c) => `due-${c.id}`), ...expiringList.map((c) => `exp-${c.id}`)], [dueList, expiringList]);
  const unseenCount = useMemo(() => notifKeys.filter((k) => !seen.has(k)).length, [notifKeys, seen]);

  // Next bill date = aagami maaser 1 tarikh
  const nextBill = useMemo(() => {
    const d = new Date(); const n = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return n.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }, []);
  const unpaidCount = dueList.length;

  // SaaS subscription expiry (tenant) — "Next Bill" badge ekhon eta dekhabe
  const subEnd = ent && !ent.isPlatformOwner ? (ent.status === "trial" ? ent.trialEndsAt : ent.nextBillDate) : null;
  const subDays = ent && !ent.isPlatformOwner ? (ent.daysLeft ?? null) : null;
  const subEndStr = subEnd ? new Date(subEnd).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;

  useEffect(() => {
    if (!bellOpen) return;
    setSeen((prev) => { const next = new Set(prev); notifKeys.forEach((k) => next.add(k)); const alive = new Set(notifKeys); return new Set([...next].filter((k) => alive.has(k))); });
  }, [bellOpen, notifKeys]);
  useEffect(() => { try { localStorage.setItem("ispora.seenNotifs", JSON.stringify([...seen])); } catch { /* ignore */ } }, [seen]);
  useEffect(() => {
    const onDoc = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const submitSearch = (e) => { e.preventDefault(); const term = q.trim(); navigate(term ? `/clients?q=${encodeURIComponent(term)}` : "/clients"); };

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 bg-navy-900 px-3 py-2.5 text-white shadow-md md:px-5">
      <button onClick={onMenu} className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden"><Menu size={20} /></button>

      {!isOwner && (
        <form onSubmit={submitSearch} className="relative hidden w-56 sm:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Customer"
            className="w-full rounded-md border border-white/10 bg-white/5 py-2 pl-9 pr-8 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-gold-400" />
          {q && <button type="button" onClick={() => setQ("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"><X size={14} /></button>}
        </form>
      )}
      {isOwner && <span className="hidden text-sm font-semibold text-slate-300 sm:block">SaaS Owner Panel</span>}

      <div className="flex flex-1 items-center justify-end gap-2">
        {!isOwner && <>
        <button onClick={() => navigate("/invoices?status=unpaid")} className="hidden items-center gap-1.5 rounded-full bg-gold-500 px-3 py-1.5 text-xs font-semibold text-navy-950 transition hover:bg-gold-400 lg:inline-flex">
          <Info size={13} /> Inv. {unpaidCount > 0 ? `${unpaidCount} unpaid — click` : "Please Click for Details"}
        </button>
        {/* Subscription expiry / next bill — click kore pay popup (7 diner moddhe hole rong badle) */}
        {ent && !ent.isPlatformOwner && (
          <button onClick={() => setSubOpen(true)} title="Subscription / bill pay"
            className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition hover:brightness-110 lg:inline-flex ${subDays == null ? "bg-gold-500 text-navy-950" : subDays <= 2 ? "bg-rose-500 text-white" : subDays <= 7 ? "bg-amber-500 text-navy-950" : "bg-gold-500 text-navy-950"}`}>
            <CalendarClock size={13} /> {subEnd ? `Next Bill: ${subEndStr}` : "Subscription: Active"}{subDays != null ? ` · ${subDays}d` : ""}
          </button>
        )}
        {/* Contact ISPora (owner) support */}
        <button onClick={() => setContactOpen(true)} className="hidden items-center gap-1.5 px-2 text-xs font-medium text-slate-200 transition hover:text-gold-400 xl:inline-flex">
          <LifeBuoy size={15} /> Contact Support
        </button>
        {/* Online Client Monitoring */}
        <button onClick={() => navigate("/live")} className="hidden items-center gap-1.5 px-2 text-xs font-medium text-slate-200 transition hover:text-gold-400 xl:inline-flex">
          <MonitorSmartphone size={15} /> Online Client Monitoring
        </button>
        </>}

        <button onClick={() => setDark(!dark)} className="rounded-lg p-2 text-slate-300 transition hover:text-gold-400">{dark ? <Sun size={17} /> : <Moon size={17} />}</button>

        {!isOwner && (
        <div className="relative" ref={bellRef}>
          <button onClick={() => setBellOpen((o) => !o)} className="relative rounded-lg p-2 text-slate-300 transition hover:text-gold-400">
            <Bell size={17} />
            {unseenCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-navy-950">{unseenCount > 99 ? "99+" : unseenCount}</span>}
          </button>
          {bellOpen && (
            <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-white/10 bg-navy-900 text-slate-200 shadow-xl">
              <div className="border-b border-white/5 px-4 py-3 text-sm font-semibold">Notifications</div>
              <div className="max-h-80 overflow-y-auto">
                {notifKeys.length === 0 && <p className="px-4 py-6 text-center text-sm text-slate-400">Kono notification nei 🎉</p>}
                {dueList.length > 0 && (
                  <button onClick={() => { setBellOpen(false); navigate("/clients/due"); }} className="flex w-full items-center gap-3 border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-rose-500/10 text-rose-500"><AlertTriangle size={16} /></span>
                    <span className="min-w-0"><p className="text-sm font-medium">{dueList.length} customer er due ache</p><p className="truncate text-xs text-slate-400">Collection baki — bill collect korun</p></span>
                  </button>
                )}
                {expiringList.length > 0 && (
                  <button onClick={() => { setBellOpen(false); navigate("/clients"); }} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-500"><Clock size={16} /></span>
                    <span className="min-w-0"><p className="text-sm font-medium">{expiringList.length} package 5 diner moddhe expire hobe</p><p className="truncate text-xs text-slate-400">Renew reminder pathan</p></span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        )}

        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 rounded-lg border border-white/10 py-1 pl-1 pr-2.5 transition hover:bg-white/5">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-gold-400 to-gold-600 text-xs font-bold text-navy-950">{initial}</div>
            <div className="hidden text-left md:block"><p className="text-xs font-semibold">{user?.name || "Admin"}</p><p className="text-[10px] text-slate-400">{roleLabel}</p></div>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-navy-900 text-slate-200 shadow-xl">
              <div className="border-b border-white/5 px-4 py-2.5"><p className="text-sm font-semibold">{user?.name || "Admin"}</p><p className="text-[11px] text-slate-400">{roleLabel}</p></div>
              <button onClick={() => { setMenuOpen(false); navigate("/account"); }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition hover:bg-white/5"><UserRound size={15} /> My Profile</button>
              {!user?.isPlatformOwner && (
                <button onClick={() => { setMenuOpen(false); navigate("/subscription"); }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition hover:bg-white/5"><CreditCard size={15} /> My Subscription</button>
              )}
              <button onClick={logout} className="flex w-full items-center gap-2.5 border-t border-white/5 px-4 py-2.5 text-left text-sm text-rose-400 transition hover:bg-rose-500/10"><LogOut size={15} /> Log out</button>
            </div>
          )}
        </div>
      </div>

      <SubscriptionModal open={subOpen} onClose={() => setSubOpen(false)} />
      <ContactSupportModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </header>
  );
}
