// Creates the FIRST admin account (for /admin/login) from environment variables. Run by hand:
//   npx prisma db seed            (or: npm run db:seed)
//
// There is no default admin and no built-in password: the account only exists after you choose an email and a
// password in .env and run this. The password is hashed with Argon2id before it is stored (the same hashing the
// login uses); the plaintext is never saved, logged, or sent anywhere.
//
//   ADMIN_EMAIL=...            required
//   ADMIN_PASSWORD=...         required, at least 12 characters
//   ADMIN_RESET_PASSWORD=true  optional: if the admin already exists, replace its password (and sign it out
//                              everywhere). Without it, an existing admin is left untouched, so re-running the
//                              seed is always safe and never creates a duplicate.
//
// Once the account exists, remove ADMIN_PASSWORD from .env (and from any deployment environment). After that,
// manage passwords with `npm run admin -- reset-password <email>`, which asks for the new one at a hidden prompt.
import 'dotenv/config';
import { hashPassword, passwordProblem } from '@/lib/admin/password.server';
import { getPrisma } from '@/lib/prisma.server';

/** Values copied from .env.example (or obvious defaults) are refused, so a placeholder can never become a login. */
const PLACEHOLDERS = new Set([
  'your-admin-email@example.com',
  'change-this-password',
  'admin@example.com',
  'admin123',
  'password',
]);

function fail(message: string): never {
  console.error(`✖ ${message}`);
  process.exit(1);
}

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    fail('Missing ADMIN_EMAIL or ADMIN_PASSWORD.\n  Add them to your .env file and run the seed command again.');
  }

  // These two are server-only secrets: a NEXT_PUBLIC_ copy would be shipped to every visitor's browser.
  const leaked = Object.keys(process.env).filter((k) => /^NEXT_PUBLIC_ADMIN_/.test(k));
  if (leaked.length) fail(`Remove ${leaked.join(', ')} from your environment: NEXT_PUBLIC_ variables are sent to the browser.`);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) fail('ADMIN_EMAIL is not a valid email address.');
  if (PLACEHOLDERS.has(email) || PLACEHOLDERS.has(password.toLowerCase())) {
    fail('ADMIN_EMAIL or ADMIN_PASSWORD still has the example value from .env.example.\n  Choose your own email and a strong password.');
  }
  const problem = passwordProblem(password);
  if (problem) fail(`ADMIN_PASSWORD is too weak: ${problem}`);

  const prisma = getPrisma();
  if (!prisma) fail('No database configured: set PORTFOLIO_DATABASE_URL or DATABASE_URL in .env.');

  try {
    const existing = await prisma.adminUser.findUnique({ where: { email }, select: { id: true, isActive: true } });

    if (!existing) {
      const passwordHash = await hashPassword(password);
      await prisma.adminUser.create({ data: { email, passwordHash, role: 'ADMIN', isActive: true } });
      console.log(`✔ Admin ${email} created.`);
      console.log('  Sign in at /admin/login with that email and the password you set in ADMIN_PASSWORD.');
      console.log('  Now remove ADMIN_PASSWORD from .env (and from any deployment environment).');
      return;
    }

    if (process.env.ADMIN_RESET_PASSWORD !== 'true') {
      console.log(`• Admin ${email} already exists, so nothing was changed.`);
      console.log('  To replace its password, run the seed again with ADMIN_RESET_PASSWORD=true,');
      console.log('  or use: npm run admin -- reset-password <email>');
      return;
    }

    const passwordHash = await hashPassword(password);
    await prisma.adminUser.update({ where: { id: existing.id }, data: { passwordHash } });
    await prisma.adminAuditLog.create({ data: { adminUserId: existing.id, event: 'PASSWORD_CHANGED', userAgent: 'seed' } });
    const { count } = await prisma.adminSession.updateMany({ where: { adminUserId: existing.id, revokedAt: null }, data: { revokedAt: new Date() } });
    console.log(`✔ Password replaced for ${email}; ${count} session(s) signed out.`);
    if (!existing.isActive) console.log('  Note: this account is deactivated. Re-enable it with: npm run admin -- activate <email>');
    console.log('  Now remove ADMIN_PASSWORD and ADMIN_RESET_PASSWORD from .env.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  // Never print the error object itself: keep credentials and connection strings out of the terminal.
  console.error(`✖ Seeding failed: ${(err as { code?: string }).code ?? (err as Error).name}`);
  process.exit(1);
});
