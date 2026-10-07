ALTER TABLE "Comment"
  ADD COLUMN "companyNumber" TEXT,
  ADD COLUMN "companyStatus" TEXT,
  ADD COLUMN "companyType" TEXT,
  ADD COLUMN "companyLocality" TEXT,
  ADD COLUMN "companyVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "companyVerificationSource" TEXT,
  ADD COLUMN "companyVerifiedAt" TIMESTAMP(3);
