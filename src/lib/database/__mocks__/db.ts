import { mockDeep, mockReset, type DeepMockProxy } from 'jest-mock-extended';
import type { PrismaClient } from '@prisma/client';

export type MockPrismaClient = DeepMockProxy<PrismaClient>;

export const db = mockDeep<PrismaClient>() as unknown as MockPrismaClient;

// Prisma's fluent transaction API isn't part of the generated client type in
// a way jest-mock-extended can infer, so the array-form used throughout
// src/lib/{auth,chat} is wired by hand: resolve every promise in the array,
// mirroring what a real transaction returns.
(db.$transaction as unknown as jest.Mock).mockImplementation(
  (arg: unknown) => (Array.isArray(arg) ? Promise.all(arg) : (arg as (tx: unknown) => unknown)(db))
);

beforeEach(() => {
  mockReset(db);
  (db.$transaction as unknown as jest.Mock).mockImplementation(
    (arg: unknown) => (Array.isArray(arg) ? Promise.all(arg) : (arg as (tx: unknown) => unknown)(db))
  );
});
