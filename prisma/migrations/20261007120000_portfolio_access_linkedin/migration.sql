-- AlterTable: the LinkedIn identity a candidate connected with "Continue with LinkedIn" (all optional).
ALTER TABLE "PortfolioAccess" ADD COLUMN "linkedinMemberId" TEXT,
ADD COLUMN "linkedinName" TEXT,
ADD COLUMN "linkedinEmail" TEXT,
ADD COLUMN "linkedinAvatarUrl" TEXT,
ADD COLUMN "linkedinConnectedAt" TIMESTAMP(3);
