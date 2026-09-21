-- CreateEnum
CREATE TYPE "CommentVerificationChannel" AS ENUM ('EMAIL', 'SMS');

-- DropIndex
DROP INDEX "CompanyRecord_name_trgm_idx";

-- AlterTable
ALTER TABLE "CommentVerification" ADD COLUMN     "channel" "CommentVerificationChannel" NOT NULL DEFAULT 'EMAIL',
ALTER COLUMN "pinHash" DROP NOT NULL;
