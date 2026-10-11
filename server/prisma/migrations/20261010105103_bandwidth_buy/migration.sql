-- CreateTable
CREATE TABLE "BwItemCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "BwItemCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BwItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "note" TEXT,
    "categoryId" INTEGER,

    CONSTRAINT "BwItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BwProvider" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "note" TEXT,

    CONSTRAINT "BwProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BwPurchaseBill" (
    "id" SERIAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "bandwidth" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unpaid',
    "note" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "providerId" INTEGER NOT NULL,
    "itemId" INTEGER,

    CONSTRAINT "BwPurchaseBill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BwItemCategory_name_key" ON "BwItemCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BwItem_name_key" ON "BwItem"("name");

-- CreateIndex
CREATE INDEX "BwItem_categoryId_idx" ON "BwItem"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "BwProvider_name_key" ON "BwProvider"("name");

-- CreateIndex
CREATE INDEX "BwPurchaseBill_providerId_idx" ON "BwPurchaseBill"("providerId");

-- CreateIndex
CREATE INDEX "BwPurchaseBill_status_idx" ON "BwPurchaseBill"("status");

-- AddForeignKey
ALTER TABLE "BwItem" ADD CONSTRAINT "BwItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BwItemCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BwPurchaseBill" ADD CONSTRAINT "BwPurchaseBill_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "BwProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BwPurchaseBill" ADD CONSTRAINT "BwPurchaseBill_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "BwItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
