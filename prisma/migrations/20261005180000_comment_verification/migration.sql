-- AlterEnum
ALTER TYPE "AdminAuditEvent" ADD VALUE 'COMMENT_VERIFIED';
ALTER TYPE "AdminAuditEvent" ADD VALUE 'COMMENT_UNVERIFIED';

-- AlterTable: admin-only verification, separate from approval. Existing comments start unverified.
ALTER TABLE "Comment" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedById" TEXT;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
