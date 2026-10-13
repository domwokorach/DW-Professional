-- CreateEnum
CREATE TYPE "ResumeStatus" AS ENUM ('PENDING_VERIFICATION', 'EMAIL_SENT', 'DELIVERY_FAILED', 'VERIFIED', 'DOWNLOADED');

-- CreateEnum
CREATE TYPE "ResumeEventType" AS ENUM ('REQUESTED', 'EMAIL_SENT', 'EMAIL_FAILED', 'RESENT', 'VERIFIED', 'VERIFY_FAILED', 'DOWNLOADED');

-- CreateTable
CREATE TABLE "ResumeAccess" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailKey" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'Resume Download',
    "status" "ResumeStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "pinHash" TEXT,
    "tokenHash" TEXT,
    "expiresAt" TIMESTAMP(3),
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "sendCount" INTEGER NOT NULL DEFAULT 0,
    "lastSentAt" TIMESTAMP(3),
    "grantHash" TEXT,
    "grantExpiresAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "firstDownloadedAt" TIMESTAMP(3),
    "lastDownloadedAt" TIMESTAMP(3),
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceType" TEXT,
    "deviceModel" TEXT,
    "os" TEXT,
    "browser" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeEvent" (
    "id" TEXT NOT NULL,
    "accessId" TEXT NOT NULL,
    "type" "ResumeEventType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeFile" (
    "id" TEXT NOT NULL DEFAULT 'current',
    "filename" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResumeAccess_emailKey_key" ON "ResumeAccess"("emailKey");

-- CreateIndex
CREATE UNIQUE INDEX "ResumeAccess_tokenHash_key" ON "ResumeAccess"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "ResumeAccess_grantHash_key" ON "ResumeAccess"("grantHash");

-- CreateIndex
CREATE INDEX "ResumeAccess_createdAt_idx" ON "ResumeAccess"("createdAt");

-- CreateIndex
CREATE INDEX "ResumeAccess_lastActivityAt_idx" ON "ResumeAccess"("lastActivityAt");

-- CreateIndex
CREATE INDEX "ResumeAccess_ipAddress_createdAt_idx" ON "ResumeAccess"("ipAddress", "createdAt");

-- CreateIndex
CREATE INDEX "ResumeEvent_accessId_createdAt_idx" ON "ResumeEvent"("accessId", "createdAt");

-- AddForeignKey
ALTER TABLE "ResumeEvent" ADD CONSTRAINT "ResumeEvent_accessId_fkey" FOREIGN KEY ("accessId") REFERENCES "ResumeAccess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

