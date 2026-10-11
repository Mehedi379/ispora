-- CreateTable
CREATE TABLE "OltUser" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "onu" TEXT,
    "ponPort" TEXT,
    "status" TEXT NOT NULL DEFAULT 'online',
    "signal" TEXT,
    "clientId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "oltId" INTEGER NOT NULL,

    CONSTRAINT "OltUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OltUser_oltId_idx" ON "OltUser"("oltId");

-- CreateIndex
CREATE INDEX "OltUser_status_idx" ON "OltUser"("status");

-- AddForeignKey
ALTER TABLE "OltUser" ADD CONSTRAINT "OltUser_oltId_fkey" FOREIGN KEY ("oltId") REFERENCES "NetDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
