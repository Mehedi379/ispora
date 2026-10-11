-- CreateTable
CREATE TABLE "SmsGateway" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'BulkSMSBD',
    "apiUrl" TEXT,
    "apiKeyEnc" TEXT,
    "senderId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SmsGateway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,

    CONSTRAINT "SmsTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "SmsGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsRecipient" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "phone" TEXT NOT NULL,
    "groupId" INTEGER NOT NULL,

    CONSTRAINT "SmsRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsMessage" (
    "id" SERIAL NOT NULL,
    "to" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmsMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SmsTemplate_name_key" ON "SmsTemplate"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SmsGroup_name_key" ON "SmsGroup"("name");

-- CreateIndex
CREATE INDEX "SmsRecipient_groupId_idx" ON "SmsRecipient"("groupId");

-- CreateIndex
CREATE INDEX "SmsMessage_date_idx" ON "SmsMessage"("date");

-- AddForeignKey
ALTER TABLE "SmsRecipient" ADD CONSTRAINT "SmsRecipient_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SmsGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
