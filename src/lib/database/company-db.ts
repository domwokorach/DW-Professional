import { PrismaClient } from "@/generated/company-client";

const globalForPrisma = globalThis as unknown as { companyPrisma?: PrismaClient };

export const companyDb =
  globalForPrisma.companyPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.companyPrisma = companyDb;
}
