-- CreateTable
CREATE TABLE "VasService" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Other',
    "price" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VasService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VasTransaction" (
    "id" SERIAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serviceId" INTEGER NOT NULL,
    "clientId" INTEGER,

    CONSTRAINT "VasTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VasService_name_key" ON "VasService"("name");

-- CreateIndex
CREATE INDEX "VasTransaction_serviceId_idx" ON "VasTransaction"("serviceId");

-- CreateIndex
CREATE INDEX "VasTransaction_clientId_idx" ON "VasTransaction"("clientId");

-- CreateIndex
CREATE INDEX "VasTransaction_date_idx" ON "VasTransaction"("date");

-- AddForeignKey
ALTER TABLE "VasTransaction" ADD CONSTRAINT "VasTransaction_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "VasService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VasTransaction" ADD CONSTRAINT "VasTransaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
