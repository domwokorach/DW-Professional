-- AlterTable: optional professional profile links added on the Portfolio Access form.
ALTER TABLE "PortfolioAccess" ADD COLUMN "linkedinUrl" TEXT,
ADD COLUMN "companyWebsite" TEXT,
ADD COLUMN "portfolioUrl" TEXT;
