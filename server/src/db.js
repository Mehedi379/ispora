import { PrismaClient } from "@prisma/client";
import { getTenantId } from "./tenantContext.js";

// Business model gula auto tenant-scoped. Platform/global model (Tenant, Plan,
// Subscription, SaasInvoice, SaasPayment, User) ei set-e NEI — oigula global.
// Notun business model add korle ekhane naam add korte HOBE, nahole leak.
const SCOPED = new Set([
  "Zone", "SubZone", "Box", "ConnectionType", "ClientType", "ProtocolType", "BillingStatus",
  "District", "Upazila", "ClientRequest", "VasService", "VasTransaction", "ChangeRequest",
  "Schedule", "Package", "Client", "Invoice", "Payment", "Transaction", "Setting", "Ticket",
  "SupportCategory", "NetDevice", "MikrotikBackup", "OltUser", "Department", "Position",
  "Payhead", "ResignRule", "Employee", "Attendance", "Payslip", "NetworkPop", "NetworkConnection",
  "PopItem", "LeaveCategory", "LeaveSetup", "LeaveApplication", "MacPackage", "Tariff",
  "MacReseller", "ResellerFunding", "PgwPayment", "HolidayEvent", "BwItemCategory", "BwItem",
  "BwProvider", "BwPurchaseBill", "TaskCategory", "Task", "BwBuyer", "BwSaleInvoice", "BwRecurring",
  "BwSalePayment", "Vendor", "Requisition", "Purchase", "PurchaseBill", "SaleEntry", "InvUnit",
  "StoreLocation", "InvCategory", "InvItem", "InvStock", "Asset", "Account", "JournalEntry",
  "JournalLine", "SmsGateway", "SmsTemplate", "SmsGroup", "SmsRecipient", "SmsMessage", "Affiliate",
  "ActivityLog",
]);

const WHERE_OPS = new Set(["findFirst", "findFirstOrThrow", "findMany", "count", "aggregate", "groupBy", "updateMany", "deleteMany"]);

// Prisma 6-e middleware ($use) nei — client extension diye tenant-scope kori.
const base = new PrismaClient();

export const prisma = base.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const tid = getTenantId();
        // Context nei (platform owner / seed / backfill) ba global model → scope skip
        if (tid == null || !SCOPED.has(model)) return query(args);

        // Create/write-e tenantId inject
        if (operation === "create") {
          args.data = { ...args.data, tenantId: tid };
          return query(args);
        }
        if (operation === "createMany") {
          const d = args.data;
          args.data = Array.isArray(d) ? d.map((x) => ({ ...x, tenantId: tid })) : { ...d, tenantId: tid };
          return query(args);
        }
        if (operation === "upsert") {
          args.create = { ...args.create, tenantId: tid };
          return query(args);
        }

        // List/aggregate/bulk — where-e tenantId filter boshai
        if (WHERE_OPS.has(operation)) {
          args.where = { ...(args.where || {}), tenantId: tid };
          return query(args);
        }

        // findUnique(OrThrow): where-e shudhu unique field allow, tai post-check kori
        // (ei codebase-e findUnique shobshomoy id diye — id globally unique)
        if (operation === "findUnique" || operation === "findUniqueOrThrow") {
          const r = await query(args);
          if (r && r.tenantId !== tid) {
            if (operation === "findUniqueOrThrow") {
              const err = new Error("No record found"); err.code = "P2025"; throw err;
            }
            return null;
          }
          return r;
        }

        // Single update/delete (by unique id): route aage scoped findFirst diye
        // ownership check kore — tai nirapod. P3-er aage pura audit.
        return query(args);
      },
    },
  },
});
