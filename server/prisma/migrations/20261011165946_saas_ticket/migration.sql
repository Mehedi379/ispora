-- CreateTable
CREATE TABLE "SaasTicket" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "reply" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaasTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SaasTicket_tenantId_idx" ON "SaasTicket"("tenantId");

-- CreateIndex
CREATE INDEX "SaasTicket_status_idx" ON "SaasTicket"("status");

