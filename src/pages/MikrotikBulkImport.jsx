import { useState, useEffect, useRef } from "react";
import { Loader2, Upload, FlaskConical, Download, Trash2, FileSpreadsheet, Eye, EyeOff } from "lucide-react";
import { useStore } from "../store";
import { api } from "../api";
import { input } from "../ui";
import Dropdown from "../components/Dropdown";

const SAMPLE_ROWS = [
  ["Name", "Mobile", "Email", "NationalID", "Address", "Zone", "ConnType", "Server", "ProtType", "Profile", "UserName", "Password", "CType", "Package", "B.Status", "M.Bill", "BillMonth", "JoinDate", "ExpDate", "DateOfBirth", "FatherName", "MotherName", "Occupation", "Gender"],
  ["Rahim Uddin", "01710000001", "rahim@example.com", "1234567890", "House 1, Mirpur", "Mirpur", "UTP", "MT-Core-01", "PPPoE", "10M", "user2001", "pass123", "Home", "Home Plus", "Active", "800", "2026-10", "2026-10-01", "2026-11-01", "1995-01-01", "Abdul", "Fatema", "Business", "Male"],
  ["Karim Sheikh", "01710000002", "karim@example.com", "1234567891", "House 2, Gulshan", "Gulshan", "Fiber", "MT-Core-01", "PPPoE", "20M", "user2002", "pass456", "Corporate", "Pro", "Active", "1200", "2026-10", "2026-10-01", "2026-11-01", "1992-05-10", "Rahman", "Salma", "Service", "Male"],
];

function buildSampleCsv() {
  return SAMPLE_ROWS.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\r\n");
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return { header: [], rows: [] };
  const header = lines[0].split(",").map((s) => s.replace(/^"|"$/g, "").trim());
  const rows = lines.slice(1).filter((l) => l.trim()).map((l) => {
    const cells = [];
    let cur = "", inQ = false;
    for (let i = 0; i < l.length; i++) {
      const ch = l[i];
      if (ch === '"' && l[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQ = !inQ; }
      else if (ch === "," && !inQ) { cells.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    cells.push(cur.trim());
    return header.reduce((o, h, idx) => { o[h] = (cells[idx] || "").replace(/^"|"$/g, ""); return o; }, {});
  });
  return { header, rows };
}

export default function MikrotikBulkImport() {
  const { notify, refreshClients } = useStore();
  const [servers, setServers] = useState([]);
  const [serverId, setServerId] = useState("");
  const [learn, setLearn] = useState(false);
  const [parsed, setParsed] = useState({ header: [], rows: [] });
  const [revealed, setRevealed] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    (async () => {
      try { const s = await api.mtServers(); setServers(s); if (s[0]) setServerId(String(s[0].id)); }
      catch (e) { notify(e.message); }
    })();
  }, [notify]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const parsedData = parseCsv(text);
      setParsed(parsedData);
      setResult(null);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const downloadSample = () => {
    const csv = buildSampleCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "sample-bulk-clients.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const clearAll = () => { setParsed({ header: [], rows: [] }); setResult(null); };

  const downloadEdited = () => {
    if (parsed.rows.length === 0) return notify("Download korar moto data nei.");
    const cols = parsed.header.length ? parsed.header : SAMPLE_ROWS[0];
    const lines = [cols.join(",")];
    for (const r of parsed.rows) {
      lines.push(cols.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","));
    }
    const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `bulk-edited-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const uploadExcel = async () => {
    if (!serverId) return notify("Server select korun");
    if (parsed.rows.length === 0) return notify("Age Excel upload korun");
    // Build CSV lines for existing API (pppoe, name, phone, package)
    const lines = parsed.rows.map((r) => {
      const pppoe = r.UserName || r.pppoe || r.PPPoE || "";
      const name = r.Name || r.name || "";
      const phone = r.Mobile || r.phone || "";
      const pkg = r.Package || r.package || "";
      return [pppoe, name, phone, pkg].join(",");
    }).join("\n");
    setBusy(true); setResult(null);
    try {
      const res = await api.mtBulkImport(serverId, lines);
      setResult(res);
      if (!res.simulated) await refreshClients?.();
    } catch (e) { notify(e.message); }
    finally { setBusy(false); }
  };

  const server = servers.find((s) => String(s.id) === String(serverId));
  const toggleReveal = (idx) => setRevealed((s) => { const n = new Set(s); n.has(idx) ? n.delete(idx) : n.add(idx); return n; });

  return (
    <div className="space-y-5">
      <h2 className="font-display text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy-900 text-white text-xs">▦</span>
        Bulk Clients Import <span className="text-xs font-normal text-rose-500">(Your Uploaded Data Will No Longer Available After 24 Hours!!!)</span>
      </h2>

      {/* Learn toggle — like screenshot */}
      <div className="card p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Learn How to Import Clients...</p>
          <button onClick={() => setLearn((v) => !v)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${learn ? "bg-sky-500" : "bg-slate-300 dark:bg-white/20"}`}>
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${learn ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
        {learn && (
          <div className="mt-3 rounded-xl bg-sky-500/10 p-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <ol className="list-decimal space-y-1 pl-5">
              <li>Download Sample Excel — format dekhe apnar data boshan.</li>
              <li>Upload Importable Clients (Excel) e file upload korun.</li>
              <li>Preview dekun, bhul thakle Download Edited Data kore thik kore abar upload korun.</li>
              <li>Upload Importable Clients e abar upload korle protita line validate + duplicate check hoye customer toiri hobe.</li>
            </ol>
          </div>
        )}
      </div>

      {/* 4 pills — like screenshot */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={downloadSample} className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-800">
          <FileSpreadsheet size={14} /> Download Sample Excel
        </button>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-800">
          <Trash2 size={14} /> Clear All Clients
        </button>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-navy-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-800">
          <Upload size={14} /> Upload Importable Clients(Excel)
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} />
        </label>
        <button onClick={downloadEdited} className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-800">
          <Download size={14} /> Download Edited Data
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block min-w-[180px] flex-1 max-w-xs"><span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Server</span>
            <Dropdown value={serverId} options={servers.length === 0 ? [{ value: "", label: "Kono server nei" }] : servers.map((s) => ({ value: String(s.id), label: s.name }))} onChange={(v) => setServerId(v)} /></label>
          <button onClick={uploadExcel} disabled={busy || !serverId || parsed.rows.length === 0} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Import {parsed.rows.length ? `(${parsed.rows.length})` : ""}
          </button>
        </div>
        {server?.mode !== "real" && parsed.rows.length > 0 && (
          <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400"><FlaskConical size={12} className="mr-1 inline" /> Simulation mode — validate + duplicate check hobe kintu kono data save hobe na (production DB safe).</p>
        )}
      </div>

      {result && (
        <div className={`rounded-xl p-4 text-sm ${result.simulated ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`}>
          <p className="font-semibold">{result.simulated ? "Simulation Result (kono data save hoyni)" : "Import Complete"}</p>
          <ul className="mt-1 space-y-0.5 text-xs">
            <li>Total lines: {result.total}</li>
            <li>{result.simulated ? `Would import: ${result.wouldImport}` : `Imported: ${result.imported}`}</li>
            <li>Duplicates skipped: {result.duplicates}</li>
            <li>Invalid lines: {result.invalid}</li>
          </ul>
          {result.errors?.length > 0 && <p className="mt-2 text-xs text-rose-500">{result.errors.join(" · ")}</p>}
        </div>
      )}

      {/* Preview table — mirrors screenshot header */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/5">
          <span className="text-xs text-slate-400">SHOW <select className="rounded border border-slate-200 bg-white px-2 py-1 dark:border-white/10 dark:bg-navy-800" defaultValue="All"><option>All</option><option>25</option><option>50</option></select> ENTRIES</span>
          <span className="text-xs text-slate-400">SEARCH: <input placeholder="" className="rounded border border-slate-200 bg-white px-2 py-1 text-sm dark:border-white/10 dark:bg-navy-800" /></span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-xs">
            <thead className="bg-navy-900 text-[11px] uppercase tracking-wide text-slate-300">
              <tr>
                {(() => {
                  const cols = parsed.header.length ? parsed.header : ["Name", "Mobile", "Email", "NationalID", "Address", "Zone", "ConnType", "Server", "ProtType", "Profile", "UserName", "Password", "CType", "Package", "B.Status", "M.Bill", "BillMonth", "JoinDate", "ExpDate", "DateOfBirth", "FatherName", "MotherName", "Occupation", "Gender"];
                  return cols.map((h) => <th key={h} className="px-3 py-3">{h}</th>);
                })()}
              </tr>
            </thead>
            <tbody>
              {parsed.rows.length === 0 ? (
                <tr><td colSpan={30} className="py-10 text-center text-sm text-slate-400">No data available in table</td></tr>
              ) : parsed.rows.map((row, idx) => (
                <tr key={idx} className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                  {(parsed.header.length ? parsed.header : ["Name", "Mobile", "Email", "NationalID", "Address", "Zone", "ConnType", "Server", "ProtType", "Profile", "UserName", "Password", "CType", "Package", "B.Status", "M.Bill", "BillMonth", "JoinDate", "ExpDate", "DateOfBirth", "FatherName", "MotherName", "Occupation", "Gender"]).map((h) => {
                    const val = row[h] ?? "—";
                    const isPw = /password/i.test(h);
                    return (
                      <td key={h} className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                        {isPw ? (
                          <span className="inline-flex items-center gap-1 font-mono">
                            <span>{revealed.has(idx) ? val : "••••"}</span>
                            <button onClick={() => toggleReveal(idx)} className="text-slate-400 hover:text-gold-500">{revealed.has(idx) ? <EyeOff size={12} /> : <Eye size={12} />}</button>
                          </span>
                        ) : val || "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-400 dark:border-white/5">
          <span>Showing {parsed.rows.length} to {parsed.rows.length} of {parsed.rows.length} entries</span>
          <span>Previous &nbsp; <span className="rounded bg-navy-900 px-2 py-1 text-white">1</span> &nbsp; Next</span>
        </div>
      </div>
    </div>
  );
}
