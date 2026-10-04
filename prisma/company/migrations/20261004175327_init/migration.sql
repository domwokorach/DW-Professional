-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "companies";

-- CreateTable
CREATE TABLE "Company" (
    "companyNumber" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "nameSearch" TEXT NOT NULL,
    "status" TEXT,
    "companyType" TEXT,
    "incorporationDate" DATE,
    "postTown" TEXT,
    "postcode" TEXT,
    "sicText" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("companyNumber")
);

-- CreateIndex
CREATE INDEX "Company_nameSearch_idx" ON "Company"("nameSearch" text_pattern_ops);

