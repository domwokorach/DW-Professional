-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "companyNumber" TEXT,
ADD COLUMN     "companySource" TEXT,
ADD COLUMN     "companyStatus" TEXT;

-- AlterTable
ALTER TABLE "CommentVerification" ADD COLUMN     "companyNumber" TEXT,
ADD COLUMN     "companySource" TEXT,
ADD COLUMN     "companyStatus" TEXT;
