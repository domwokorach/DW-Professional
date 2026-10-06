-- AlterEnum: audit event for an admin deleting a Portfolio Access submission.
ALTER TYPE "AdminAuditEvent" ADD VALUE 'PORTFOLIO_ACCESS_DELETED';

-- AlterTable: the submission an audit event refers to (kept after the submission is deleted).
ALTER TABLE "AdminAuditLog" ADD COLUMN "portfolioAccessId" TEXT;
