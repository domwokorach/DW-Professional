-- AlterEnum
ALTER TYPE "AdminAuditEvent" ADD VALUE 'COMMENT_ITALIC_ON';
ALTER TYPE "AdminAuditEvent" ADD VALUE 'COMMENT_ITALIC_OFF';

-- AlterTable: admin-only display choice (comment text in italics). Existing comments start upright.
ALTER TABLE "Comment" ADD COLUMN     "isItalic" BOOLEAN NOT NULL DEFAULT false;
