-- AlterTable
ALTER TABLE "NetDevice" ADD COLUMN     "apiPort" INTEGER NOT NULL DEFAULT 8728,
ADD COLUMN     "connected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastConnected" TIMESTAMP(3),
ADD COLUMN     "mode" TEXT NOT NULL DEFAULT 'mock',
ADD COLUMN     "passwordEnc" TEXT,
ADD COLUMN     "timeout" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "username" TEXT,
ADD COLUMN     "version" TEXT;

-- CreateTable
CREATE TABLE "MikrotikBackup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'simulated',
    "size" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "content" TEXT,
    "routerFile" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serverId" INTEGER NOT NULL,

    CONSTRAINT "MikrotikBackup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MikrotikBackup_serverId_idx" ON "MikrotikBackup"("serverId");

-- CreateIndex
CREATE INDEX "MikrotikBackup_type_idx" ON "MikrotikBackup"("type");

-- AddForeignKey
ALTER TABLE "MikrotikBackup" ADD CONSTRAINT "MikrotikBackup_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "NetDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
