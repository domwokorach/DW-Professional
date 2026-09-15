-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "companyDomain" TEXT,
ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "companyIndustry" TEXT,
ADD COLUMN     "companyLocation" TEXT,
ADD COLUMN     "companyLogo" TEXT;

-- AlterTable
ALTER TABLE "CommentVerification" ADD COLUMN     "companyDomain" TEXT,
ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "companyIndustry" TEXT,
ADD COLUMN     "companyLocation" TEXT,
ADD COLUMN     "companyLogo" TEXT;
