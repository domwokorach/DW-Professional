import { PrismaClient } from '@prisma/client';

/**
 * Opt-in real-database integration testing. Every other suite in this repo
 * mocks `@/lib/database/db` (see `src/lib/database/__mocks__/db.ts`) rather
 * than hitting Postgres — `.env.local`'s `DATABASE_URL` points at a shared
 * cloud instance, and running migrations/writes/cleanup against it from a
 * test run would risk real data. This helper exists so that IF a dedicated,
 * disposable Postgres database is ever provisioned for tests, a small number
 * of true end-to-end integration suites can be added against it later —
 * without ever touching `DATABASE_URL`.
 *
 * To enable: set `DATABASE_URL_TEST` to a database used for nothing else,
 * run `npx prisma migrate deploy --schema prisma/schema.prisma` against it
 * once, then write a suite that imports `getTestDb()`/`cleanupDatabase()`
 * from here. Until `DATABASE_URL_TEST` is set, `getTestDb()` throws with an
 * explicit message rather than silently falling back to `DATABASE_URL` —
 * a suite built on this should guard itself with `describeIfTestDb`.
 */
let client: PrismaClient | null = null;

export function hasTestDb(): boolean {
  return Boolean(process.env.DATABASE_URL_TEST);
}

export function getTestDb(): PrismaClient {
  if (!process.env.DATABASE_URL_TEST) {
    throw new Error(
      'DATABASE_URL_TEST is not set. Real-database integration tests are opt-in — ' +
        'see the comment at the top of test/db.ts for how to provision one.'
    );
  }
  if (!client) {
    client = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL_TEST } } });
  }
  return client;
}

/** Deletes every row, in FK-safe order, leaving the schema itself intact. */
export async function cleanupDatabase(db: PrismaClient): Promise<void> {
  await db.securityEvent.deleteMany();
  await db.emailChangeRequest.deleteMany();
  await db.passwordResetToken.deleteMany();
  await db.session.deleteMany();
  await db.message.deleteMany();
  await db.conversation.deleteMany();
  await db.user.deleteMany();
}

/** Use as `describeIfTestDb('...', () => {...})` in place of `describe` for a suite that needs a real database. */
export const describeIfTestDb = hasTestDb() ? describe : describe.skip;

export async function disconnectTestDb(): Promise<void> {
  if (client) {
    await client.$disconnect();
    client = null;
  }
}
