// ISPora API client — backend er sathe kotha bole.
// VITE_API_URL set thakle oita; nahole localhost (dev) / live Render URL (production).
// Eta fallback — Cloudflare build var miss korleo live-e kaj korbe.
const isLocal = typeof location !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const BASE =
  import.meta.env.VITE_API_URL ||
  (isLocal ? "http://localhost:4000/api" : "https://ispora-api.onrender.com/api");
const TOKEN_KEY = "ispora.token";
// Render free tier 15 min por ghumay — prothom request-e cold start ~40s lage, tai boro timeout
const TIMEOUT_MS = 50000;

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function req(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  // Timeout — server respond na korle chup chap hang thakbe na
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method, headers, body: body ? JSON.stringify(body) : undefined, signal: ctrl.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    throw new Error(e?.name === "AbortError" ? "Server drishyo nei — network/check korun" : "Network error holo");
  }
  clearTimeout(timer);

  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event("ispora:logout"));
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request fail (${res.status})`);
    err.code = data.code; err.status = res.status;
    throw err;
  }
  return data;
}

const qs = (params = {}) =>
  new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")).toString();

export const api = {
  // auth
  login: (email, password) => req("/auth/login", { method: "POST", body: { email, password }, auth: false }),
  signup: (body) => req("/auth/signup", { method: "POST", body, auth: false }),
  clientRegister: (body) => req("/client-portal/register", { method: "POST", body, auth: false }),
  forgotPassword: (email) => req("/client-portal/forgot-password", { method: "POST", body: { email }, auth: false }),
  resetPassword: (token, password) => req("/client-portal/reset-password", { method: "POST", body: { token, password }, auth: false }),
  publicPlans: () => req("/public/plans", { auth: false }),
  me: () => req("/auth/me"),
  entitlements: () => req("/auth/entitlements"),
  // SaaS subscription (tenant side)
  saasMe: () => req("/billing/saas/me"),
  saasRenew: () => req("/billing/saas/renew", { method: "POST" }),
  saasPayMode: () => req("/billing/saas/pay/mode"),
  saasPay: (planId) => req("/billing/saas/pay", { method: "POST", body: { planId } }),
  saasPayManual: (body) => req("/billing/saas/pay/manual", { method: "POST", body }),
  saasPayConfirm: (method) => req("/billing/saas/pay/confirm", { method: "POST", body: { method } }),
  saasSupportList: () => req("/billing/saas/support"),
  saasSupportCreate: (body) => req("/billing/saas/support", { method: "POST", body }),
  changePassword: (current, next) => req("/auth/change-password", { method: "POST", body: { current, next } }),
  updateProfile: (body) => req("/auth/profile", { method: "PUT", body }),
  myActivity: () => req("/auth/activity"),
  myLogins: () => req("/auth/logins"),

  // clients
  listClients: (params = {}) => {
    const s = qs(params);
    return req(`/clients${s ? `?${s}` : ""}`);
  },
  createClient: (c) => req("/clients", { method: "POST", body: c }),
  updateClient: (id, c) => req(`/clients/${id}`, { method: "PUT", body: c }),
  toggleClient: (id) => req(`/clients/${id}/toggle`, { method: "POST" }),
  deleteClient: (id) => req(`/clients/${id}`, { method: "DELETE" }),
  listDeletedClients: () => req("/clients/deleted"),
  restoreClient: (id) => req(`/clients/${id}/restore`, { method: "POST" }),
  purgeClient: (id) => req(`/clients/${id}/permanent`, { method: "DELETE" }),
  // left (churn) clients
  listLeftClients: () => req("/clients/left"),
  markLeft: (id) => req(`/clients/${id}/left`, { method: "POST" }),
  rejoinClient: (id) => req(`/clients/${id}/rejoin`, { method: "POST" }),

  // new connection requests
  listRequests: (status) => req(`/requests${status ? `?status=${status}` : ""}`),
  createRequest: (body) => req("/requests", { method: "POST", body }),
  approveRequest: (id) => req(`/requests/${id}/approve`, { method: "POST" }),
  rejectRequest: (id) => req(`/requests/${id}/reject`, { method: "POST" }),
  deleteRequest: (id) => req(`/requests/${id}`, { method: "DELETE" }),

  // change requests (package/info change)
  listChangeRequests: (status) => req(`/change-requests${status ? `?status=${status}` : ""}`),
  createChangeRequest: (body) => req("/change-requests", { method: "POST", body }),
  approveChangeRequest: (id) => req(`/change-requests/${id}/approve`, { method: "POST" }),
  rejectChangeRequest: (id) => req(`/change-requests/${id}/reject`, { method: "POST" }),
  deleteChangeRequest: (id) => req(`/change-requests/${id}`, { method: "DELETE" }),

  // scheduler (future actions on clients)
  listSchedules: (status) => req(`/schedules${status ? `?status=${status}` : ""}`),
  createSchedule: (body) => req("/schedules", { method: "POST", body }),
  runSchedule: (id) => req(`/schedules/${id}/run`, { method: "POST" }),
  cancelSchedule: (id) => req(`/schedules/${id}/cancel`, { method: "POST" }),
  deleteSchedule: (id) => req(`/schedules/${id}`, { method: "DELETE" }),

  // client portal management
  listPortal: () => req("/portal"),
  enablePortal: (id, body) => req(`/portal/${id}/enable`, { method: "POST", body }),
  disablePortal: (id) => req(`/portal/${id}/disable`, { method: "POST" }),
  updatePortal: (id, body) => req(`/portal/${id}`, { method: "PUT", body }),

  // MikroTik Server module (mock + real RouterOS)
  mtServers: () => req("/mikrotik/servers"),
  mtSyncClients: () => req("/mikrotik/sync/clients", { method: "POST" }),
  mtCreateServer: (body) => req("/mikrotik/servers", { method: "POST", body }),
  mtUpdateServer: (id, body) => req(`/mikrotik/servers/${id}`, { method: "PUT", body }),
  mtDeleteServer: (id) => req(`/mikrotik/servers/${id}`, { method: "DELETE" }),
  mtTest: (id) => req(`/mikrotik/servers/${id}/test`, { method: "POST" }),
  mtPppoe: (id) => req(`/mikrotik/servers/${id}/pppoe`),
  mtPppoeEnable: (id, name) => req(`/mikrotik/servers/${id}/pppoe/${encodeURIComponent(name)}/enable`, { method: "POST" }),
  mtPppoeDisable: (id, name) => req(`/mikrotik/servers/${id}/pppoe/${encodeURIComponent(name)}/disable`, { method: "POST" }),
  mtImportPreview: (id) => req(`/mikrotik/servers/${id}/import/preview`),
  mtImport: (id, names) => req(`/mikrotik/servers/${id}/import`, { method: "POST", body: { names } }),
  mtBulkImport: (id, text) => req(`/mikrotik/servers/${id}/bulk-import`, { method: "POST", body: { text } }),
  mtBackups: (id) => req(`/mikrotik/servers/${id}/backups`),
  mtCreateBackup: (id, name) => req(`/mikrotik/servers/${id}/backups`, { method: "POST", body: { name } }),
  mtDeleteBackup: (id, bid) => req(`/mikrotik/servers/${id}/backups/${bid}`, { method: "DELETE" }),
  mtBackupDownloadUrl: (id, bid) => `${BASE}/mikrotik/servers/${id}/backups/${bid}/download`,

  // packages
  listPackages: () => req("/packages"),
  createPackage: (p) => req("/packages", { method: "POST", body: p }),
  updatePackage: (id, p) => req(`/packages/${id}`, { method: "PUT", body: p }),
  deletePackage: (id) => req(`/packages/${id}`, { method: "DELETE" }),

  // invoices
  listInvoices: (params = {}) => {
    const s = qs(params);
    return req(`/invoices${s ? `?${s}` : ""}`);
  },
  createInvoice: (data) => req("/invoices", { method: "POST", body: data }),
  updateInvoice: (id, data) => req(`/invoices/${id}`, { method: "PUT", body: data }),

  // payments — params: from/to (YYYY-MM-DD), zone, limit
  listPayments: (params = {}) => {
    const s = qs(params);
    return req(`/payments${s ? `?${s}` : ""}`);
  },
  collectPayment: (p) => req("/payments", { method: "POST", body: p }),
  voidPayment: (id) => req(`/payments/${id}`, { method: "DELETE" }), // admin only

  // accounting
  accounting: () => req("/accounting"),
  addTransaction: (t) => req("/accounting", { method: "POST", body: t }),
  deleteTransaction: (id) => req(`/accounting/${id}`, { method: "DELETE" }),

  // stats
  stats: () => req("/stats"),
  statsDashboard: () => req("/stats/dashboard"),
  statsOverview: () => req("/stats/overview"),

  // resellers
  listResellers: () => req("/resellers"),
  resellerClients: (id) => req(`/resellers/${id}/clients`),
  createReseller: (x) => req("/resellers", { method: "POST", body: x }),
  updateReseller: (id, x) => req(`/resellers/${id}`, { method: "PUT", body: x }),
  deleteReseller: (id) => req(`/resellers/${id}`, { method: "DELETE" }),

  // settings
  getSettings: () => req("/settings"),
  saveSettings: (s) => req("/settings", { method: "PUT", body: s }),

  // tickets
  listTickets: () => req("/tickets"),
  createTicket: (t) => req("/tickets", { method: "POST", body: t }),
  updateTicket: (id, t) => req(`/tickets/${id}`, { method: "PUT", body: t }),
  deleteTicket: (id) => req(`/tickets/${id}`, { method: "DELETE" }),

  // network devices (MikroTik / OLT)
  listDevices: (type) => req(`/devices${type ? `?type=${type}` : ""}`),
  createDevice: (d) => req("/devices", { method: "POST", body: d }),
  updateDevice: (id, d) => req(`/devices/${id}`, { method: "PUT", body: d }),
  deleteDevice: (id) => req(`/devices/${id}`, { method: "DELETE" }),

  // configuration lookups (zones, sub-zones, boxes, connection-types, client-types,
  // protocol-types, billing-statuses, districts, upazilas)
  listConfig: (entity) => req(`/config/${entity}`),
  listZones: () => req("/config/zones"),
  createConfig: (entity, body) => req(`/config/${entity}`, { method: "POST", body }),
  updateConfig: (entity, id, body) => req(`/config/${entity}/${id}`, { method: "PUT", body }),
  deleteConfig: (entity, id) => req(`/config/${entity}/${id}`, { method: "DELETE" }),

  // VAS — value added services
  listVasServices: () => req("/vas/services"),
  createVasService: (body) => req("/vas/services", { method: "POST", body }),
  updateVasService: (id, body) => req(`/vas/services/${id}`, { method: "PUT", body }),
  deleteVasService: (id) => req(`/vas/services/${id}`, { method: "DELETE" }),
  rechargeVasService: (id, amount) => req(`/vas/services/${id}/recharge`, { method: "POST", body: { amount } }),
  vasSettings: () => req("/vas/settings"),
  saveVasSettings: (body) => req("/vas/settings", { method: "PUT", body }),
  listVasTransactions: (params = {}) => {
    const s = qs(params);
    return req(`/vas/transactions${s ? `?${s}` : ""}`);
  },
  createVasTransaction: (body) => req("/vas/transactions", { method: "POST", body }),
  deleteVasTransaction: (id) => req(`/vas/transactions/${id}`, { method: "DELETE" }),

  // billing
  billingList: (params = {}) => {
    const s = qs(params);
    return req(`/billing/list${s ? `?${s}` : ""}`);
  },
  billingCollection: (params = {}) => {
    const s = qs(params);
    return req(`/billing/collection${s ? `?${s}` : ""}`);
  },
  generateBills: () => req("/billing/generate", { method: "POST" }),

  // HR & Payroll — generic lookup CRUD (departments, positions, payheads, resign-rules, employees)
  hrList: (entity, params = {}) => { const s = qs(params); return req(`/hr/${entity}${s ? `?${s}` : ""}`); },
  hrCreate: (entity, body) => req(`/hr/${entity}`, { method: "POST", body }),
  hrUpdate: (entity, id, body) => req(`/hr/${entity}/${id}`, { method: "PUT", body }),
  hrDelete: (entity, id) => req(`/hr/${entity}/${id}`, { method: "DELETE" }),
  hrResign: (id, reason) => req(`/hr/employees/${id}/resign`, { method: "POST", body: { reason } }),
  hrRejoin: (id) => req(`/hr/employees/${id}/rejoin`, { method: "POST" }),
  hrAttendance: (date) => req(`/hr/attendance${date ? `?date=${date}` : ""}`),
  hrSaveAttendance: (date, records) => req("/hr/attendance", { method: "POST", body: { date, records } }),
  hrGeneratePayroll: (month, year) => req("/hr/payroll/generate", { method: "POST", body: { month, year } }),
  hrPaySlip: (id) => req(`/hr/payslips/${id}/pay`, { method: "POST" }),
  hrSalarySheet: (month, year) => req(`/hr/salary-sheet?month=${month}&year=${year}`),

  // OLT Management
  oltDevices: () => req("/olt/devices"),
  oltCreateDevice: (body) => req("/olt/devices", { method: "POST", body }),
  oltUpdateDevice: (id, body) => req(`/olt/devices/${id}`, { method: "PUT", body }),
  oltDeleteDevice: (id) => req(`/olt/devices/${id}`, { method: "DELETE" }),
  oltUsers: (oltId) => req(`/olt/users${oltId ? `?oltId=${oltId}` : ""}`),
  oltCreateUser: (body) => req("/olt/users", { method: "POST", body }),
  oltUpdateUser: (id, body) => req(`/olt/users/${id}`, { method: "PUT", body }),
  oltDeleteUser: (id) => req(`/olt/users/${id}`, { method: "DELETE" }),

  // Network Diagram
  netPops: () => req("/network/pops"),
  netCreatePop: (body) => req("/network/pops", { method: "POST", body }),
  netUpdatePop: (id, body) => req(`/network/pops/${id}`, { method: "PUT", body }),
  netDeletePop: (id) => req(`/network/pops/${id}`, { method: "DELETE" }),
  netConnections: () => req("/network/connections"),
  netCreateConnection: (body) => req("/network/connections", { method: "POST", body }),
  netUpdateConnection: (id, body) => req(`/network/connections/${id}`, { method: "PUT", body }),
  netDeleteConnection: (id) => req(`/network/connections/${id}`, { method: "DELETE" }),
  netItems: (popId) => req(`/network/items${popId ? `?popId=${popId}` : ""}`),
  netCreateItem: (body) => req("/network/items", { method: "POST", body }),
  netUpdateItem: (id, body) => req(`/network/items/${id}`, { method: "PUT", body }),
  netDeleteItem: (id) => req(`/network/items/${id}`, { method: "DELETE" }),
  netDiagram: () => req("/network/diagram"),
  netClientsInDiagram: () => req("/network/clients-in-diagram"),
  netAssignClient: (clientId, popId) => req("/network/assign-client", { method: "POST", body: { clientId, popId } }),

  // Generic CRUD (base = module, e.g. "hr" | "leave")
  crudList: (base, entity, params = {}) => { const s = qs(params); return req(`/${base}/${entity}${s ? `?${s}` : ""}`); },
  crudCreate: (base, entity, body) => req(`/${base}/${entity}`, { method: "POST", body }),
  crudUpdate: (base, entity, id, body) => req(`/${base}/${entity}/${id}`, { method: "PUT", body }),
  crudDelete: (base, entity, id) => req(`/${base}/${entity}/${id}`, { method: "DELETE" }),
  // Leave management
  leaveApply: (body) => req("/leave/applications", { method: "POST", body }),
  leaveApprove: (id) => req(`/leave/applications/${id}/approve`, { method: "POST" }),
  leaveReject: (id) => req(`/leave/applications/${id}/reject`, { method: "POST" }),
  leaveAttachment: (id) => req(`/leave/applications/${id}/attachment`),

  // Events & Holidays
  eventsList: (params = {}) => { const s = qs(params); return req(`/events${s ? `?${s}` : ""}`); },
  eventsCreate: (body) => req("/events", { method: "POST", body }),
  eventsUpdate: (id, body) => req(`/events/${id}`, { method: "PUT", body }),
  eventsDelete: (id) => req(`/events/${id}`, { method: "DELETE" }),

  // Bandwidth Buy — pay a purchase bill
  bwPayBill: (id) => req(`/bwbuy/bills/${id}/pay`, { method: "POST" }),

  // Task Management (root = tasks; categories via crud base=tasks)
  tasksList: (params = {}) => { const s = qs(params); return req(`/tasks${s ? `?${s}` : ""}`); },
  tasksCreate: (body) => req("/tasks", { method: "POST", body }),
  tasksUpdate: (id, body) => req(`/tasks/${id}`, { method: "PUT", body }),
  tasksDelete: (id) => req(`/tasks/${id}`, { method: "DELETE" }),

  // Bandwidth Sale
  bwSalePayInvoice: (id) => req(`/bwsale/invoices/${id}/pay`, { method: "POST" }),
  bwSaleGenerateRecurring: () => req("/bwsale/recurring/generate", { method: "POST" }),

  // Purchase
  purchReqAction: (id, action) => req(`/purchase/requisitions/${id}/${action}`, { method: "POST" }),
  purchPayBill: (id) => req(`/purchase/bills/${id}/pay`, { method: "POST" }),

  // Sales & Service
  salesList: (params = {}) => { const s = qs(params); return req(`/sales${s ? `?${s}` : ""}`); },
  salesCreate: (body) => req("/sales", { method: "POST", body }),
  salesPay: (id) => req(`/sales/${id}/pay`, { method: "POST" }),
  salesDelete: (id) => req(`/sales/${id}`, { method: "DELETE" }),

  // Inventory stock
  invStockLevels: () => req("/inventory/stock/levels"),

  // Assets
  assetsList: (status) => req(`/assets${status ? `?status=${status}` : ""}`),
  assetsCreate: (body) => req("/assets", { method: "POST", body }),
  assetsUpdate: (id, body) => req(`/assets/${id}`, { method: "PUT", body }),
  assetsDestroy: (id) => req(`/assets/${id}/destroy`, { method: "POST" }),
  assetsRestore: (id) => req(`/assets/${id}/restore`, { method: "POST" }),
  assetsDelete: (id) => req(`/assets/${id}`, { method: "DELETE" }),

  // Accounting (double-entry)
  accAccounts: () => req("/acc/accounts"),
  accCreateAccount: (body) => req("/acc/accounts", { method: "POST", body }),
  accUpdateAccount: (id, body) => req(`/acc/accounts/${id}`, { method: "PUT", body }),
  accDeleteAccount: (id) => req(`/acc/accounts/${id}`, { method: "DELETE" }),
  accSeedDefaults: () => req("/acc/accounts/seed-defaults", { method: "POST" }),
  accJournal: () => req("/acc/journal"),
  accCreateJournal: (body) => req("/acc/journal", { method: "POST", body }),
  accDeleteJournal: (id) => req(`/acc/journal/${id}`, { method: "DELETE" }),
  accQuick: (kind, body) => req(`/acc/${kind}`, { method: "POST", body }), // income | expense
  accLedger: (type) => req(`/acc/ledger/${type}`),
  accTrialBalance: (params = {}) => { const s = qs(params); return req(`/acc/trial-balance${s ? `?${s}` : ""}`); },
  accProfitLoss: (params = {}) => { const s = qs(params); return req(`/acc/profit-loss${s ? `?${s}` : ""}`); },
  accBalanceSheet: () => req("/acc/balance-sheet"),
  accCashBook: (params = {}) => { const s = qs(params); return req(`/acc/cash-book${s ? `?${s}` : ""}`); },
  accDashboard: () => req("/acc/dashboard"),

  // Reports
  reportCustomer: () => req("/reports/customer"),
  reportDueCustomers: () => req("/reports/due-customers"),
  reportBtrc: (month, year) => req(`/reports/btrc?month=${month}&year=${year}`),
  reportFinancial: (params = {}) => { const s = qs(params); return req(`/reports/financial${s ? `?${s}` : ""}`); },
  reportPgwFees: () => req("/reports/pgw-fees"),

  // SMS Service
  smsGateway: () => req("/sms/gateway"),
  smsSaveGateway: (body) => req("/sms/gateway", { method: "PUT", body }),
  smsGroupRecipients: (id) => req(`/sms/groups/${id}/recipients`),
  smsAddRecipient: (id, body) => req(`/sms/groups/${id}/recipients`, { method: "POST", body }),
  smsDeleteRecipient: (id) => req(`/sms/recipients/${id}`, { method: "DELETE" }),
  smsSend: (body) => req("/sms/send", { method: "POST", body }),
  smsMessages: () => req("/sms/messages"),

  // Affiliation
  affiliateList: () => req("/affiliation"),
  affiliateCreate: (body) => req("/affiliation", { method: "POST", body }),
  affiliateUpdate: (id, body) => req(`/affiliation/${id}`, { method: "PUT", body }),
  affiliateDelete: (id) => req(`/affiliation/${id}`, { method: "DELETE" }),

  // System
  sysUsers: () => req("/system/users"),
  sysCreateUser: (body) => req("/system/users", { method: "POST", body }),
  sysUpdateUser: (id, body) => req(`/system/users/${id}`, { method: "PUT", body }),
  sysDeleteUser: (id) => req(`/system/users/${id}`, { method: "DELETE" }),
  sysActivity: () => req("/system/activity"),
  sysAutomatic: () => req("/system/automatic"),

  // Platform Owner (SaaS control panel)
  platformOverview: () => req("/platform/overview"),
  platformDashboard: () => req("/platform/dashboard"),
  platformSettings: () => req("/platform/settings"),
  platformSaveSettings: (body) => req("/platform/settings", { method: "PUT", body }),
  platformPlans: () => req("/platform/plans"),
  platformCreatePlan: (body) => req("/platform/plans", { method: "POST", body }),
  platformUpdatePlan: (id, body) => req(`/platform/plans/${id}`, { method: "PUT", body }),
  platformDeletePlan: (id) => req(`/platform/plans/${id}`, { method: "DELETE" }),
  platformTenants: () => req("/platform/tenants"),
  platformUpdateTenant: (id, body) => req(`/platform/tenants/${id}`, { method: "PUT", body }),
  platformConfirmPayment: (id) => req(`/platform/tenants/${id}/confirm-payment`, { method: "POST" }),
  platformRenewTenant: (id) => req(`/platform/tenants/${id}/renew`, { method: "POST" }),
  platformResetPassword: (id, password) => req(`/platform/tenants/${id}/reset-password`, { method: "POST", body: { password } }),
  platformPendingPayments: () => req("/platform/payments/pending"),
  platformVerifyPayment: (id) => req(`/platform/payments/${id}/verify`, { method: "POST" }),
  platformRejectPayment: (id) => req(`/platform/payments/${id}/reject`, { method: "POST" }),
  platformSupport: () => req("/platform/support"),
  platformSupportReply: (id, reply, close = true) => req(`/platform/support/${id}/reply`, { method: "POST", body: { reply, close } }),
};
