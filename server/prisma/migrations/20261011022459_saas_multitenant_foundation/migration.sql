-- DropIndex
DROP INDEX "Account_code_key";

-- DropIndex
DROP INDEX "Attendance_employeeId_date_key";

-- DropIndex
DROP INDEX "BillingStatus_name_key";

-- DropIndex
DROP INDEX "Box_name_key";

-- DropIndex
DROP INDEX "BwBuyer_name_key";

-- DropIndex
DROP INDEX "BwItem_name_key";

-- DropIndex
DROP INDEX "BwItemCategory_name_key";

-- DropIndex
DROP INDEX "BwProvider_name_key";

-- DropIndex
DROP INDEX "Client_portalUser_key";

-- DropIndex
DROP INDEX "Client_pppoe_key";

-- DropIndex
DROP INDEX "ClientType_name_key";

-- DropIndex
DROP INDEX "ConnectionType_name_key";

-- DropIndex
DROP INDEX "Department_name_key";

-- DropIndex
DROP INDEX "District_name_key";

-- DropIndex
DROP INDEX "InvCategory_name_key";

-- DropIndex
DROP INDEX "InvItem_name_key";

-- DropIndex
DROP INDEX "InvUnit_name_key";

-- DropIndex
DROP INDEX "Invoice_number_key";

-- DropIndex
DROP INDEX "LeaveCategory_name_key";

-- DropIndex
DROP INDEX "LeaveSetup_categoryId_key";

-- DropIndex
DROP INDEX "MacPackage_name_key";

-- DropIndex
DROP INDEX "Package_name_key";

-- DropIndex
DROP INDEX "Payhead_name_key";

-- DropIndex
DROP INDEX "Payslip_employeeId_month_year_key";

-- DropIndex
DROP INDEX "Position_name_departmentId_key";

-- DropIndex
DROP INDEX "ProtocolType_name_key";

-- DropIndex
DROP INDEX "ResignRule_name_key";

-- DropIndex
DROP INDEX "SmsGroup_name_key";

-- DropIndex
DROP INDEX "SmsTemplate_name_key";

-- DropIndex
DROP INDEX "StoreLocation_name_key";

-- DropIndex
DROP INDEX "SubZone_name_zoneId_key";

-- DropIndex
DROP INDEX "SupportCategory_name_key";

-- DropIndex
DROP INDEX "Tariff_name_key";

-- DropIndex
DROP INDEX "TaskCategory_name_key";

-- DropIndex
DROP INDEX "Ticket_number_key";

-- DropIndex
DROP INDEX "Upazila_name_districtId_key";

-- DropIndex
DROP INDEX "VasService_name_key";

-- DropIndex
DROP INDEX "Vendor_name_key";

-- DropIndex
DROP INDEX "Zone_name_key";

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "Affiliate" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "BillingStatus" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "Box" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "BwBuyer" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "BwItem" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "BwItemCategory" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "BwProvider" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "BwPurchaseBill" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "BwRecurring" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "BwSaleInvoice" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "BwSalePayment" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "ChangeRequest" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "ClientRequest" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "ClientType" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "ConnectionType" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "District" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "HolidayEvent" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "InvCategory" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "InvItem" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "InvStock" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "InvUnit" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "JournalLine" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "LeaveApplication" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "LeaveCategory" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "LeaveSetup" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "MacPackage" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "MacReseller" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "MikrotikBackup" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "NetDevice" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "NetworkConnection" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "NetworkPop" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "OltUser" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "Payhead" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "Payslip" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "PgwPayment" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "PopItem" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "ProtocolType" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "PurchaseBill" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "Requisition" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "ResellerFunding" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "ResignRule" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "SaleEntry" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "Setting" DROP CONSTRAINT "Setting_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "tenantId" INTEGER,
ADD CONSTRAINT "Setting_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "SmsGateway" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "SmsGroup" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "SmsMessage" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "SmsRecipient" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "SmsTemplate" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "StoreLocation" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "SubZone" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "SupportCategory" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "Tariff" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "TaskCategory" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "Upazila" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isPlatformOwner" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "VasService" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "VasTransaction" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "Zone" ADD COLUMN     "tenantId" INTEGER;

-- CreateTable
CREATE TABLE "Tenant" (
    "id" SERIAL NOT NULL,
    "businessName" TEXT NOT NULL,
    "ownerName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'trial',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "planId" INTEGER,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "priceMonthly" INTEGER NOT NULL DEFAULT 0,
    "maxUsers" INTEGER NOT NULL DEFAULT 0,
    "features" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'trial',
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "nextBillDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" INTEGER NOT NULL,
    "planId" INTEGER,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaasInvoice" (
    "id" SERIAL NOT NULL,
    "number" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unpaid',
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "note" TEXT,
    "subscriptionId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,

    CONSTRAINT "SaasInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaasPayment" (
    "id" SERIAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'Manual',
    "txnId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "confirmedBy" INTEGER,
    "note" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionId" INTEGER NOT NULL,
    "invoiceId" INTEGER,
    "tenantId" INTEGER NOT NULL,

    CONSTRAINT "SaasPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_email_key" ON "Tenant"("email");

-- CreateIndex
CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_tenantId_key" ON "Subscription"("tenantId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SaasInvoice_number_key" ON "SaasInvoice"("number");

-- CreateIndex
CREATE INDEX "SaasInvoice_tenantId_idx" ON "SaasInvoice"("tenantId");

-- CreateIndex
CREATE INDEX "SaasInvoice_status_idx" ON "SaasInvoice"("status");

-- CreateIndex
CREATE INDEX "SaasPayment_tenantId_idx" ON "SaasPayment"("tenantId");

-- CreateIndex
CREATE INDEX "SaasPayment_status_idx" ON "SaasPayment"("status");

-- CreateIndex
CREATE INDEX "Account_tenantId_idx" ON "Account"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_tenantId_code_key" ON "Account"("tenantId", "code");

-- CreateIndex
CREATE INDEX "ActivityLog_tenantId_idx" ON "ActivityLog"("tenantId");

-- CreateIndex
CREATE INDEX "Affiliate_tenantId_idx" ON "Affiliate"("tenantId");

-- CreateIndex
CREATE INDEX "Asset_tenantId_idx" ON "Asset"("tenantId");

-- CreateIndex
CREATE INDEX "Attendance_tenantId_idx" ON "Attendance"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_tenantId_employeeId_date_key" ON "Attendance"("tenantId", "employeeId", "date");

-- CreateIndex
CREATE INDEX "BillingStatus_tenantId_idx" ON "BillingStatus"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingStatus_tenantId_name_key" ON "BillingStatus"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Box_tenantId_idx" ON "Box"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Box_tenantId_name_key" ON "Box"("tenantId", "name");

-- CreateIndex
CREATE INDEX "BwBuyer_tenantId_idx" ON "BwBuyer"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "BwBuyer_tenantId_name_key" ON "BwBuyer"("tenantId", "name");

-- CreateIndex
CREATE INDEX "BwItem_tenantId_idx" ON "BwItem"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "BwItem_tenantId_name_key" ON "BwItem"("tenantId", "name");

-- CreateIndex
CREATE INDEX "BwItemCategory_tenantId_idx" ON "BwItemCategory"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "BwItemCategory_tenantId_name_key" ON "BwItemCategory"("tenantId", "name");

-- CreateIndex
CREATE INDEX "BwProvider_tenantId_idx" ON "BwProvider"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "BwProvider_tenantId_name_key" ON "BwProvider"("tenantId", "name");

-- CreateIndex
CREATE INDEX "BwPurchaseBill_tenantId_idx" ON "BwPurchaseBill"("tenantId");

-- CreateIndex
CREATE INDEX "BwRecurring_tenantId_idx" ON "BwRecurring"("tenantId");

-- CreateIndex
CREATE INDEX "BwSaleInvoice_tenantId_idx" ON "BwSaleInvoice"("tenantId");

-- CreateIndex
CREATE INDEX "BwSalePayment_tenantId_idx" ON "BwSalePayment"("tenantId");

-- CreateIndex
CREATE INDEX "ChangeRequest_tenantId_idx" ON "ChangeRequest"("tenantId");

-- CreateIndex
CREATE INDEX "Client_tenantId_idx" ON "Client"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_tenantId_pppoe_key" ON "Client"("tenantId", "pppoe");

-- CreateIndex
CREATE UNIQUE INDEX "Client_tenantId_portalUser_key" ON "Client"("tenantId", "portalUser");

-- CreateIndex
CREATE INDEX "ClientRequest_tenantId_idx" ON "ClientRequest"("tenantId");

-- CreateIndex
CREATE INDEX "ClientType_tenantId_idx" ON "ClientType"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientType_tenantId_name_key" ON "ClientType"("tenantId", "name");

-- CreateIndex
CREATE INDEX "ConnectionType_tenantId_idx" ON "ConnectionType"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectionType_tenantId_name_key" ON "ConnectionType"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Department_tenantId_idx" ON "Department"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_tenantId_name_key" ON "Department"("tenantId", "name");

-- CreateIndex
CREATE INDEX "District_tenantId_idx" ON "District"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "District_tenantId_name_key" ON "District"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Employee_tenantId_idx" ON "Employee"("tenantId");

-- CreateIndex
CREATE INDEX "HolidayEvent_tenantId_idx" ON "HolidayEvent"("tenantId");

-- CreateIndex
CREATE INDEX "InvCategory_tenantId_idx" ON "InvCategory"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "InvCategory_tenantId_name_key" ON "InvCategory"("tenantId", "name");

-- CreateIndex
CREATE INDEX "InvItem_tenantId_idx" ON "InvItem"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "InvItem_tenantId_name_key" ON "InvItem"("tenantId", "name");

-- CreateIndex
CREATE INDEX "InvStock_tenantId_idx" ON "InvStock"("tenantId");

-- CreateIndex
CREATE INDEX "InvUnit_tenantId_idx" ON "InvUnit"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "InvUnit_tenantId_name_key" ON "InvUnit"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Invoice_tenantId_idx" ON "Invoice"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_tenantId_number_key" ON "Invoice"("tenantId", "number");

-- CreateIndex
CREATE INDEX "JournalEntry_tenantId_idx" ON "JournalEntry"("tenantId");

-- CreateIndex
CREATE INDEX "JournalLine_tenantId_idx" ON "JournalLine"("tenantId");

-- CreateIndex
CREATE INDEX "LeaveApplication_tenantId_idx" ON "LeaveApplication"("tenantId");

-- CreateIndex
CREATE INDEX "LeaveCategory_tenantId_idx" ON "LeaveCategory"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveCategory_tenantId_name_key" ON "LeaveCategory"("tenantId", "name");

-- CreateIndex
CREATE INDEX "LeaveSetup_tenantId_idx" ON "LeaveSetup"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveSetup_tenantId_categoryId_key" ON "LeaveSetup"("tenantId", "categoryId");

-- CreateIndex
CREATE INDEX "MacPackage_tenantId_idx" ON "MacPackage"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "MacPackage_tenantId_name_key" ON "MacPackage"("tenantId", "name");

-- CreateIndex
CREATE INDEX "MacReseller_tenantId_idx" ON "MacReseller"("tenantId");

-- CreateIndex
CREATE INDEX "MikrotikBackup_tenantId_idx" ON "MikrotikBackup"("tenantId");

-- CreateIndex
CREATE INDEX "NetDevice_tenantId_idx" ON "NetDevice"("tenantId");

-- CreateIndex
CREATE INDEX "NetworkConnection_tenantId_idx" ON "NetworkConnection"("tenantId");

-- CreateIndex
CREATE INDEX "NetworkPop_tenantId_idx" ON "NetworkPop"("tenantId");

-- CreateIndex
CREATE INDEX "OltUser_tenantId_idx" ON "OltUser"("tenantId");

-- CreateIndex
CREATE INDEX "Package_tenantId_idx" ON "Package"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Package_tenantId_name_key" ON "Package"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Payhead_tenantId_idx" ON "Payhead"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Payhead_tenantId_name_key" ON "Payhead"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Payment_tenantId_idx" ON "Payment"("tenantId");

-- CreateIndex
CREATE INDEX "Payslip_tenantId_idx" ON "Payslip"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Payslip_tenantId_employeeId_month_year_key" ON "Payslip"("tenantId", "employeeId", "month", "year");

-- CreateIndex
CREATE INDEX "PgwPayment_tenantId_idx" ON "PgwPayment"("tenantId");

-- CreateIndex
CREATE INDEX "PopItem_tenantId_idx" ON "PopItem"("tenantId");

-- CreateIndex
CREATE INDEX "Position_tenantId_idx" ON "Position"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Position_tenantId_name_departmentId_key" ON "Position"("tenantId", "name", "departmentId");

-- CreateIndex
CREATE INDEX "ProtocolType_tenantId_idx" ON "ProtocolType"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ProtocolType_tenantId_name_key" ON "ProtocolType"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Purchase_tenantId_idx" ON "Purchase"("tenantId");

-- CreateIndex
CREATE INDEX "PurchaseBill_tenantId_idx" ON "PurchaseBill"("tenantId");

-- CreateIndex
CREATE INDEX "Requisition_tenantId_idx" ON "Requisition"("tenantId");

-- CreateIndex
CREATE INDEX "ResellerFunding_tenantId_idx" ON "ResellerFunding"("tenantId");

-- CreateIndex
CREATE INDEX "ResignRule_tenantId_idx" ON "ResignRule"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ResignRule_tenantId_name_key" ON "ResignRule"("tenantId", "name");

-- CreateIndex
CREATE INDEX "SaleEntry_tenantId_idx" ON "SaleEntry"("tenantId");

-- CreateIndex
CREATE INDEX "Schedule_tenantId_idx" ON "Schedule"("tenantId");

-- CreateIndex
CREATE INDEX "Setting_tenantId_idx" ON "Setting"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_tenantId_key_key" ON "Setting"("tenantId", "key");

-- CreateIndex
CREATE INDEX "SmsGateway_tenantId_idx" ON "SmsGateway"("tenantId");

-- CreateIndex
CREATE INDEX "SmsGroup_tenantId_idx" ON "SmsGroup"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "SmsGroup_tenantId_name_key" ON "SmsGroup"("tenantId", "name");

-- CreateIndex
CREATE INDEX "SmsMessage_tenantId_idx" ON "SmsMessage"("tenantId");

-- CreateIndex
CREATE INDEX "SmsRecipient_tenantId_idx" ON "SmsRecipient"("tenantId");

-- CreateIndex
CREATE INDEX "SmsTemplate_tenantId_idx" ON "SmsTemplate"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "SmsTemplate_tenantId_name_key" ON "SmsTemplate"("tenantId", "name");

-- CreateIndex
CREATE INDEX "StoreLocation_tenantId_idx" ON "StoreLocation"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreLocation_tenantId_name_key" ON "StoreLocation"("tenantId", "name");

-- CreateIndex
CREATE INDEX "SubZone_tenantId_idx" ON "SubZone"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "SubZone_tenantId_name_zoneId_key" ON "SubZone"("tenantId", "name", "zoneId");

-- CreateIndex
CREATE INDEX "SupportCategory_tenantId_idx" ON "SupportCategory"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "SupportCategory_tenantId_name_key" ON "SupportCategory"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Tariff_tenantId_idx" ON "Tariff"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Tariff_tenantId_name_key" ON "Tariff"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Task_tenantId_idx" ON "Task"("tenantId");

-- CreateIndex
CREATE INDEX "TaskCategory_tenantId_idx" ON "TaskCategory"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskCategory_tenantId_name_key" ON "TaskCategory"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Ticket_tenantId_idx" ON "Ticket"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_tenantId_number_key" ON "Ticket"("tenantId", "number");

-- CreateIndex
CREATE INDEX "Transaction_tenantId_idx" ON "Transaction"("tenantId");

-- CreateIndex
CREATE INDEX "Upazila_tenantId_idx" ON "Upazila"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Upazila_tenantId_name_districtId_key" ON "Upazila"("tenantId", "name", "districtId");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "VasService_tenantId_idx" ON "VasService"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "VasService_tenantId_name_key" ON "VasService"("tenantId", "name");

-- CreateIndex
CREATE INDEX "VasTransaction_tenantId_idx" ON "VasTransaction"("tenantId");

-- CreateIndex
CREATE INDEX "Vendor_tenantId_idx" ON "Vendor"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_tenantId_name_key" ON "Vendor"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Zone_tenantId_idx" ON "Zone"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Zone_tenantId_name_key" ON "Zone"("tenantId", "name");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaasInvoice" ADD CONSTRAINT "SaasInvoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaasPayment" ADD CONSTRAINT "SaasPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaasPayment" ADD CONSTRAINT "SaasPayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "SaasInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

