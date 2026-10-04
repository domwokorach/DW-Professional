// Server-only: imported by API routes, never by client components, so Prisma and DATABASE_URL stay
// out of the browser bundle.
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

// One client per server process. In development, hot reloads re-evaluate this module, so the
// client is kept on globalThis to avoid opening a new connection pool on every change.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * The shared Prisma client, or null when no database is configured (storage is then skipped).
 * PORTFOLIO_DATABASE_URL wins over DATABASE_URL, so the portfolio can use its own database where
 * DATABASE_URL already belongs to something else (e.g. a Vercel project carried over from another app).
 */
export function getPrisma(): PrismaClient | null {
  const connectionString = process.env.PORTFOLIO_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) return null;
  if (!globalForPrisma.prisma) {
    // Queries target the portfolio's own Postgres schema (see prisma.config.ts).
    const schema = process.env.DATABASE_SCHEMA || 'portfolio';
    globalForPrisma.prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }, { schema }) });
  }
  return globalForPrisma.prisma;
}
