-- CreateTable
CREATE TABLE "InvUnit" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "InvUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreLocation" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "StoreLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "InvCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "categoryId" INTEGER,
    "unitId" INTEGER,

    CONSTRAINT "InvItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvStock" (
    "id" SERIAL NOT NULL,
    "qty" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'in',
    "note" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itemId" INTEGER NOT NULL,
    "locationId" INTEGER,

    CONSTRAINT "InvStock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvUnit_name_key" ON "InvUnit"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StoreLocation_name_key" ON "StoreLocation"("name");

-- CreateIndex
CREATE UNIQUE INDEX "InvCategory_name_key" ON "InvCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "InvItem_name_key" ON "InvItem"("name");

-- CreateIndex
CREATE INDEX "InvItem_categoryId_idx" ON "InvItem"("categoryId");

-- CreateIndex
CREATE INDEX "InvStock_itemId_idx" ON "InvStock"("itemId");

-- AddForeignKey
ALTER TABLE "InvItem" ADD CONSTRAINT "InvItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "InvCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvItem" ADD CONSTRAINT "InvItem_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "InvUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvStock" ADD CONSTRAINT "InvStock_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InvItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvStock" ADD CONSTRAINT "InvStock_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "StoreLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
