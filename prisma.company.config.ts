// Prisma CLI configuration for the optional company dataset
// (npm run companies:generate | companies:migrate). Loads COMPANY_DATABASE_URL from .env.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * The company tables live in their own Postgres schema (default "companies"), so migrations only
 * ever create or change tables there, never another application's tables in `public`.
 * Keep in sync with src/lib/company-db.server.ts.
 */
const schema = process.env.COMPANY_DATABASE_SCHEMA || 'companies';

function withSchema(url: string | undefined) {
  if (!url) return url;
  const u = new URL(url);
  u.searchParams.set('schema', schema);
  return u.toString();
}

export default defineConfig({
  schema: 'prisma/company/schema.prisma',
  migrations: {
    path: 'prisma/company/migrations',
  },
  datasource: {
    url: withSchema(process.env['COMPANY_DATABASE_URL']),
  },
});
