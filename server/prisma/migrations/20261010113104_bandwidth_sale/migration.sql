-- CreateTable
CREATE TABLE "BwBuyer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "note" TEXT,

    CONSTRAINT "BwBuyer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BwSaleInvoice" (
    "id" SERIAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "period" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unpaid',
    "note" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "buyerId" INTEGER NOT NULL,

    CONSTRAINT "BwSaleInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BwRecurring" (
    "id" SERIAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "buyerId" INTEGER NOT NULL,

    CONSTRAINT "BwRecurring_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BwSalePayment" (
    "id" SERIAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'Cash',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "buyerId" INTEGER NOT NULL,
    "invoiceId" INTEGER,

    CONSTRAINT "BwSalePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BwBuyer_name_key" ON "BwBuyer"("name");

-- CreateIndex
CREATE INDEX "BwSaleInvoice_buyerId_idx" ON "BwSaleInvoice"("buyerId");

-- CreateIndex
CREATE INDEX "BwSaleInvoice_status_idx" ON "BwSaleInvoice"("status");

-- CreateIndex
CREATE INDEX "BwRecurring_buyerId_idx" ON "BwRecurring"("buyerId");

-- CreateIndex
CREATE INDEX "BwSalePayment_buyerId_idx" ON "BwSalePayment"("buyerId");

-- AddForeignKey
ALTER TABLE "BwSaleInvoice" ADD CONSTRAINT "BwSaleInvoice_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "BwBuyer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BwRecurring" ADD CONSTRAINT "BwRecurring_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "BwBuyer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
