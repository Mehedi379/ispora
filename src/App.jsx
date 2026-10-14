import { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import { useStore } from "./store";
import { Loader2 } from "lucide-react";

// Route-level code splitting — 500KB+ ekta chunk e sob na bosay
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Clients = lazy(() => import("./pages/Clients"));
const Invoices = lazy(() => import("./pages/Invoices"));
const Packages = lazy(() => import("./pages/Packages"));
const Payments = lazy(() => import("./pages/Payments"));
const Settings = lazy(() => import("./pages/Settings"));
const LiveStats = lazy(() => import("./pages/LiveStats"));
const Reports = lazy(() => import("./pages/Reports"));
const Resellers = lazy(() => import("./pages/Resellers"));
const Accounting = lazy(() => import("./pages/Accounting"));
const Tickets = lazy(() => import("./pages/Tickets"));
const AiInsights = lazy(() => import("./pages/AiInsights"));
const Servers = lazy(() => import("./pages/Servers"));
const Network = lazy(() => import("./pages/Network"));
const Login = lazy(() => import("./pages/Login"));
const Landing = lazy(() => import("./pages/Landing"));
const Signup = lazy(() => import("./pages/Signup"));
const LockScreen = lazy(() => import("./pages/LockScreen"));
const PaySuccess = lazy(() => import("./pages/PaySuccess"));
const PlatformPlans = lazy(() => import("./pages/PlatformPlans"));
const PlatformTenants = lazy(() => import("./pages/PlatformTenants"));
const PlatformDashboard = lazy(() => import("./pages/PlatformDashboard"));
const PlatformSettings = lazy(() => import("./pages/PlatformSettings"));
const PlatformSupport = lazy(() => import("./pages/PlatformSupport"));
const Upgrade = lazy(() => import("./pages/Upgrade"));
const Subscription = lazy(() => import("./pages/Subscription"));
const Placeholder = lazy(() => import("./pages/Placeholder"));
const DeletedCustomers = lazy(() => import("./pages/DeletedCustomers"));
const ConfigEntity = lazy(() => import("./pages/ConfigEntity"));
const NewRequests = lazy(() => import("./pages/NewRequests"));
const LeftClients = lazy(() => import("./pages/LeftClients"));
const ChangeRequests = lazy(() => import("./pages/ChangeRequests"));
const Scheduler = lazy(() => import("./pages/Scheduler"));
const PortalManage = lazy(() => import("./pages/PortalManage"));
const VasConfig = lazy(() => import("./pages/VasConfig"));
const VasTransactions = lazy(() => import("./pages/VasTransactions"));
const BillingList = lazy(() => import("./pages/BillingList"));
const DailyCollection = lazy(() => import("./pages/DailyCollection"));
const MikrotikServers = lazy(() => import("./pages/MikrotikServers"));
const MikrotikBackup = lazy(() => import("./pages/MikrotikBackup"));
const MikrotikImport = lazy(() => import("./pages/MikrotikImport"));
const MikrotikBulkImport = lazy(() => import("./pages/MikrotikBulkImport"));
const HrLookup = lazy(() => import("./pages/HrLookup"));
const HrEmployees = lazy(() => import("./pages/HrEmployees"));
const HrAttendance = lazy(() => import("./pages/HrAttendance"));
const HrPayroll = lazy(() => import("./pages/HrPayroll"));
const HrPayslips = lazy(() => import("./pages/HrPayslips"));
const HrSalarySheet = lazy(() => import("./pages/HrSalarySheet"));
const OltDevices = lazy(() => import("./pages/OltDevices"));
const OltUsers = lazy(() => import("./pages/OltUsers"));
const NetworkDiagram = lazy(() => import("./pages/NetworkDiagram"));
const NetworkPop = lazy(() => import("./pages/NetworkPop"));
const ClientsInDiagram = lazy(() => import("./pages/ClientsInDiagram"));
const NetworkConnections = lazy(() => import("./pages/NetworkConnections"));
const DistributedItems = lazy(() => import("./pages/DistributedItems"));
const NetworkMap = lazy(() => import("./pages/NetworkMap"));
const LeaveSetup = lazy(() => import("./pages/LeaveSetup"));
const LeaveApplications = lazy(() => import("./pages/LeaveApplications"));
const MacResellers = lazy(() => import("./pages/MacResellers"));
const MacFunding = lazy(() => import("./pages/MacFunding"));
const MacPgw = lazy(() => import("./pages/MacPgw"));
const EventsIndex = lazy(() => import("./pages/EventsIndex"));
const SupportHistory = lazy(() => import("./pages/SupportHistory"));
const BwPurchaseBills = lazy(() => import("./pages/BwPurchaseBills"));
const TaskManager = lazy(() => import("./pages/TaskManager"));
const BwSaleInvoices = lazy(() => import("./pages/BwSaleInvoices"));
const BwBillCollection = lazy(() => import("./pages/BwBillCollection"));
const BwRecurring = lazy(() => import("./pages/BwRecurring"));
const PurchaseReqs = lazy(() => import("./pages/PurchaseReqs"));
const Purchases = lazy(() => import("./pages/Purchases"));
const PurchaseBills = lazy(() => import("./pages/PurchaseBills"));
const SalesEntries = lazy(() => import("./pages/SalesEntries"));
const InventoryStock = lazy(() => import("./pages/InventoryStock"));
const Assets = lazy(() => import("./pages/Assets"));
const AccDashboard = lazy(() => import("./pages/AccDashboard"));
const AccChart = lazy(() => import("./pages/AccChart"));
const AccQuick = lazy(() => import("./pages/AccQuick"));
const AccJournal = lazy(() => import("./pages/AccJournal"));
const AccTrialBalance = lazy(() => import("./pages/AccTrialBalance"));
const AccProfitLoss = lazy(() => import("./pages/AccProfitLoss"));
const AccCompare = lazy(() => import("./pages/AccCompare"));
const AccBalanceSheet = lazy(() => import("./pages/AccBalanceSheet"));
const AccCashBook = lazy(() => import("./pages/AccCashBook"));
const CustomerReport = lazy(() => import("./pages/CustomerReport"));
const DueCustomers = lazy(() => import("./pages/DueCustomers"));
const BtrcReport = lazy(() => import("./pages/BtrcReport"));
const FinancialReport = lazy(() => import("./pages/FinancialReport"));
const PgwFeeReport = lazy(() => import("./pages/ReportExtra").then((m) => ({ default: m.PgwFeeReport })));
const ReportsHub = lazy(() => import("./pages/ReportExtra").then((m) => ({ default: m.ReportsHub })));
const ReportNote = lazy(() => import("./pages/ReportExtra").then((m) => ({ default: m.ReportNote })));
const MessagesReport = lazy(() => import("./pages/MessagesReport"));
const SmsGateway = lazy(() => import("./pages/SmsGateway"));
const SmsTemplates = lazy(() => import("./pages/SmsTemplates"));
const SmsGroups = lazy(() => import("./pages/SmsGroups"));
const SmsSend = lazy(() => import("./pages/SmsSend"));
const Affiliates = lazy(() => import("./pages/Affiliates"));
const AppUsers = lazy(() => import("./pages/AppUsers"));
const SysSetup = lazy(() => import("./pages/SysSetup"));
const ActivityLog = lazy(() => import("./pages/ActivityLog"));
const AccountManage = lazy(() => import("./pages/AccountManage"));

// Configuration entity routes — ekta component, props diye alada alada
const CONFIG = [
  { path: "zones", title: "Zone" },
  { path: "sub-zones", title: "Sub Zone", parent: { entity: "zones", key: "zoneId", rel: "zone", label: "Zone" } },
  { path: "boxes", title: "Box", extra: ["code", "capacity"], parent: { entity: "sub-zones", key: "subZoneId", rel: "subZone", label: "Sub Zone" }, grand: { rel: "zone", label: "Zone" } },
  { path: "connection-types", title: "Connection Type", hasActive: true },
  { path: "client-types", title: "Client Type" },
  { path: "protocol-types", title: "Protocol Type", hasActive: true },
  { path: "billing-statuses", title: "Billing Status" },
  { path: "districts", title: "District" },
  { path: "upazilas", title: "Upazila", parent: { entity: "districts", key: "districtId", rel: "district", label: "District" } },
];

const Spinner = () => (
  <div className="grid min-h-[60vh] place-items-center">
    <Loader2 size={28} className="animate-spin text-gold-500" />
  </div>
);

// Admin-only route guard — sidebar hide na thakleo URL diye chole ashle 403
function AdminOnly({ children }) {
  const { user } = useStore();
  if (user?.role !== "admin") {
    return <Placeholder title="403 — Access Denied" note="Ei page shudhu admin-er jonno. Apnar role e ei ongsho khola nei." />;
  }
  return children;
}

// Platform Owner (SaaS malik) only guard
function PlatformOnly({ children }) {
  const { user } = useStore();
  if (!user?.isPlatformOwner) {
    return <Placeholder title="403 — Access Denied" note="Ei page shudhu Platform Owner-er jonno." />;
  }
  return children;
}

export default function App() {
  const [open, setOpen] = useState(false);
  // Dark mode persist — age refresh korlei abar dark-e reset hoto
  const [dark, setDark] = useState(() => localStorage.getItem("ispora.dark") !== "0");
  const location = useLocation();
  const { user, authReady, toast, ent } = useStore();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("ispora.dark", dark ? "1" : "0");
  }, [dark]);

  // Session check cholakhotin loader
  if (!authReady) {
    return (
      <div className="grid min-h-screen place-items-center bg-navy-950">
        <Loader2 size={28} className="animate-spin text-gold-500" />
      </div>
    );
  }

  // Login na kora thakle login / signup public page
  if (!user) {
    return (
      <Suspense fallback={<div className="grid min-h-screen place-items-center bg-navy-950"><Loader2 size={28} className="animate-spin text-gold-500" /></div>}>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Landing />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </Suspense>
    );
  }

  // Payment gateway redirect (SSLCOMMERZ) — lock-er aage, jate result dekha jay
  if (location.pathname.startsWith("/pay/")) {
    return (
      <Suspense fallback={<div className="grid min-h-screen place-items-center bg-navy-950"><Loader2 size={28} className="animate-spin text-gold-500" /></div>}>
        <PaySuccess fail={location.pathname.includes("fail")} />
      </Suspense>
    );
  }

  // Trial/subscription sesh — tenant user hole pura app lock (owner-ke na)
  if (ent?.locked && !user.isPlatformOwner) {
    return (
      <Suspense fallback={<div className="grid min-h-screen place-items-center bg-navy-950"><Loader2 size={28} className="animate-spin text-gold-500" /></div>}>
        <LockScreen />
      </Suspense>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", damping: 26, stiffness: 240 }}
              className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden"
            >
              <Sidebar onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenu={() => setOpen(true)} dark={dark} setDark={setDark} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <Suspense fallback={<Spinner />}>
                <Routes location={location}>
                  <Route path="/" element={user?.isPlatformOwner ? <PlatformOnly><PlatformDashboard /></PlatformOnly> : <Dashboard />} />
                  {/* Login/signup URL-e thaka obosthay login korle authed app-e oi path 404 dekhato — tai home-e pathai */}
                  <Route path="/login" element={<Navigate to="/" replace />} />
                  <Route path="/signup" element={<Navigate to="/" replace />} />
                  <Route path="/platform/dashboard" element={<PlatformOnly><PlatformDashboard /></PlatformOnly>} />
                  <Route path="/platform/settings" element={<PlatformOnly><PlatformSettings /></PlatformOnly>} />
                  <Route path="/platform/support" element={<PlatformOnly><PlatformSupport /></PlatformOnly>} />
                  <Route path="/platform/plans" element={<PlatformOnly><PlatformPlans /></PlatformOnly>} />
                  <Route path="/platform/tenants" element={<PlatformOnly><PlatformTenants /></PlatformOnly>} />
                  <Route path="/account" element={<AccountManage />} />                  <Route path="/upgrade" element={<Upgrade />} />
                  <Route path="/subscription" element={<AdminOnly><Subscription /></AdminOnly>} />                  <Route path="/clients" element={<Clients />} />
                  <Route path="/clients/due" element={<Clients filterStatus="due" />} />
                  <Route path="/clients/new-request" element={<NewRequests />} />
                  <Route path="/clients/left" element={<LeftClients />} />
                  <Route path="/clients/change-requests" element={<ChangeRequests />} />
                  <Route path="/clients/scheduler" element={<Scheduler />} />
                  <Route path="/clients/portal" element={<PortalManage />} />
                  <Route path="/clients/deleted" element={<AdminOnly><DeletedCustomers /></AdminOnly>} />
                  {CONFIG.map((c) => (
                    <Route key={c.path} path={`/config/${c.path}`}
                      element={<AdminOnly><ConfigEntity title={c.title} entity={c.path} parent={c.parent} grand={c.grand} extra={c.extra} hasActive={c.hasActive} /></AdminOnly>} />
                  ))}
                  <Route path="/vas/config" element={<AdminOnly><VasConfig /></AdminOnly>} />
                  <Route path="/vas/transactions" element={<AdminOnly><VasTransactions /></AdminOnly>} />
                  <Route path="/billing/list" element={<BillingList />} />
                  <Route path="/billing/collection" element={<DailyCollection />} />
                  <Route path="/mikrotik/servers" element={<AdminOnly><MikrotikServers /></AdminOnly>} />
                  <Route path="/mikrotik/backup" element={<AdminOnly><MikrotikBackup /></AdminOnly>} />
                  <Route path="/mikrotik/import" element={<AdminOnly><MikrotikImport /></AdminOnly>} />
                  <Route path="/mikrotik/bulk-import" element={<AdminOnly><MikrotikBulkImport /></AdminOnly>} />
                  <Route path="/hr/departments" element={<AdminOnly><HrLookup title="Department" entity="departments" fields={[{ key: "details", label: "Details", type: "text" }]} /></AdminOnly>} />
                  <Route path="/hr/positions" element={<AdminOnly><HrLookup title="Position" entity="positions" fields={[{ key: "type", label: "Position Type", type: "enum", options: ["Shared", "Single"] }, { key: "departmentId", label: "Department", type: "select", optionsEntity: "departments", displayKey: "department" }, { key: "supervisor", label: "Supervisor", type: "text" }, { key: "status", label: "Status", type: "enum", options: ["active", "inactive"] }]} /></AdminOnly>} />
                  <Route path="/hr/payheads" element={<AdminOnly><HrLookup title="Payhead" entity="payheads" fields={[{ key: "type", label: "PayHead Type", type: "enum", options: ["earning", "deduction"] }, { key: "amount", label: "Amount", type: "number" }, { key: "description", label: "Description", type: "text" }]} /></AdminOnly>} />
                  <Route path="/hr/resign-rules" element={<AdminOnly><HrLookup title="Resign Rule" entity="resign-rules" fields={[{ key: "noticeDays", label: "Notice Days", type: "number" }, { key: "note", label: "Details", type: "text" }]} /></AdminOnly>} />
                  <Route path="/hr/employees" element={<AdminOnly><HrEmployees view="list" /></AdminOnly>} />
                  <Route path="/hr/resignation" element={<AdminOnly><HrEmployees view="resignation" /></AdminOnly>} />
                  <Route path="/hr/rejoin" element={<AdminOnly><HrEmployees view="rejoin" /></AdminOnly>} />
                  <Route path="/hr/attendance" element={<AdminOnly><HrAttendance /></AdminOnly>} />
                  <Route path="/hr/payroll" element={<AdminOnly><HrPayroll /></AdminOnly>} />
                  <Route path="/hr/payslips" element={<AdminOnly><HrPayslips /></AdminOnly>} />
                  <Route path="/hr/salary-sheet" element={<AdminOnly><HrSalarySheet /></AdminOnly>} />
                  <Route path="/olt" element={<AdminOnly><OltDevices /></AdminOnly>} />
                  <Route path="/olt/users" element={<AdminOnly><OltUsers /></AdminOnly>} />
                  <Route path="/network-diagram" element={<AdminOnly><NetworkDiagram /></AdminOnly>} />
                  <Route path="/network-diagram/pop" element={<AdminOnly><NetworkPop /></AdminOnly>} />
                  <Route path="/network-diagram/clients" element={<AdminOnly><ClientsInDiagram /></AdminOnly>} />
                  <Route path="/network-diagram/connections" element={<AdminOnly><NetworkConnections /></AdminOnly>} />
                  <Route path="/network-diagram/items" element={<AdminOnly><DistributedItems /></AdminOnly>} />
                  <Route path="/network-diagram/map" element={<AdminOnly><NetworkMap /></AdminOnly>} />
                  <Route path="/leave/categories" element={<AdminOnly><HrLookup base="leave" title="Leave Category" entity="categories" fields={[{ key: "note", label: "Note", type: "text" }]} /></AdminOnly>} />
                  <Route path="/leave/setup" element={<AdminOnly><LeaveSetup /></AdminOnly>} />
                  <Route path="/leave/apply" element={<AdminOnly><LeaveApplications view="apply" /></AdminOnly>} />
                  <Route path="/leave/approval" element={<AdminOnly><LeaveApplications view="approval" /></AdminOnly>} />
                  <Route path="/mac/packages" element={<AdminOnly><HrLookup base="mac" title="MAC Package" entity="packages" fields={[{ key: "speed", label: "Speed", type: "text" }, { key: "price", label: "Price", type: "number" }, { key: "validity", label: "Validity", type: "number" }]} /></AdminOnly>} />
                  <Route path="/mac/tariffs" element={<AdminOnly><HrLookup base="mac" title="Tariff" entity="tariffs" fields={[{ key: "commission", label: "Commission %", type: "number" }, { key: "note", label: "Note", type: "text" }]} /></AdminOnly>} />
                  <Route path="/mac/resellers" element={<AdminOnly><MacResellers /></AdminOnly>} />
                  <Route path="/mac/funding" element={<AdminOnly><MacFunding /></AdminOnly>} />
                  <Route path="/mac/pgw" element={<AdminOnly><MacPgw /></AdminOnly>} />
                  <Route path="/events" element={<AdminOnly><EventsIndex /></AdminOnly>} />
                  <Route path="/support/categories" element={<AdminOnly><HrLookup base="support" title="Support Category" entity="categories" fields={[{ key: "note", label: "Note", type: "text" }]} /></AdminOnly>} />
                  <Route path="/support/tickets" element={<Tickets />} />
                  <Route path="/support/history" element={<SupportHistory />} />
                  <Route path="/bwbuy/categories" element={<AdminOnly><HrLookup base="bwbuy" title="Item Category" entity="categories" fields={[{ key: "note", label: "Note", type: "text" }]} /></AdminOnly>} />
                  <Route path="/bwbuy/items" element={<AdminOnly><HrLookup base="bwbuy" title="BW Item" entity="items" fields={[{ key: "categoryId", label: "Category", type: "select", optionsEntity: "categories", displayKey: "category" }, { key: "unit", label: "Unit", type: "text" }, { key: "note", label: "Note", type: "text" }]} /></AdminOnly>} />
                  <Route path="/bwbuy/providers" element={<AdminOnly><HrLookup base="bwbuy" title="Provider" entity="providers" fields={[{ key: "phone", label: "Phone", type: "text" }, { key: "email", label: "Email", type: "text" }, { key: "address", label: "Address", type: "text" }]} /></AdminOnly>} />
                  <Route path="/bwbuy/bills" element={<AdminOnly><BwPurchaseBills /></AdminOnly>} />
                  <Route path="/tasks/categories" element={<AdminOnly><HrLookup base="tasks" title="Task Category" entity="categories" fields={[{ key: "note", label: "Note", type: "text" }]} /></AdminOnly>} />
                  <Route path="/tasks" element={<AdminOnly><TaskManager view="board" /></AdminOnly>} />
                  <Route path="/tasks/history" element={<AdminOnly><TaskManager view="history" /></AdminOnly>} />
                  <Route path="/bwsale/resellers" element={<AdminOnly><HrLookup base="bwsale" title="BW Reseller" entity="resellers" fields={[{ key: "phone", label: "Phone", type: "text" }, { key: "email", label: "Email", type: "text" }, { key: "note", label: "Note", type: "text" }]} /></AdminOnly>} />
                  <Route path="/bwsale/invoices" element={<AdminOnly><BwSaleInvoices /></AdminOnly>} />
                  <Route path="/bwsale/collection" element={<AdminOnly><BwBillCollection /></AdminOnly>} />
                  <Route path="/bwsale/recurring" element={<AdminOnly><BwRecurring /></AdminOnly>} />
                  <Route path="/purchase/vendors" element={<AdminOnly><HrLookup base="purchase" title="Vendor" entity="vendors" fields={[{ key: "phone", label: "Phone", type: "text" }, { key: "email", label: "Email", type: "text" }, { key: "address", label: "Address", type: "text" }]} /></AdminOnly>} />
                  <Route path="/purchase/requisitions" element={<AdminOnly><PurchaseReqs /></AdminOnly>} />
                  <Route path="/purchase/purchases" element={<AdminOnly><Purchases /></AdminOnly>} />
                  <Route path="/purchase/bills" element={<AdminOnly><PurchaseBills /></AdminOnly>} />
                  <Route path="/sales/product" element={<AdminOnly><SalesEntries kind="product" /></AdminOnly>} />
                  <Route path="/sales/service" element={<AdminOnly><SalesEntries kind="service" /></AdminOnly>} />
                  <Route path="/sales/installation" element={<AdminOnly><SalesEntries kind="installation" /></AdminOnly>} />
                  <Route path="/inventory/units" element={<AdminOnly><HrLookup base="inventory" title="Unit" entity="units" fields={[]} /></AdminOnly>} />
                  <Route path="/inventory/locations" element={<AdminOnly><HrLookup base="inventory" title="Store Location" entity="locations" fields={[{ key: "note", label: "Note", type: "text" }]} /></AdminOnly>} />
                  <Route path="/inventory/categories" element={<AdminOnly><HrLookup base="inventory" title="Item Category" entity="categories" fields={[{ key: "note", label: "Note", type: "text" }]} /></AdminOnly>} />
                  <Route path="/inventory/items" element={<AdminOnly><HrLookup base="inventory" title="Inventory Item" entity="items" fields={[{ key: "categoryId", label: "Category", type: "select", optionsEntity: "categories", displayKey: "category" }, { key: "unitId", label: "Unit", type: "select", optionsEntity: "units", displayKey: "unit" }]} /></AdminOnly>} />
                  <Route path="/inventory/stock" element={<AdminOnly><InventoryStock /></AdminOnly>} />
                  <Route path="/assets" element={<AdminOnly><Assets view="active" /></AdminOnly>} />
                  <Route path="/assets/destroyed" element={<AdminOnly><Assets view="destroyed" /></AdminOnly>} />
                  <Route path="/acc" element={<AdminOnly><AccDashboard /></AdminOnly>} />
                  <Route path="/acc/chart" element={<AdminOnly><AccChart /></AdminOnly>} />
                  <Route path="/acc/income" element={<AdminOnly><AccQuick kind="income" /></AdminOnly>} />
                  <Route path="/acc/expense" element={<AdminOnly><AccQuick kind="expense" /></AdminOnly>} />
                  <Route path="/acc/journal" element={<AdminOnly><AccJournal /></AdminOnly>} />
                  <Route path="/acc/transactions" element={<AdminOnly><AccJournal readOnly /></AdminOnly>} />
                  <Route path="/acc/balances" element={<AdminOnly><AccTrialBalance mode="balances" /></AdminOnly>} />
                  <Route path="/acc/balance-sheet" element={<AdminOnly><AccBalanceSheet /></AdminOnly>} />
                  <Route path="/acc/pl" element={<AdminOnly><AccProfitLoss /></AdminOnly>} />
                  <Route path="/acc/compare" element={<AdminOnly><AccCompare /></AdminOnly>} />
                  <Route path="/acc/trial-balance" element={<AdminOnly><AccTrialBalance mode="trial" /></AdminOnly>} />
                  <Route path="/acc/cash-book" element={<AdminOnly><AccCashBook /></AdminOnly>} />
                  <Route path="/report" element={<ReportsHub />} />
                  <Route path="/report/bill-collection" element={<DailyCollection />} />
                  <Route path="/report/customer" element={<CustomerReport />} />
                  <Route path="/report/due-sms" element={<DueCustomers view="sms" />} />
                  <Route path="/report/btrc" element={<AdminOnly><BtrcReport /></AdminOnly>} />
                  <Route path="/report/financial" element={<AdminOnly><FinancialReport /></AdminOnly>} />
                  <Route path="/report/pgw-fee" element={<AdminOnly><PgwFeeReport /></AdminOnly>} />
                  <Route path="/report/discount" element={<ReportNote title="Discount Report" note="Ekhono discount tracking add kora hoyni. Invoice/payment e discount field add korle ei report-e dekhabe." />} />
                  <Route path="/report/messages" element={<MessagesReport />} />
                  <Route path="/sms/individual" element={<AdminOnly><SmsSend view="individual" /></AdminOnly>} />
                  <Route path="/sms/templates" element={<AdminOnly><SmsTemplates /></AdminOnly>} />
                  <Route path="/sms/groups" element={<AdminOnly><SmsGroups /></AdminOnly>} />
                  <Route path="/sms/send" element={<AdminOnly><SmsSend view="bulk" /></AdminOnly>} />
                  <Route path="/sms/gateway" element={<AdminOnly><SmsGateway /></AdminOnly>} />
                  <Route path="/affiliation/partners" element={<AdminOnly><Affiliates /></AdminOnly>} />
                  <Route path="/system/users" element={<AdminOnly><AppUsers /></AdminOnly>} />
                  <Route path="/system/activity" element={<AdminOnly><ActivityLog /></AdminOnly>} />
                  <Route path="/system/company" element={<AdminOnly><SysSetup title="Company SetUp" subtitle="Company info" fields={[{ key: "companyName", label: "Company Name" }, { key: "companyPhone", label: "Phone" }, { key: "companyEmail", label: "Email" }, { key: "companyAddress", label: "Address" }, { key: "companyLogo", label: "Logo URL" }]} /></AdminOnly>} />
                  <Route path="/system/invoice" element={<AdminOnly><SysSetup title="Invoice SetUp" subtitle="Invoice prefix o footer" fields={[{ key: "invoicePrefix", label: "Invoice Prefix", placeholder: "INV-" }, { key: "invoiceFooter", label: "Footer", type: "textarea" }]} /></AdminOnly>} />
                  <Route path="/system/periods" element={<AdminOnly><SysSetup title="Periods SetUp" subtitle="Billing period" fields={[{ key: "billDate", label: "Bill Date" }, { key: "dueAfterDays", label: "Grace Days", type: "number" }, { key: "fiscalYearStart", label: "Fiscal Year Start" }]} /></AdminOnly>} />
                  <Route path="/system/payment" element={<AdminOnly><SysSetup title="Payment Gateways" subtitle="bKash/Nagad merchant (key encrypted/masked)" fields={[{ key: "bkashNumber", label: "bKash Number" }, { key: "bkashKey", label: "bKash API Key", type: "password" }, { key: "nagadNumber", label: "Nagad Number" }, { key: "nagadKey", label: "Nagad API Key", type: "password" }]} /></AdminOnly>} />
                  <Route path="/system/email" element={<AdminOnly><SysSetup title="EMail SetUp" subtitle="SMTP config" fields={[{ key: "smtpHost", label: "SMTP Host" }, { key: "smtpPort", label: "Port", type: "number" }, { key: "smtpUser", label: "Username" }, { key: "smtpPass", label: "Password", type: "password" }, { key: "smtpFrom", label: "From Email" }]} /></AdminOnly>} />
                  <Route path="/system/general" element={<AdminOnly><SysSetup title="System SetUp" subtitle="General" fields={[{ key: "currency", label: "Currency" }, { key: "timezone", label: "Timezone" }]} /></AdminOnly>} />
                  <Route path="/system/processing-fee" element={<AdminOnly><SysSetup title="P. Processing Fee" subtitle="Payment processing fee %" fields={[{ key: "processingFee", label: "Processing Fee (%)", type: "number" }]} /></AdminOnly>} />
                  <Route path="/system/vat" element={<AdminOnly><SysSetup title="VAT SetUp" subtitle="VAT o penalty" fields={[{ key: "vat", label: "VAT (%)", type: "number" }, { key: "penalty", label: "Late Penalty (৳)", type: "number" }]} /></AdminOnly>} />
                  <Route path="/system/automatic" element={<AdminOnly><SysSetup title="Automatic Process" subtitle="Auto disconnect / auto bill engine (statusSweep)" fields={[{ key: "autoDisconnect", label: "Auto Disconnect", type: "select", options: ["Enabled", "Disabled"] }, { key: "autoBill", label: "Auto Monthly Bill", type: "select", options: ["Enabled", "Disabled"] }, { key: "whatsapp", label: "WhatsApp Notify", type: "select", options: ["Enabled", "Disabled"] }]} /></AdminOnly>} />
                  <Route path="/invoices" element={<Invoices />} />
                  <Route path="/packages" element={<Packages />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/resellers" element={<AdminOnly><Resellers /></AdminOnly>} />
                  <Route path="/live" element={<LiveStats />} />
                  <Route path="/accounting" element={<AdminOnly><Accounting /></AdminOnly>} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/network" element={<Network />} />
                  <Route path="/ai" element={<AiInsights />} />
                  <Route path="/servers/mikrotik" element={<AdminOnly><Servers type="mikrotik" /></AdminOnly>} />
                  <Route path="/servers/olt" element={<AdminOnly><Servers type="olt" /></AdminOnly>} />
                  <Route path="/servers/logs" element={<AdminOnly><Servers type="logs" /></AdminOnly>} />
                  <Route path="/tickets" element={<Tickets />} />
                  <Route path="/settings" element={<AdminOnly><Settings /></AdminOnly>} />
                  <Route path="*" element={<Placeholder title="404 — Page Not Found" />} />
                </Routes>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global toast — API error / permission fail warning */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
            className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl backdrop-blur"
            style={{
              borderColor: toast.kind === "success" ? "rgba(16,185,129,.35)" : "rgba(244,63,94,.35)",
              background: "rgba(15,23,42,.95)",
              color: toast.kind === "success" ? "#6ee7b7" : "#fda4af",
            }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
