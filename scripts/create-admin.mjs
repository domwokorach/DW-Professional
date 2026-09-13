/**
 * Provisions or updates an admin account. There is no public sign-up route —
 * admin accounts are created out-of-band, either by an existing SUPER_ADMIN
 * (not yet exposed as a UI flow) or by running this script directly against
 * the database.
 *
 * Usage:
 *   node --env-file=.env.local scripts/create-admin.mjs "Dominic Wokorach" dominic-wokorach@outlook.com "a-strong-password" SUPER_ADMIN
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const [, , name, email, password, role = "SUPER_ADMIN"] = process.argv;

if (!name || !email || !password) {
  console.error('Usage: node --env-file=.env.local scripts/create-admin.mjs "<name>" "<email>" "<password>" [role]');
  process.exit(1);
}

if (password.length < 10) {
  console.error("Password must be at least 10 characters.");
  process.exit(1);
}

const db = new PrismaClient();

const passwordHash = await bcrypt.hash(password, 12);
const normalisedEmail = email.trim().toLowerCase();

const user = await db.user.upsert({
  where: { email: normalisedEmail },
  update: { name, passwordHash, role, status: "ACTIVE" },
  create: { name, email: normalisedEmail, passwordHash, role, status: "ACTIVE" },
});

console.log(`Admin account ready: ${user.email} (${user.role}, id ${user.id})`);
await db.$disconnect();
