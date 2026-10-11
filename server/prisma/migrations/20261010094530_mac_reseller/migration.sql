-- CreateTable
CREATE TABLE "MacPackage" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "speed" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "validity" INTEGER NOT NULL DEFAULT 30,

    CONSTRAINT "MacPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tariff" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "commission" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,

    CONSTRAINT "Tariff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MacReseller" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "commission" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MacReseller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResellerFunding" (
    "id" SERIAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'Cash',
    "note" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resellerId" INTEGER NOT NULL,

    CONSTRAINT "ResellerFunding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PgwPayment" (
    "id" SERIAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "gateway" TEXT NOT NULL DEFAULT 'bKash',
    "txnId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'success',
    "note" TEXT,
    "clientId" INTEGER,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PgwPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MacPackage_name_key" ON "MacPackage"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tariff_name_key" ON "Tariff"("name");

-- CreateIndex
CREATE INDEX "MacReseller_active_idx" ON "MacReseller"("active");

-- CreateIndex
CREATE INDEX "ResellerFunding_resellerId_idx" ON "ResellerFunding"("resellerId");

-- CreateIndex
CREATE INDEX "PgwPayment_status_idx" ON "PgwPayment"("status");

-- CreateIndex
CREATE INDEX "PgwPayment_date_idx" ON "PgwPayment"("date");

-- AddForeignKey
ALTER TABLE "ResellerFunding" ADD CONSTRAINT "ResellerFunding_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "MacReseller"("id") ON DELETE CASCADE ON UPDATE CASCADE;
