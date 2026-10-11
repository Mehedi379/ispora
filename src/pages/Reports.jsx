import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Download, TrendingUp, Users, Wallet, AlertTriangle, Loader2 } from "lucide-react";
import Dropdown from "../components/Dropdown";
import { useStore } from "../store";
import { api } from "../api";

// range -> [start, end] date boundaries (inclusive start, exclusive end)
function rangeBounds(range) {
  const now = new Date();
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (range === "Today") {
    const s = startOfDay(now);
    return [s, new Date(s.getTime() + 864e5)];
  }
  if (range === "This Week") {
    const day = (now.getDay() + 6) % 7; // Monday = 0
    const s = startOfDay(new Date(now.getTime() - day * 864e5));
    return [s, new Date(s.getTime() + 7 * 864e5)];
  }
  if (range === "Last Month") {
    const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const e = new Date(now.getFullYear(), now.getMonth(), 1);
    return [s, e];
  }
  // This Month (default)
  const s = new Date(now.getFullYear(), now.getMonth(), 1);
  const e = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return [s, e];
}

// "YYYY-MM-DD" ke LOCAL date hishebe parse — new Date("2026-10-01") UTC midnight
// deway rangeBounds (local) er sathe off-by-one-day bucketing hoito
const parseYmd = (s) => {
  const [y, m, d] = String(s).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export default function Reports() {
  const { clients } = useStore();
  const [range, setRange] = useState("This Month");
  const [zone, setZone] = useState("All Zones");
  const [zones, setZones] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [s, e] = rangeBounds(range);
        const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const [st, pays] = await Promise.all([
          api.stats(),
          // Range niye server theke — age 200-ta payment-er default limit-e
          // purana payment bhenge pore report bhul hoito
          api.listPayments({ from: fmt(s), to: fmt(new Date(e.getTime() - 1)), limit: 5000 }),
        ]);
        setZones((st.zones || []).map((z) => z.name || z));
        setPayments(pays || []);
        setErr("");
      } catch (e) {
        if (alive) setErr(e?.message || "Report load fail holo");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [range, reload]);

  const clientList = zone === "All Zones" ? clients : clients.filter((c) => c.zone === zone);

  // Collection = actual payments within selected range (+ zone)
  const rangedPayments = useMemo(() => {
    const [s, e] = rangeBounds(range);
    return payments.filter((p) => {
      const d = parseYmd(p.date);
      if (d < s || d >= e) return false;
      if (zone !== "All Zones" && p.zone !== zone) return false;
      return true;
    });
  }, [payments, range, zone]);

  const collection = rangedPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const due = clientList.reduce((s, c) => s + (c.due || 0), 0);

  const tiles = [
    { label: "Total Customers", value: clientList.length, icon: Users, color: "from-sky-400 to-blue-600" },
    { label: "Collection", value: `৳ ${collection.toLocaleString()}`, icon: Wallet, color: "from-emerald-400 to-green-600" },
    { label: "Due", value: `৳ ${due.toLocaleString()}`, icon: AlertTriangle, color: "from-rose-400 to-red-600" },
    { label: "Collection Rate", value: `${Math.round((collection / (collection + due || 1)) * 100)}%`, icon: TrendingUp, color: "from-gold-400 to-gold-600" },
  ];

  // zone-wise collection within the selected range
  const byZone = useMemo(() => {
    const [s, e] = rangeBounds(range);
    return zones.map((z) => {
      const amount = payments
        .filter((p) => p.zone === z && parseYmd(p.date) >= s && parseYmd(p.date) < e)
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      return { zone: z, count: clients.filter((c) => c.zone === z).length, amount };
    });
  }, [zones, payments, clients, range]);
  const max = Math.max(...byZone.map((z) => z.amount), 1);

  const exportCsv = () => {
    const rows = [
      ["ISPora Report", range, zone, new Date().toLocaleString()],
      [],
      ["Summary"],
      ["Total Customers", clientList.length],
      ["Collection (৳)", collection],
      ["Due (৳)", due],
      ["Collection Rate", `${Math.round((collection / (collection + due || 1)) * 100)}%`],
      [],
      ["Zone-wise Collection"],
      ["Zone", "Customers", "Collection (৳)"],
      ...byZone.map((z) => [z.zone, z.count, z.amount]),
      [],
      ["Payments (" + range + ")"],
      ["Date", "Customer", "Zone", "Method", "Amount (৳)"],
      ...rangedPayments.map((p) => [p.date, p.client, p.zone, p.method, p.amount]),
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ispora-report-${range.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Reports</h2>
          <p className="text-sm text-slate-400">Collection, due o area-wise bisleshon</p>
        </div>
        <div className="flex items-center gap-2">
          <Dropdown value={range} options={["Today", "This Week", "This Month", "Last Month"]} onChange={setRange} className="w-40" />
          <Dropdown value={zone} options={["All Zones", ...zones]} onChange={setZone} className="w-40" />
          <button onClick={exportCsv} className="btn-gold"><Download size={16} /> Export</button>
        </div>
      </div>

      {err && (
        <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">
          {err}{" "}
          <button onClick={() => setReload((n) => n + 1)} className="font-semibold underline">Abar try korun</button>
        </p>
      )}

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="animate-spin text-gold-500" /></div>
      ) : (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t, i) => (
          <motion.div key={t.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card p-5">
            <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${t.color} text-white shadow-lg`}><t.icon size={20} /></div>
            <p className="mt-4 text-2xl font-bold text-slate-800 dark:text-white">{t.value}</p>
            <p className="text-sm text-slate-400">{t.label}</p>
          </motion.div>
        ))}
      </div>
      )}

      <div className="card p-5">
        <h3 className="mb-5 font-display font-semibold text-slate-800 dark:text-white">Zone-wise Collection <span className="text-sm font-normal text-slate-400">· {range}</span></h3>
        <div className="space-y-4">
          {byZone.map((z, i) => (
            <div key={z.zone}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-600 dark:text-slate-300">{z.zone} <span className="text-slate-400">({z.count})</span></span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">৳ {z.amount.toLocaleString()}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(z.amount / max) * 100}%` }} transition={{ delay: 0.2 + i * 0.08, duration: 0.6 }}
                  className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-600" />
              </div>
            </div>
          ))}
          {loading && <p className="py-4 text-center text-sm text-slate-400">Load hocche...</p>}
          {!loading && byZone.every((z) => z.amount === 0) && <p className="py-4 text-center text-sm text-slate-400">Ei range e kono collection nei.</p>}
        </div>
      </div>
    </div>
  );
}
