import { useState, useEffect } from "react";
import { User, MapPin, Wifi, Briefcase } from "lucide-react";
import Dropdown from "./Dropdown";
import { api } from "../api";
import { useStore } from "../store";
import { input } from "../ui";

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">{label}{required && <span className="text-rose-500"> *</span>}</span>
      {children}
    </label>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="col-span-full">
      <div className="mb-3 mt-1 flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-white/5">
        <Icon size={16} className="text-gold-500" />
        <h4 className="font-display text-sm font-bold text-slate-700 dark:text-slate-200">{title}</h4>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}

// Config lookup select — id value, name label
function IdSelect({ value, options, onChange, placeholder }) {
  return (
    <Dropdown value={value ?? ""} options={options.map((o) => ({ value: o.id, label: o.name }))} onChange={(v) => onChange(v || null)} placeholder={placeholder} />
  );
}

const empty = { name: "", phone: "", zone: "", pppoe: "", package: "", status: "active", isVip: false };
const DIRECT = "Direct (No Reseller)";

export default function ClientForm({ initial, onChange }) {
  const { user } = useStore();
  const isAdmin = user?.role === "admin";
  const [form, setForm] = useState(initial ? { ...initial } : empty);
  const [packages, setPackages] = useState([]);
  const [zones, setZones] = useState([]);
  const [resellers, setResellers] = useState([]);
  const [cfg, setCfg] = useState({ connTypes: [], clientTypes: [], protocolTypes: [], boxes: [], subZones: [], districts: [], upazilas: [] });

  useEffect(() => { onChange?.(form); }, [form]);

  useEffect(() => {
    (async () => {
      try {
        const [pkgs, st, connTypes, clientTypes, protocolTypes, boxes, subZones, districts, upazilas] = await Promise.all([
          api.listPackages(), api.stats(),
          api.listConfig("connection-types"), api.listConfig("client-types"), api.listConfig("protocol-types"),
          api.listConfig("boxes"), api.listConfig("sub-zones"), api.listConfig("districts"), api.listConfig("upazilas"),
        ]);
        const zoneNames = (st.zones || []).map((z) => z.name || z);
        setPackages(pkgs);
        setZones(zoneNames);
        setCfg({ connTypes, clientTypes, protocolTypes, boxes, subZones, districts, upazilas });
        setForm((f) => ({ ...f, package: f.package || pkgs[0]?.name || "", zone: f.zone || zoneNames[0] || "" }));
      } catch { /* ignore */ }
      if (isAdmin) {
        try {
          const rs = await api.listResellers();
          setResellers(rs);
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
  const txt = (k) => (e) => set(k)(e.target.value);

  const resellerName = resellers.find((x) => x.id === form.resellerId)?.name || DIRECT;
  const setReseller = (name) => setForm((f) => ({ ...f, resellerId: name === DIRECT ? null : (resellers.find((x) => x.name === name)?.id ?? null) }));

  return (
    <div className="grid grid-cols-1 gap-4">
      <Section icon={User} title="Personal Information">
        <Field label="Full Name" required><input className={input} value={form.name || ""} onChange={txt("name")} placeholder="Customer name" /></Field>
        <Field label="Occupation"><input className={input} value={form.occupation || ""} onChange={txt("occupation")} placeholder="e.g. Business" /></Field>
        <Field label="Gender"><Dropdown value={form.gender || ""} options={[{ value: "", label: "Select" }, { value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Other", label: "Other" }]} onChange={set("gender")} /></Field>
        <Field label="Date of Birth"><input type="date" className={input} value={form.dob || ""} onChange={txt("dob")} /></Field>
        <Field label="NID / Birth Cert No"><input className={input} value={form.nid || ""} onChange={txt("nid")} placeholder="NID number" /></Field>
        <Field label="Father Name"><input className={input} value={form.fatherName || ""} onChange={txt("fatherName")} /></Field>
        <Field label="Mother Name"><input className={input} value={form.motherName || ""} onChange={txt("motherName")} /></Field>
        <div className="sm:col-span-2 lg:col-span-3"><Field label="Remarks / Special Note"><textarea className={`${input} min-h-[64px]`} value={form.remarks || ""} onChange={txt("remarks")} placeholder="Note..." /></Field></div>
      </Section>

      <Section icon={MapPin} title="Contact Information">
        <Field label="Mobile Number" required><input className={input} value={form.phone || ""} onChange={txt("phone")} placeholder="01XXXXXXXXX" /></Field>
        <Field label="Email Address"><input className={input} value={form.email || ""} onChange={txt("email")} placeholder="email@example.com" /></Field>
        <Field label="Facebook URL"><input className={input} value={form.facebook || ""} onChange={txt("facebook")} placeholder="https://fb.com/..." /></Field>
        <Field label="District"><Dropdown value={form.district || ""} options={[{ value: "", label: "Select" }, ...cfg.districts.map((d) => ({ value: d.name, label: d.name }))]} onChange={set("district")} /></Field>
        <Field label="Upazila / Thana"><Dropdown value={form.upazila || ""} options={[{ value: "", label: "Select" }, ...cfg.upazilas.map((u) => ({ value: u.name, label: u.name }))]} onChange={set("upazila")} /></Field>
        <Field label="Road No"><input className={input} value={form.roadNo || ""} onChange={txt("roadNo")} /></Field>
        <Field label="House No"><input className={input} value={form.houseNo || ""} onChange={txt("houseNo")} /></Field>
        <Field label="Map Latitude"><input className={input} value={form.mapLat || ""} onChange={txt("mapLat")} placeholder="23.81" /></Field>
        <Field label="Map Longitude"><input className={input} value={form.mapLng || ""} onChange={txt("mapLng")} placeholder="90.41" /></Field>
        <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Present Address"><textarea className={`${input} min-h-[56px]`} value={form.presentAddress || form.address || ""} onChange={txt("presentAddress")} /></Field>
          <Field label="Permanent Address"><textarea className={`${input} min-h-[56px]`} value={form.permanentAddress || ""} onChange={txt("permanentAddress")} /></Field>
        </div>
      </Section>

      <Section icon={Wifi} title="Network & Product Information">
        <Field label="Zone / Area" required><Dropdown value={form.zone || ""} options={zones} onChange={set("zone")} /></Field>
        <Field label="Sub Zone"><IdSelect value={form.subZoneId} options={cfg.subZones} onChange={set("subZoneId")} placeholder="Sub zone" /></Field>
        <Field label="Box"><IdSelect value={form.boxId} options={cfg.boxes} onChange={set("boxId")} placeholder="Box" /></Field>
        <Field label="Connection Type" required><IdSelect value={form.connectionTypeId} options={cfg.connTypes} onChange={set("connectionTypeId")} placeholder="Connection type" /></Field>
        <Field label="Protocol Type"><IdSelect value={form.protocolTypeId} options={cfg.protocolTypes} onChange={set("protocolTypeId")} placeholder="Protocol type" /></Field>
        <Field label="Device MAC / Serial"><input className={input} value={form.deviceMac || ""} onChange={txt("deviceMac")} placeholder="AA:BB:CC:.." /></Field>
      </Section>

      <Section icon={Briefcase} title="Service Information">
        <Field label="PPPoE Username" required><input className={input} value={form.pppoe || ""} onChange={txt("pppoe")} placeholder="user1001" /></Field>
        <Field label="Package" required><Dropdown value={form.package || ""} options={packages.map((p) => p.name)} onChange={set("package")} /></Field>
        <Field label="Client Type"><IdSelect value={form.clientTypeId} options={cfg.clientTypes} onChange={set("clientTypeId")} placeholder="Client type" /></Field>
        <Field label="Status"><Dropdown value={form.status} options={["active", "due", "expired", "suspended"]} onChange={set("status")} /></Field>
        <Field label="Monthly Bill (৳)"><input type="number" className={input} value={form.monthlyBill ?? ""} onChange={txt("monthlyBill")} placeholder="package price" /></Field>
        <Field label="Joining Date"><input type="date" className={input} value={form.joiningDate || ""} onChange={txt("joiningDate")} /></Field>
        <Field label="Expire Date"><input type="date" className={input} value={form.expiry || ""} onChange={txt("expiry")} /></Field>
        <Field label="Reference By"><input className={input} value={form.referenceBy || ""} onChange={txt("referenceBy")} /></Field>
        {isAdmin && <Field label="Reseller"><Dropdown value={resellerName} options={[DIRECT, ...resellers.map((x) => x.name)]} onChange={setReseller} /></Field>}
        <label className="flex items-center gap-2.5 self-end pb-2.5 text-sm font-medium text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={!!form.isVip} onChange={(e) => set("isVip")(e.target.checked)} className="h-4 w-4 accent-gold-500" /> VIP Client
        </label>
      </Section>

      {form.status === "active" && Number(form.due || 0) > 0 && (
        <p className="col-span-full rounded-xl bg-amber-500/10 px-3 py-2.5 text-xs font-medium leading-relaxed text-amber-600 dark:text-amber-400">
          ⚠ Due <b>৳{Number(form.due).toLocaleString()}</b> baki — active rakhle due-o baki thakbe, tai Due Clients list-e dekhate thakbe. Payment collect kore due clear korun.
        </p>
      )}
    </div>
  );
}
