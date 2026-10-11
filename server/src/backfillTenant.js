// One-off backfill: existing single-tenant data ke ekta "default tenant"-e dhukai,
// ar ekta Platform Owner account banai. Idempotent — barbar chalaleo problem nei.
import bcrypt from "bcryptjs";
import { prisma } from "./db.js";

const SCOPED_TABLES = [
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
];

async function main() {
  // 1) Legacy plan (unlimited, free) — purono ISP er jonno
  const plan = await prisma.plan.upsert({
    where: { name: "Legacy Unlimited" },
    update: {},
    create: { name: "Legacy Unlimited", priceMonthly: 0, maxUsers: 0, features: "*", active: true, sortOrder: 99 },
  });

  // 2) Default tenant — ekhon jei ISP-er data ache seta
  let tenant = await prisma.tenant.findFirst({ where: { email: "default@ispora.app" } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { businessName: "Default ISP", ownerName: "Admin", email: "default@ispora.app", status: "active", planId: plan.id },
    });
  }

  // 3) Subscription (active, legacy — bill nei)
  await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: { tenantId: tenant.id, planId: plan.id, status: "active" },
  });

  // 4) Shob business table-er null tenantId gula default tenant-e set (raw, fast)
  let totalRows = 0;
  for (const t of SCOPED_TABLES) {
    const n = await prisma.$executeRawUnsafe(`UPDATE "${t}" SET "tenantId" = $1 WHERE "tenantId" IS NULL`, tenant.id);
    totalRows += n;
  }

  // 5) Existing user (ISP admin/reseller/collector) ke default tenant-e, platform owner chhara
  const usersUpdated = await prisma.user.updateMany({
    where: { tenantId: null, isPlatformOwner: false },
    data: { tenantId: tenant.id },
  });

  // 6) Platform Owner account (SaaS malik) — alada login, tenant nei
  const ownerEmail = "owner@ispora.app";
  let owner = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (!owner) {
    owner = await prisma.user.create({
      data: {
        name: "Platform Owner", email: ownerEmail, password: await bcrypt.hash("owner12345", 10),
        role: "admin", isPlatformOwner: true, tenantId: null, active: true,
      },
    });
  } else if (!owner.isPlatformOwner) {
    owner = await prisma.user.update({ where: { id: owner.id }, data: { isPlatformOwner: true, tenantId: null } });
  }

  console.log(JSON.stringify({
    plan: plan.name, tenantId: tenant.id, tenantName: tenant.businessName,
    rowsBackfilled: totalRows, usersAttached: usersUpdated.count,
    platformOwner: { email: ownerEmail, id: owner.id, note: "password: owner12345 (change kore nio)" },
  }, null, 2));
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
