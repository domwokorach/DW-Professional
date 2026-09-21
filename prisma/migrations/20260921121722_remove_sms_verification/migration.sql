-- AlterTable
ALTER TABLE "CommentVerification" DROP COLUMN "channel",
DROP COLUMN "mobile";

-- DropEnum
DROP TYPE "CommentVerificationChannel";

