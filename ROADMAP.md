# ISPora — Full Build Roadmap

**Goal:** Triangle Services / ISP Digital-ke beat kora. Competitor-er 25 category + sub-item sob add kora.
Comparison: competitor menu `memory/competitor-triangle-menu.md`-e saved.

Legend: ✅ ache · 🟡 partial (ache kintu kom) · ❌ nei

---

## Current ISPora menu (ja ache ekhon)
Dashboard · Clients(Customers/Due/Deleted) · Invoices · Packages · Payments · Resellers ·
Live Stats · Accounting(basic) · Reports · Network&Map · AI Insights ·
Servers(MikroTik/OLT/Logs registry only) · Tickets · Settings

---

## GAP LIST — ki ki add korte hobe (25 category)

| # | Category | Status | Sub-items add korte hobe |
|---|----------|--------|--------------------------|
| 1 | Dashboard | 🟡 | 20 stat tile (Total/Running/Inactive/Waiver/New/Renewed/Deactivated/Left/Billing/Paid/Partial/Unpaid/Online/Blocked/BillDateExpire/UnpaidExtension/POP×4) + Zone/Sub-Zone problem chart + ticket/task counters |
| 2 | Configuration | ❌ | Zone · Sub Zone · Box · Connection Type · Client Type · Protocol Type · Billing Status · Package · District · Upazila |
| 3 | VAS | ❌ | VAS Config · Transaction History |
| 4 | Client | 🟡 | New Request · Add New · Client List · Left Client · Scheduler · Change Request · Portal Manage |
| 5 | Billing | 🟡 | Billing List · Daily Bill Collection |
| 6 | Mikrotik Server | 🟡 | **Real API connect** · Server · Server Backup · Import From Mikrotik · Bulk Clients Import |
| 7 | HR & Payroll | ❌ | Department · Payhead · Payroll · Position · Payslip · Add Employee · Employee List · Salary Sheet · Resign Rule · Resignation · Rejoin · Attendance |
| 8 | OLT Management | 🟡 | Olt · Olt Users |
| 9 | Network Diagram | 🟡 | Diagram · Network POP · Clients in Diagram · Network Connections · Distributed Inv. Items · Network View in Map |
| 10 | Leave Management | ❌ | Category · Setup · Apply · Approval |
| 11 | MAC Reseller | 🟡 | Package · Tariff Config · Add MAC Reseller · MAC Reseller List · Reseller Funding · Client PGW Payments |
| 12 | Events & Holidays | ❌ | Index |
| 13 | Support & Ticketing | 🟡 | Support Category · Client Support · Support History |
| 14 | Bandwidth Buy | ❌ | Item · Item Category · Provider · Purchase Bill |
| 15 | Task Management | ❌ | Task Category · Task · Task History |
| 16 | Bandwidth Sale | ❌ | Reseller · Sales Invoice · Bill Collection · Recurring Invoice |
| 17 | Purchase | ❌ | Vendor · Requisition · Purchase · Purchase bill |
| 18 | Sales & Service | ❌ | Product Invoice · Service Invoice · Installation Fee |
| 19 | Inventory | ❌ | Unit · Store Location · Item Category · Item · Stock |
| 20 | Assets | ❌ | Asset List · Destroyed Items |
| 21 | Accounting (double-entry) | 🟡 | Accounting Dashboard · Chart of Accounts · Income · Expense · Journal · Accounting Transactions · Account Balances · Balance Sheet · Profit Loss · Compare Profit Loss · Trial Balance · Cash Book |
| 22 | Report | 🟡 | Bill Collection · Discount · Customer · Messages · Due Customer SMS · Pay Processing Fee · **BTRC Monthly Report** · Financial Transactions · All Report |
| 23 | SMS Service | ❌ | Individual SMS · SMS Template · SMS Group · Send SMS · SMS Gateway |
| 24 | Affiliation | ❌ | Affiliate Partners · Add Affiliator |
| 25 | System | 🟡 | App Users · Company SetUp · Invoice SetUp · Periods SetUp · Payment Gateways · EMail SetUp · System SetUp · P.Processing Fee · VAT SetUp · Activity Loggers · Automatic Process |

Extra screens: Login (Client Registration + Forgot Password) · Account Manage (Personal/Change Password/Mobile/Email/Activity Log/Login History) · Topbar (Next Bill Date, Online Client Monitoring)

---

## BUILD ORDER (phase wise — step by step)

**Phase 0 — Foundation** `[in progress]`
- Full 25-category sidebar restructure (collapsible groups, role-based)
- Generic config-entity CRUD pattern (backend helper + frontend reusable page)
- Prisma schema: new models base

**Phase 1 — Configuration** (base data sob kichu ei upor depend kore)
- Zone, Sub Zone, Box, Connection Type, Client Type, Protocol Type, Billing Status, District, Upazila (Package already ache)

**Phase 2 — Client module expand**
- Expanded client fields (connType, clientType, box, subzone, district, upazila, cusType)
- New Request · Add New · Left Client · Change Request · Scheduler · Portal Manage

**Phase 3 — Billing**
- Billing List · Daily Bill Collection (collector-wise)

**Phase 4 — Dashboard upgrade** (20 tiles + charts)

**Phase 5 — SMS Service** (Template · Group · Send · Gateway · Individual + Due Customer SMS)

**Phase 6 — Accounting (double-entry)** (Chart of Accounts · Journal · Ledger · Balance Sheet · Trial Balance · Cash Book · P/L + Accounting Dashboard)

**Phase 7 — Inventory + Assets + Purchase + Sales & Service**

**Phase 8 — HR & Payroll + Leave + Events & Holidays**

**Phase 9 — MikroTik real API** (RouterOS connect, PPPoE active/disable, Import, Bulk, Backup) + OLT Management

**Phase 10 — Network Diagram + POP + Map**

**Phase 11 — MAC Reseller + Bandwidth Buy/Sale + VAS + Affiliation + Task Management**

**Phase 12 — Reports** (incl BTRC Monthly Report)

**Phase 13 — System** (App Users · Payment Gateways · VAT · Periods · Activity Logger · Automatic Process) + Account Manage + Client Portal/Registration/Forgot Password

---

## PROGRESS LOG
- 2026-10-09: Roadmap banano holo. Phase 0 shuru.
- 2026-10-09: Neon DB connect + migrate + seed. App live (frontend 5173, API 4000).
- 2026-10-09: **Phase 1 Configuration DONE** ✅ — 8 notun model (SubZone, Box, ConnectionType, ClientType, ProtocolType, BillingStatus, District, Upazila) + generic `/api/config` route + reusable `ConfigEntity.jsx` page + sidebar "Configuration" group (10 item). Create/list/parent-dropdown test pass, build pass.
- 2026-10-09: **Phase 2 Client expand DONE** ✅ —
  - Client model e config FK add: connectionType, clientType, protocolType, box, subZone + ClientForm e 5 ta notun dropdown
  - **New Request**: ClientRequest model + `/api/requests` (create/approve→client/reject/delete) + `NewRequests.jsx` page (pending/approved/rejected/all filter)
  - **Left Client** (churn): Client.leftAt + `/clients/left` + `/clients/:id/left` + `/clients/:id/rejoin` + `LeftClients.jsx` + Clients table e "Mark Left" button; active list + statusSweep leftAt skip kore
  - Sidebar "Clients" group: New Request · Customers · Due · Left · Deleted
  - API test (create/approve/left/rejoin) pass, build pass, UI verify (form dropdowns + New Request page)
  - **Phase 2 baki (2b)**: Scheduler · Change Request · Portal Manage
- 2026-10-09: **VAS DONE** ✅ — VasService + VasTransaction + `/api/vas` + VasConfig.jsx + VasTransactions.jsx + sidebar "VAS" (Config-er por). Strict menu order follow shuru.
- 2026-10-09: **Client verified** ✅ — create w/ config fields, edit pre-fill, New Request approve, Left/Rejoin, list — sob thik.
- 2026-10-09: **Billing DONE** ✅ — `/api/billing` (list + collection + bulk generate) + BillingList.jsx (stat cards + per-client bill/due/billed status + Generate Bills) + DailyCollection.jsx (date range, method-wise, collector-wise, payment list) + sidebar "Billing" group. API+UI+build pass.
- 2026-10-10: **Client 2b DONE** ✅ (Client module ekhon purapuri complete) —
  - **Change Request**: ChangeRequest model + `/api/change-requests` (create/approve→auto package change/reject) + `ChangeRequests.jsx`
  - **Scheduler**: Schedule model + `/api/schedules` (create/run-now/cancel) + auto-runner statusSweep-e wired (due holei auto cholbe) + `Scheduler.jsx`. Actions: disconnect/enable/package_change/reminder
  - **Portal Manage**: Client-e portalEnabled/portalUser/portalPassword(hashed) + `/api/portal` (enable/disable/credentials) + `PortalManage.jsx`
  - Sidebar "Clients": New Request · Customers · Due · Left · **Change Request · Scheduler · Portal Manage** · Deleted
- 2026-10-10: **Mikrotik Server DONE** ✅ (mock + real adapter architecture) — `src/mikrotik/` (crypto AES-256-GCM, mockAdapter, realAdapter via node-routeros, factory) + NetDevice credential/mode fields + MikrotikBackup model + admin-only `/api/mikrotik` (server CRUD, test, pppoe enable/disable+DB sync, import preview/import, bulk-import, backup) + 4 pages (Servers/Import/BulkImport/Backup). Password never in response/log. **Mock = simulation (import persist kore na, client 44→44 unchanged)**, real/simulated clearly labeled. 14 node:test pass. Real router: server mode=real + creds dile cholbe.
- 2026-10-10: **HR & Payroll DONE** ✅ — models (Department, Position, Payhead, ResignRule, Employee, Attendance, Payslip) + admin-only `/api/hr` + 8 pages. Menu-r 12 item: Department · Payhead · Payroll · Position · Payslip · Add Employee · Employee List · Salary Sheet · Resign Rule · Resignation · Rejoin · Attendance. Payroll = basic + earning payheads − deduction payheads (test: 15000+2000−500=16500 ✅), double-pay guard, resign/rejoin, attendance mark, salary sheet totals. API+UI+build pass, role guard ok.
- 2026-10-10: **OLT Management DONE** ✅ — OltUser model + NetDevice(type=olt) reuse + `/api/olt` (devices + users CRUD, oltId type-validated) + OltDevices.jsx + OltUsers.jsx + sidebar "OLT Management" group (Olt · Olt Users). Purano "Servers" group remove kora holo. API+UI+build pass, role guard ok.
- 2026-10-10: **Network Diagram DONE** ✅ — models (NetworkPop, NetworkConnection, PopItem) + Client.popId + `/api/network` (pops/connections/items CRUD, diagram, clients-in-diagram, assign-client) + 6 pages: Diagram (SVG topology, circular layout + edges), Network POP, Clients in Diagram (assign), Network Connections, Distributed Inv. Items, Network View in Map (lat/lng scatter). Sidebar "Network Diagram" group (purano "Network & Map" remove). API+UI+build pass, role guard ok.
- 2026-10-10: **Leave Management DONE** ✅ — models (LeaveCategory, LeaveSetup, LeaveApplication) + `/api/leave` + pages: Category (HrLookup base=leave), Setup, Apply, Approval (LeaveApplications view=apply/approval). Days auto-compute, date validation, approve/reject. HrLookup ekhon `base` prop ney (hr+leave reuse) + api generic crudList/Create/Update/Delete. API+UI+build pass.
- 2026-10-10: **MAC Reseller DONE** ✅ — models (MacPackage, Tariff, MacReseller, ResellerFunding, PgwPayment) + `/api/mac` + 6 pages: Package (HrLookup base=mac), Tariff Config (HrLookup), Add/List MAC Reseller (MacResellers), Reseller Funding (atomic balance increment — test 0→5000), Client PGW Payments (gateway log). API+UI+build pass.
- 2026-10-10: **Events & Holidays DONE** ✅ — HolidayEvent model + `/api/events` + EventsIndex.jsx (year filter, holiday/event card grid, multi-day support). API+UI+build pass.
- 2026-10-10: **Support & Ticketing DONE** ✅ — SupportCategory model + Ticket.categoryId + `/api/support/categories` + tickets route e category wire. 3 page: Support Category (HrLookup base=support), Client Support (existing Tickets kanban + category dropdown/tag), Support History (closed ticket list). Sidebar "Support & Ticketing" group (purano "Tickets" replace). API+UI+build pass.
- 2026-10-10: **Bandwidth Buy DONE** ✅ — models (BwItemCategory, BwItem, BwProvider, BwPurchaseBill) + `/api/bwbuy` + 4 pages: Item + Item Category + Provider (HrLookup base=bwbuy), Purchase Bill (dedicated, pay action + unpaid total). API+UI+build pass.
- 2026-10-10: **Task Management DONE** ✅ — models (TaskCategory, Task) + `/api/tasks` + TaskManager (view board/history, status pending→processing→done, assignee from employees) + Task Category (HrLookup base=tasks). API+UI+build pass.
- 2026-10-10: **Bandwidth Sale DONE** ✅ — models (BwBuyer, BwSaleInvoice, BwRecurring, BwSalePayment) + `/api/bwsale` + 4 pages: Reseller (HrLookup), Sales Invoice (pay), Bill Collection (collect→invoice paid), Recurring Invoice (generate this-month, double-guard). Full flow test: recurring→generate→invoice→collect→paid ✅. API+UI+build pass.
- 2026-10-10: **Purchase** ✅ (Vendor/Requisition/Purchase/Bill), **Sales & Service** ✅ (SaleEntry: product/service/installation), **Inventory** ✅ (Unit/Location/Category/Item + Stock net-level), **Assets** ✅ (list + destroyed). Sob API+build pass.
- 2026-10-10: **Accounting DONE** ✅ (full double-entry) — Account/JournalEntry/JournalLine models + `/api/acc` + 12 pages: Dashboard, Chart of Accounts (seed defaults), Income, Expense (quick 2-line entry), Journal (multi-line dr=cr validate), Accounting Transactions, Account Balances, Trial Balance, Balance Sheet, Profit Loss, Compare P/L, Cash Book. **Double-entry integrity verified**: income 50000 + expense 12000 → trial balance Dr 62000=Cr 62000 balanced, P/L net 38000, cash book 38000, dashboard match ✅.
- 2026-10-10: **Report DONE** ✅ — `/api/reports` (customer, due-customers, btrc, financial, pgw-fees) + 9 pages: Bill Collection (reuse), Discount (note), Customer Report (stats+zone/pkg breakdown), Messages (note), Due Customer SMS, Pay Processing Fee, BTRC Monthly Report (regulatory), Financial Transactions, All Report (hub). Test: customer total 44, due 17, BTRC subs/revenue, financial ✅. API+UI+build pass.
- 2026-10-10: **SMS Service DONE** ✅ — models (SmsGateway, SmsTemplate, SmsGroup, SmsRecipient, SmsMessage) + `/api/sms` + 5 pages: Individual SMS, SMS Template, SMS Group (+recipients), Send SMS (all/group/manual), SMS Gateway (apiKey encrypted, never returned). Mock send = "simulated" when gateway inactive (never fakes real send). Messages Report ekhon live. Test: gateway save (hasKey, key hidden), send 2 → simulated, log 2 ✅.
- 2026-10-10: **Affiliation DONE** ✅ — Affiliate model + `/api/affiliation` + Affiliates page (partners list + Add Affiliator). API+build pass.
- 2026-10-10: **System DONE** ✅ — App Users (real User CRUD /api/system/users, role/active/password), 8 SetUp pages (Company/Invoice/Periods/Payment Gateways/Email/System/P.Processing Fee/VAT — generic SysSetup via /api/settings, secret keys masked: bkash/nagad/smtp/sms), Activity Loggers (ActivityLog model + app-level mutation-logging middleware, full originalUrl path, no password) + viewer, Automatic Process (auto toggles). Test: user CRUD, bkashKey masked (••••), activity "POST /api/affiliation" logged ✅.

## 🎉 ALL 25 COMPETITOR CATEGORIES DONE (25/25)
Configuration · VAS · Client · Billing · Mikrotik Server · HR & Payroll · OLT Management · Network Diagram · Leave Management · MAC Reseller · Events & Holidays · Support & Ticketing · Bandwidth Buy · Task Management · Bandwidth Sale · Purchase · Sales & Service · Inventory · Assets · Accounting · Report · SMS Service · Affiliation · System · (Dashboard base)
## TODO (polish): sidebar competitor-exact order reorder · Dashboard 20-tile upgrade · Login client-registration/forgot-password · real MikroTik/SMS/payment gateway live creds
- 2026-10-10: **Sidebar reorder DONE** ✅ (competitor-exact top-to-bottom order; Invoices/Payments folded into Billing group; Live Stats/AI Insights/Resellers moved to bonus section at bottom). **Dashboard 20-tile DONE** ✅ (/stats/dashboard endpoint — Total/Running/Inactive/New/Left/Paid/Unpaid/Due/Expired/Suspended/Online/Blocked/BillExpire/UnpaidExt/POP/POP-clients/Pending+Processing tickets+tasks). Build pass, UI verified.