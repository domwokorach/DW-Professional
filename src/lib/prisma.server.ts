// Server-only: imported by API routes, never by client components, so Prisma and DATABASE_URL stay
// out of the browser bundle.
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

// One client per server process. In development, hot reloads re-evaluate this module, so the
// client is kept on globalThis to avoid opening a new connection pool on every change.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Ensures the connection string uses libpq-compatible SSL modes to suppress deprecation warnings. */
function normalizeConnectionString(url: string): string {
  try {
    const u = new URL(url);
    // Add libpq compatibility flag if using deprecated SSL modes (prefer, require, verify-ca).
    // This prepares for pg v9.0.0 and pg-connection-string v3.0.0.
    const sslmode = u.searchParams.get('sslmode');
    if (sslmode && ['prefer', 'require', 'verify-ca'].includes(sslmode) && !u.searchParams.has('uselibpqcompat')) {
      u.searchParams.set('uselibpqcompat', 'true');
    }
    return u.toString();
  } catch {
    return url; // Return unchanged if not a valid URL
  }
}

/**
 * The shared Prisma client, or null when no database is configured (storage is then skipped).
 * PORTFOLIO_DATABASE_URL wins over DATABASE_URL, so the portfolio can use its own database where
 * DATABASE_URL already belongs to something else (e.g. a Vercel project carried over from another app).
 */
export function getPrisma(): PrismaClient | null {
  const rawConnectionString = process.env.PORTFOLIO_DATABASE_URL || process.env.DATABASE_URL;
  if (!rawConnectionString) return null;
  if (!globalForPrisma.prisma) {
    // Queries target the portfolio's own Postgres schema (see prisma.config.ts).
    const schema = process.env.DATABASE_SCHEMA || 'portfolio';
    const connectionString = normalizeConnectionString(rawConnectionString);
    globalForPrisma.prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }, { schema }) });
  }
  return globalForPrisma.prisma;
}
