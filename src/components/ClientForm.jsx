import { useState, useEffect } from "react";
import Dropdown from "./Dropdown";
import { api } from "../api";
import { useStore } from "../store";
import { input } from "../ui";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      {children}
    </label>
  );
}

// Config lookup select — id value, name label (custom Dropdown, object-options mode)
function IdSelect({ value, options, onChange, placeholder }) {
  return (
    <Dropdown
      value={value ?? ""}
      options={options.map((o) => ({ value: o.id, label: o.name }))}
      onChange={(v) => onChange(v || null)}
      placeholder={placeholder}
    />
  );
}

const empty = {
  name: "", phone: "", zone: "", pppoe: "", package: "", status: "active",
};

const DIRECT = "Direct (No Reseller)";

export default function ClientForm({ initial, onChange }) {
  const { user } = useStore();
  const isAdmin = user?.role === "admin";
  const [form, setForm] = useState(initial ? { ...initial } : empty);
  const [packages, setPackages] = useState([]);
  const [zones, setZones] = useState([]);
  const [resellers, setResellers] = useState([]);
  // Configuration lookups (Phase 2) — [{id,name}]
  const [cfg, setCfg] = useState({ connTypes: [], clientTypes: [], protocolTypes: [], boxes: [], subZones: [] });

  useEffect(() => { onChange?.(form); }, [form]);

  // Load real packages + zones (+ resellers for admin) from DB
  useEffect(() => {
    (async () => {
      try {
        const [pkgs, st, connTypes, clientTypes, protocolTypes, boxes, subZones] = await Promise.all([
          api.listPackages(), api.stats(),
          api.listConfig("connection-types"), api.listConfig("client-types"),
          api.listConfig("protocol-types"), api.listConfig("boxes"), api.listConfig("sub-zones"),
        ]);
        const zoneNames = (st.zones || []).map((z) => z.name || z);
        setPackages(pkgs);
        setZones(zoneNames);
        setCfg({ connTypes, clientTypes, protocolTypes, boxes, subZones });
        setForm((f) => ({
          ...f,
          package: f.package || pkgs[0]?.name || "",
          zone: f.zone || zoneNames[0] || "",
        }));
      } catch { /* ignore load error */ }
      // Admin-i shudhu reseller list ene assign/transfer korte parbe
      if (isAdmin) {
        try {
          const rs = await api.listResellers();
          setResellers(rs);
          // Edit mode e initial.reseller (naam) theke resellerId map kore rakhi
          setForm((f) => {
            if (f.resellerId !== undefined) return f;
            const match = f.reseller ? rs.find((x) => x.name === f.reseller) : null;
            return { ...f, resellerId: match ? match.id : null };
          });
        } catch { /* ignore */ }
      }
    })();
  }, [isAdmin]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const resellerName = resellers.find((x) => x.id === form.resellerId)?.name || DIRECT;
  const setReseller = (name) =>
    setForm((f) => ({ ...f, resellerId: name === DIRECT ? null : (resellers.find((x) => x.name === name)?.id ?? null) }));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Full Name">
        <input className={input} value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="Customer name" />
      </Field>
      <Field label="Phone">
        <input className={input} value={form.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="01XXXXXXXXX" />
      </Field>
      <Field label="PPPoE Username">
        <input className={input} value={form.pppoe} onChange={(e) => set("pppoe")(e.target.value)} placeholder="user1001" />
      </Field>
      <Field label="Zone / Area">
        <Dropdown value={form.zone} options={zones} onChange={set("zone")} />
      </Field>
      <Field label="Package">
        <Dropdown value={form.package} options={packages.map((p) => p.name)} onChange={set("package")} />
      </Field>
      <Field label="Status">
        <Dropdown value={form.status} options={["active", "due", "expired", "suspended"]} onChange={set("status")} />
      </Field>
      <Field label="Connection Type">
        <IdSelect value={form.connectionTypeId} options={cfg.connTypes} onChange={set("connectionTypeId")} placeholder="Connection type" />
      </Field>
      <Field label="Client Type">
        <IdSelect value={form.clientTypeId} options={cfg.clientTypes} onChange={set("clientTypeId")} placeholder="Client type" />
      </Field>
      <Field label="Protocol Type">
        <IdSelect value={form.protocolTypeId} options={cfg.protocolTypes} onChange={set("protocolTypeId")} placeholder="Protocol type" />
      </Field>
      <Field label="Box">
        <IdSelect value={form.boxId} options={cfg.boxes} onChange={set("boxId")} placeholder="Box" />
      </Field>
      <Field label="Sub Zone">
        <IdSelect value={form.subZoneId} options={cfg.subZones} onChange={set("subZoneId")} placeholder="Sub zone" />
      </Field>
      {isAdmin && (
        <Field label="Reseller">
          <Dropdown value={resellerName} options={[DIRECT, ...resellers.map((x) => x.name)]} onChange={setReseller} />
        </Field>
      )}
      {form.status === "active" && Number(form.due || 0) > 0 && (
        <p className="col-span-full rounded-xl bg-amber-500/10 px-3 py-2.5 text-xs font-medium leading-relaxed text-amber-600 dark:text-amber-400">
          ⚠ Due <b>৳{Number(form.due).toLocaleString()}</b> baki — active rakhle due-o baki thakbe, tai Due Clients list-e dekhate thakbe.
          Sthayi korte hole payment collect kore due clear korun.
        </p>
      )}
    </div>
  );
}
