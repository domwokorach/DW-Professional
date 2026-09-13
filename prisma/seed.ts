/**
 * Idempotent seed: provisions the initial super_admin account from
 * server-only env vars. Safe to run repeatedly — never duplicates the
 * account, never logs the password or its hash.
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/passwords";

const db = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_INITIAL_EMAIL;
  const password = process.env.ADMIN_INITIAL_PASSWORD;

  if (!email || !password) {
    console.error(
      "Skipping admin seed: ADMIN_INITIAL_EMAIL and ADMIN_INITIAL_PASSWORD must both be set."
    );
    return;
  }

  const normalisedEmail = email.trim().toLowerCase();

  const existing = await db.user.findUnique({ where: { email: normalisedEmail } });
  if (existing) {
    console.log("✓ Admin account exists");
    console.log(`✓ Email: ${existing.email}`);
    console.log(`✓ Role: ${existing.role}`);
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: {
      name: "Dominic Wokorach",
      email: normalisedEmail,
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });

  console.log("✓ Admin account created");
  console.log(`✓ Email: ${user.email}`);
  console.log(`✓ Role: ${user.role}`);
}

main()
  .catch((error) => {
    console.error("Admin seed failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
