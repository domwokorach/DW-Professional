-- AlterTable
ALTER TABLE "ResumeAccess" ADD COLUMN     "companyLocation" TEXT,
ADD COLUMN     "companyNumber" TEXT,
ADD COLUMN     "companySource" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "companyStatus" TEXT,
ADD COLUMN     "companyVerifiedAt" TIMESTAMP(3);

