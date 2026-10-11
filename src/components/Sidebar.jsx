import { NavLink } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, FileText, Store, Activity, Wallet, Scale,
  Boxes, BarChart3, Network, Sparkles, Server, LifeBuoy, Settings,
  ChevronDown, Wifi, SlidersHorizontal, Tv, ReceiptText, Router, Briefcase, CalendarDays, CalendarHeart, Download, ListChecks, Upload, ShoppingCart, PackageX, MessageSquare, Share2, Layers, Building2, Lock, Settings as SettingsIcon,
} from "lucide-react";
import { BRAND } from "../data";
import { useStore } from "../store";
import Logo from "./Logo";

// Platform Owner (SaaS malik) menu — tenant admin-er ISP menu theke alada
const platformMenu = [
  { to: "/platform/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/platform/tenants", icon: Building2, label: "Tenants (ISP)" },
  { to: "/platform/plans", icon: Layers, label: "Plans & Pricing" },
  { to: "/platform/support", icon: LifeBuoy, label: "Support Inbox" },
  { to: "/platform/settings", icon: SettingsIcon, label: "Payment Settings" },
];

// adminOnly: true -> shudhu admin dekhbe (reseller/collector er kache hide thakbe)
const menu = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { icon: SlidersHorizontal, label: "Configuration", adminOnly: true, children: [
    { to: "/config/zones", label: "Zone" },
    { to: "/config/sub-zones", label: "Sub Zone" },
    { to: "/config/boxes", label: "Box" },
    { to: "/config/connection-types", label: "Connection Type" },
    { to: "/config/client-types", label: "Client Type" },
    { to: "/config/protocol-types", label: "Protocol Type" },
    { to: "/config/billing-statuses", label: "Billing Status" },
    { to: "/packages", label: "Package" },
    { to: "/config/districts", label: "District" },
    { to: "/config/upazilas", label: "Upazila" },
  ]},
  { icon: Tv, label: "VAS", adminOnly: true, children: [
    { to: "/vas/config", label: "VAS Config" },
    { to: "/vas/transactions", label: "Transaction History" },
  ]},
  { icon: Users, label: "Clients", children: [
    { to: "/clients/new-request", label: "New Request" },
    { to: "/clients", label: "Customers" },
    { to: "/clients/due", label: "Due Clients" },
    { to: "/clients/left", label: "Left Clients" },
    { to: "/clients/change-requests", label: "Change Request" },
    { to: "/clients/scheduler", label: "Scheduler" },
    { to: "/clients/portal", label: "Portal Manage" },
    { to: "/clients/deleted", label: "Deleted", adminOnly: true },
  ]},
  { icon: ReceiptText, label: "Billing", children: [
    { to: "/billing/list", label: "Billing List" },
    { to: "/billing/collection", label: "Daily Bill Collection" },
    { to: "/invoices", label: "Invoices" },
    { to: "/payments", label: "Payments" },
  ]},
  { icon: Router, label: "Mikrotik Server", adminOnly: true, children: [
    { to: "/mikrotik/servers", label: "Server" },
    { to: "/mikrotik/backup", label: "Server Backup" },
    { to: "/mikrotik/import", label: "Import From Mikrotik" },
    { to: "/mikrotik/bulk-import", label: "Bulk Clients Import" },
  ]},
  { icon: Briefcase, label: "HR & Payroll", adminOnly: true, feature: "hr", children: [
    { to: "/hr/departments", label: "Department" },
    { to: "/hr/payheads", label: "Payhead" },
    { to: "/hr/payroll", label: "Payroll" },
    { to: "/hr/positions", label: "Position" },
    { to: "/hr/payslips", label: "Payslip" },
    { to: "/hr/employees", label: "Employee List" },
    { to: "/hr/salary-sheet", label: "Salary Sheet" },
    { to: "/hr/resign-rules", label: "Resign Rule" },
    { to: "/hr/resignation", label: "Resignation" },
    { to: "/hr/rejoin", label: "Rejoin" },
    { to: "/hr/attendance", label: "Attendance" },
  ]},
  { icon: Server, label: "OLT Management", adminOnly: true, children: [
    { to: "/olt", label: "Olt" },
    { to: "/olt/users", label: "Olt Users" },
  ]},
  { icon: Network, label: "Network Diagram", adminOnly: true, children: [
    { to: "/network-diagram", label: "Diagram" },
    { to: "/network-diagram/pop", label: "Network POP" },
    { to: "/network-diagram/clients", label: "Clients in Diagram" },
    { to: "/network-diagram/connections", label: "Network Connections" },
    { to: "/network-diagram/items", label: "Distributed Inv. Items" },
    { to: "/network-diagram/map", label: "Network View in Map" },
  ]},
  { icon: CalendarDays, label: "Leave Management", adminOnly: true, children: [
    { to: "/leave/categories", label: "Category" },
    { to: "/leave/setup", label: "Setup" },
    { to: "/leave/apply", label: "Apply" },
    { to: "/leave/approval", label: "Approval" },
  ]},
  { icon: Store, label: "MAC Reseller", adminOnly: true, children: [
    { to: "/mac/packages", label: "Package" },
    { to: "/mac/tariffs", label: "Tariff Config" },
    { to: "/mac/resellers", label: "MAC Reseller List" },
    { to: "/mac/funding", label: "Reseller Funding" },
    { to: "/mac/pgw", label: "Client PGW Payments" },
  ]},
  { icon: CalendarHeart, label: "Events & Holidays", adminOnly: true, children: [
    { to: "/events", label: "Index" },
  ]},
  { icon: LifeBuoy, label: "Support & Ticketing", children: [
    { to: "/support/categories", label: "Support Category", adminOnly: true },
    { to: "/support/tickets", label: "Client Support" },
    { to: "/support/history", label: "Support History" },
  ]},
  { icon: Download, label: "Bandwidth Buy", adminOnly: true, children: [
    { to: "/bwbuy/items", label: "Item" },
    { to: "/bwbuy/categories", label: "Item Category" },
    { to: "/bwbuy/providers", label: "Provider" },
    { to: "/bwbuy/bills", label: "Purchase Bill" },
  ]},
  { icon: ListChecks, label: "Task Management", adminOnly: true, children: [
    { to: "/tasks/categories", label: "Task Category" },
    { to: "/tasks", label: "Task" },
    { to: "/tasks/history", label: "Task History" },
  ]},
  { icon: Upload, label: "Bandwidth Sale", adminOnly: true, children: [
    { to: "/bwsale/resellers", label: "Reseller" },
    { to: "/bwsale/invoices", label: "Sales Invoice" },
    { to: "/bwsale/collection", label: "Bill Collection" },
    { to: "/bwsale/recurring", label: "Recurring Invoice" },
  ]},
  { icon: ShoppingCart, label: "Purchase", adminOnly: true, children: [
    { to: "/purchase/vendors", label: "Vendor" },
    { to: "/purchase/requisitions", label: "Requisition" },
    { to: "/purchase/purchases", label: "Purchase" },
    { to: "/purchase/bills", label: "Purchase bill" },
  ]},
  { icon: Store, label: "Sales & Service", adminOnly: true, children: [
    { to: "/sales/product", label: "Product Invoice" },
    { to: "/sales/service", label: "Service Invoice" },
    { to: "/sales/installation", label: "Installation Fee" },
  ]},
  { icon: Boxes, label: "Inventory", adminOnly: true, children: [
    { to: "/inventory/units", label: "Unit" },
    { to: "/inventory/locations", label: "Store Location" },
    { to: "/inventory/categories", label: "Item Category" },
    { to: "/inventory/items", label: "Item" },
    { to: "/inventory/stock", label: "Stock" },
  ]},
  { icon: PackageX, label: "Assets", adminOnly: true, children: [
    { to: "/assets", label: "Asset List" },
    { to: "/assets/destroyed", label: "Destroyed Items" },
  ]},
  { icon: Scale, label: "Accounting", adminOnly: true, feature: "accounting", children: [
    { to: "/acc", label: "Accounting Dashboard" },
    { to: "/acc/chart", label: "Chart of Accounts" },
    { to: "/acc/income", label: "Income" },
    { to: "/acc/expense", label: "Expense" },
    { to: "/acc/journal", label: "Journal" },
    { to: "/acc/transactions", label: "Accounting Transactions" },
    { to: "/acc/balances", label: "Account Balances" },
    { to: "/acc/balance-sheet", label: "Balance Sheet" },
    { to: "/acc/pl", label: "Profit Loss" },
    { to: "/acc/compare", label: "Compare Profit Loss" },
    { to: "/acc/trial-balance", label: "Trial Balance" },
    { to: "/acc/cash-book", label: "Cash Book" },
  ]},
  { icon: BarChart3, label: "Report", children: [
    { to: "/report/bill-collection", label: "Bill Collection" },
    { to: "/report/discount", label: "Discount Report" },
    { to: "/report/customer", label: "Customer Report" },
    { to: "/report/messages", label: "Messages Report" },
    { to: "/report/due-sms", label: "Due Customer SMS" },
    { to: "/report/pgw-fee", label: "Pay. Processing Fee" },
    { to: "/report/btrc", label: "BTRC Monthly Report" },
    { to: "/report/financial", label: "Financial Transactions" },
    { to: "/report", label: "All Report" },
  ]},
  { icon: MessageSquare, label: "SMS Service", adminOnly: true, feature: "sms", children: [
    { to: "/sms/individual", label: "Individual SMS" },
    { to: "/sms/templates", label: "SMS Template" },
    { to: "/sms/groups", label: "SMS Group" },
    { to: "/sms/send", label: "Send SMS" },
    { to: "/sms/gateway", label: "SMS Gateway" },
  ]},
  { icon: Share2, label: "Affiliation", adminOnly: true, children: [
    { to: "/affiliation/partners", label: "Affiliate Partners" },
  ]},
  { icon: Settings, label: "System", adminOnly: true, children: [
    { to: "/system/users", label: "App Users" },
    { to: "/system/company", label: "Company SetUp" },
    { to: "/system/invoice", label: "Invoice SetUp" },
    { to: "/system/periods", label: "Periods SetUp" },
    { to: "/system/payment", label: "Payment Gateways" },
    { to: "/system/email", label: "EMail SetUp" },
    { to: "/system/general", label: "System SetUp" },
    { to: "/system/processing-fee", label: "P. Processing Fee" },
    { to: "/system/vat", label: "VAT SetUp" },
    { to: "/system/activity", label: "Activity Loggers" },
    { to: "/system/automatic", label: "Automatic Process" },
  ]},
  // ISPora bonus — competitor-e nei
  { to: "/live", icon: Activity, label: "Live Stats" },
  { to: "/ai", icon: Sparkles, label: "AI Insights", badge: "AI" },
  { to: "/resellers", icon: Store, label: "Resellers", adminOnly: true },
];

function Group({ item, onNavigate }) {
  const [open, setOpen] = useState(false);
  const Icon = item.icon;
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5"
      >
        <Icon size={18} className="text-slate-400 group-hover:text-gold-400" />
        <span className="flex-1 text-left">{item.label}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={15} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="ml-5 mt-1 flex flex-col gap-0.5 border-l border-white/10 pl-3">
              {item.children.map((c) => (
                <NavLink
                  key={c.to}
                  to={c.to}
                  end
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm transition ${
                      isActive ? "text-gold-400 font-semibold bg-gold-500/10" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    }`
                  }
                >
                  {c.label}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Sidebar({ onNavigate }) {
  const { user, hasFeature } = useStore();
  const isAdmin = user?.role === "admin";
  // Platform Owner hole shudhu SaaS control menu — ISP module gula na
  const isOwner = user?.isPlatformOwner;
  const visibleMenu = isOwner
    ? platformMenu
    : menu
        .filter((item) => isAdmin || !item.adminOnly)
        .map((item) =>
          item.children
            ? { ...item, children: item.children.filter((c) => isAdmin || !c.adminOnly) }
            : item
        );
  return (
    <div className="flex h-full flex-col bg-navy-950 text-white">
      <div className="px-5 py-5">
        <Logo size={44} sub />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-6">
        {visibleMenu.map((item) =>
          item.children ? (
            item.feature && !hasFeature?.(item.feature) ? (
              <NavLink key={item.label} to="/upgrade" onClick={onNavigate}
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-white/5"
                title="Upgrade kore khulun">
                <item.icon size={18} className="text-slate-500" />
                <span className="flex-1">{item.label}</span>
                <Lock size={13} className="text-slate-500" />
              </NavLink>
            ) : (
              <Group key={item.label} item={item} onNavigate={onNavigate} />
            )
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-gradient-to-r from-gold-500/20 to-transparent text-gold-400"
                    : "text-slate-300 hover:bg-white/5"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} className={isActive ? "text-gold-400" : "text-slate-400 group-hover:text-gold-400"} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="rounded-md bg-gold-500/20 px-1.5 py-0.5 text-[10px] font-bold text-gold-400">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          )
        )}
      </nav>
    </div>
  );
}
