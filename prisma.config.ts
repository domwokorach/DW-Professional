// Prisma CLI configuration (migrations, generate, studio). Loads DATABASE_URL from .env.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * The portfolio's tables live in their own Postgres schema (default "portfolio"), so migrations
 * only ever create, check or change tables there, never another app's tables in `public`.
 * Keep in sync with src/lib/prisma.server.ts.
 */
const schema = process.env.DATABASE_SCHEMA || 'portfolio';

function withSchema(url: string | undefined) {
  if (!url) return url;
  const u = new URL(url);
  u.searchParams.set('schema', schema);
  return u.toString();
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // `npx prisma db seed`: creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD (see prisma/seed.ts).
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Same precedence as the runtime client (src/lib/prisma.server.ts).
    url: withSchema(process.env['PORTFOLIO_DATABASE_URL'] || process.env['DATABASE_URL']),
  },
});
