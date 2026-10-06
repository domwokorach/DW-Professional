-- AlterTable: the registered company a visitor picked in the Company field (all optional).
ALTER TABLE "ContactMessage" ADD COLUMN     "companyNumber" TEXT,
ADD COLUMN     "companyStatus" TEXT,
ADD COLUMN     "companyAddress" TEXT;
