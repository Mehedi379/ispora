-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "boxId" INTEGER,
ADD COLUMN     "clientTypeId" INTEGER,
ADD COLUMN     "connectionTypeId" INTEGER,
ADD COLUMN     "leftAt" TIMESTAMP(3),
ADD COLUMN     "protocolTypeId" INTEGER,
ADD COLUMN     "subZoneId" INTEGER;

-- CreateTable
CREATE TABLE "ClientRequest" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "pppoe" TEXT,
    "area" TEXT,
    "package" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientRequest_status_idx" ON "ClientRequest"("status");

-- CreateIndex
CREATE INDEX "Client_leftAt_idx" ON "Client"("leftAt");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_connectionTypeId_fkey" FOREIGN KEY ("connectionTypeId") REFERENCES "ConnectionType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_clientTypeId_fkey" FOREIGN KEY ("clientTypeId") REFERENCES "ClientType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_protocolTypeId_fkey" FOREIGN KEY ("protocolTypeId") REFERENCES "ProtocolType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "Box"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_subZoneId_fkey" FOREIGN KEY ("subZoneId") REFERENCES "SubZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
