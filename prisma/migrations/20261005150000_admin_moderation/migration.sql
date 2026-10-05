-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN');

-- CreateEnum
CREATE TYPE "AdminAuditEvent" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGIN_THROTTLED', 'LOGOUT', 'SESSION_REVOKED', 'PASSWORD_CHANGED', 'COMMENT_APPROVED', 'COMMENT_REJECTED', 'COMMENT_DELETED');

-- AlterTable: candidate fields, moderation metadata and consent. The table is created by the previous
-- migration and has no rows when both are applied together; the NOT NULL columns assume that.
ALTER TABLE "Comment" RENAME COLUMN "name" TO "fullName";
ALTER TABLE "Comment" RENAME COLUMN "roleCompany" TO "company";
ALTER TABLE "Comment" ADD COLUMN     "avatarKey" TEXT,
ADD COLUMN     "consentGiven" BOOLEAN NOT NULL,
ADD COLUMN     "consentGivenAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "device" TEXT,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "moderatedAt" TIMESTAMP(3),
ADD COLUMN     "moderatedById" TEXT,
ADD COLUMN     "notificationStatus" "EmailStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "sessionTokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT,
    "event" "AdminAuditEvent" NOT NULL,
    "commentId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminLoginAttempt" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_sessionTokenHash_key" ON "AdminSession"("sessionTokenHash");

-- CreateIndex
CREATE INDEX "AdminSession_adminUserId_idx" ON "AdminSession"("adminUserId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminUserId_createdAt_idx" ON "AdminAuditLog"("adminUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_event_createdAt_idx" ON "AdminAuditLog"("event", "createdAt");

-- CreateIndex
CREATE INDEX "AdminLoginAttempt_ipAddress_createdAt_idx" ON "AdminLoginAttempt"("ipAddress", "createdAt");

-- CreateIndex
CREATE INDEX "AdminLoginAttempt_emailHash_createdAt_idx" ON "AdminLoginAttempt"("emailHash", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_ipAddress_createdAt_idx" ON "Comment"("ipAddress", "createdAt");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

