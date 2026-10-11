-- CreateTable
CREATE TABLE "SaleEntry" (
    "id" SERIAL NOT NULL,
    "kind" TEXT NOT NULL,
    "clientId" INTEGER,
    "clientName" TEXT,
    "item" TEXT,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" INTEGER NOT NULL DEFAULT 0,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'unpaid',
    "note" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaleEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SaleEntry_kind_idx" ON "SaleEntry"("kind");

-- CreateIndex
CREATE INDEX "SaleEntry_status_idx" ON "SaleEntry"("status");
