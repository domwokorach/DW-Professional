import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Separate config for the Companies House dataset's standalone database —
// the root prisma.config.ts hardcodes datasource.url to DATABASE_URL, so
// company-schema commands must use --config prisma/company/prisma.config.ts
// (see the db:company:* package.json scripts) to stay pointed at
// COMPANY_DATABASE_URL instead.
export default defineConfig({
  schema: "schema.prisma",
  migrations: {
    path: "migrations",
  },
  datasource: {
    url: env("COMPANY_DATABASE_URL"),
  },
});
