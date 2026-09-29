// Generates the standalone Companies House Prisma client (see
// prisma/company/schema.prisma). Its config requires COMPANY_DATABASE_URL, so
// `prisma generate` hard-fails when that variable is absent. That is fine for
// the Next.js app, but the Socket.IO host (render.yaml -> dw-professional)
// never touches this dataset and has no reason to set the variable — and a
// failing postinstall there fails `npm ci`, which fails the whole deploy and
// silently leaves the previous build serving live traffic. So: generate when
// the database is configured, skip loudly when it is not.
import { spawnSync } from "node:child_process";
// prisma/company/prisma.config.ts does `import "dotenv/config"`, so locally
// COMPANY_DATABASE_URL lives in .env rather than the ambient environment.
// Load it the same way before deciding whether to skip, otherwise local
// installs would stop regenerating the company client altogether.
import "dotenv/config";

if (!process.env.COMPANY_DATABASE_URL) {
  console.log(
    "[postinstall] COMPANY_DATABASE_URL not set — skipping the company Prisma client. " +
      "Set it if this host serves company search."
  );
  process.exit(0);
}

const result = spawnSync(
  "prisma",
  ["generate", "--config", "prisma/company/prisma.config.ts"],
  { stdio: "inherit", shell: true }
);

process.exit(result.status ?? 1);
