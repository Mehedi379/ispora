-- CreateTable
CREATE TABLE "LeaveCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "LeaveCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveSetup" (
    "id" SERIAL NOT NULL,
    "daysPerYear" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "LeaveSetup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveApplication" (
    "id" SERIAL NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "days" INTEGER NOT NULL DEFAULT 1,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "employeeId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "LeaveApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeaveCategory_name_key" ON "LeaveCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveSetup_categoryId_key" ON "LeaveSetup"("categoryId");

-- CreateIndex
CREATE INDEX "LeaveApplication_status_idx" ON "LeaveApplication"("status");

-- CreateIndex
CREATE INDEX "LeaveApplication_employeeId_idx" ON "LeaveApplication"("employeeId");

-- AddForeignKey
ALTER TABLE "LeaveSetup" ADD CONSTRAINT "LeaveSetup_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LeaveCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApplication" ADD CONSTRAINT "LeaveApplication_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApplication" ADD CONSTRAINT "LeaveApplication_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LeaveCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
