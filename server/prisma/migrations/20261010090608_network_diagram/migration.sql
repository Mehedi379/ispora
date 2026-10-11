-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "popId" INTEGER;

-- CreateTable
CREATE TABLE "NetworkPop" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'pop',
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "address" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'online',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkPop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkConnection" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'fiber',
    "bandwidth" TEXT,
    "note" TEXT,
    "fromId" INTEGER NOT NULL,
    "toId" INTEGER NOT NULL,

    CONSTRAINT "NetworkConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PopItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,
    "popId" INTEGER NOT NULL,

    CONSTRAINT "PopItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NetworkPop_type_idx" ON "NetworkPop"("type");

-- CreateIndex
CREATE INDEX "NetworkConnection_fromId_idx" ON "NetworkConnection"("fromId");

-- CreateIndex
CREATE INDEX "NetworkConnection_toId_idx" ON "NetworkConnection"("toId");

-- CreateIndex
CREATE INDEX "PopItem_popId_idx" ON "PopItem"("popId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_popId_fkey" FOREIGN KEY ("popId") REFERENCES "NetworkPop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkConnection" ADD CONSTRAINT "NetworkConnection_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "NetworkPop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkConnection" ADD CONSTRAINT "NetworkConnection_toId_fkey" FOREIGN KEY ("toId") REFERENCES "NetworkPop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PopItem" ADD CONSTRAINT "PopItem_popId_fkey" FOREIGN KEY ("popId") REFERENCES "NetworkPop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
