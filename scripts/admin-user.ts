// Manages admin accounts for the comment moderation dashboard (/admin/comments). There is deliberately no
// sign-up page: accounts are created here, against the same database the site uses.
//   npm run admin -- create <email>            # prompts for a password (hidden), twice
//   npm run admin -- reset-password <email>    # new password; signs the admin out everywhere
//   npm run admin -- deactivate <email>        # blocks sign-in and ends all sessions
//   npm run admin -- activate <email>
//   npm run admin -- revoke-sessions <email>   # signs the admin out everywhere
//   npm run admin -- list
// Passwords are typed at a hidden prompt, never passed as arguments (which would land in shell history).
import 'dotenv/config';
import { createInterface } from 'node:readline';
import { hashPassword, passwordProblem } from '@/lib/admin/password.server';
import { getPrisma } from '@/lib/prisma.server';

const [command = 'list', rawEmail] = process.argv.slice(2);
const prisma = getPrisma();
if (!prisma) {
  console.error('✖ No database configured: set PORTFOLIO_DATABASE_URL or DATABASE_URL.');
  process.exit(1);
}
const db = prisma;

// One interface and one buffered line iterator for every prompt, so nothing typed (or piped) ahead is lost.
let rl: ReturnType<typeof createInterface> | null = null;
let lines: AsyncIterator<string> | null = null;

async function askHidden(question: string): Promise<string> {
  if (!rl) {
    rl = createInterface({ input: process.stdin, output: process.stdout, terminal: Boolean(process.stdin.isTTY) });
    // Echo nothing readline would write (i.e. the typed characters); prompts are written directly below.
    (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = () => {};
    lines = rl[Symbol.asyncIterator]();
  }
  process.stdout.write(question);
  const { value, done } = await lines!.next();
  process.stdout.write('\n');
  if (done) throw new Error('No input.');
  return value;
}

async function newPassword(): Promise<string> {
  for (;;) {
    const first = await askHidden('New password: ');
    const problem = passwordProblem(first);
    if (problem) { console.log(`  ${problem}`); continue; }
    const second = await askHidden('Repeat password: ');
    if (first !== second) { console.log('  The passwords did not match.'); continue; }
    return first;
  }
}

function requireEmail() {
  const email = rawEmail?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error(`${command} needs an email address.`);
  return email;
}

async function findAdmin(email: string) {
  const admin = await db.adminUser.findUnique({ where: { email }, select: { id: true } });
  if (!admin) throw new Error(`No admin with the email ${email}.`);
  return admin;
}

async function revoke(adminUserId: string) {
  const { count } = await db.adminSession.updateMany({ where: { adminUserId, revokedAt: null }, data: { revokedAt: new Date() } });
  if (count) await db.adminAuditLog.create({ data: { adminUserId, event: 'SESSION_REVOKED', userAgent: 'admin-cli' } });
  return count;
}

async function main() {
  switch (command) {
    case 'list': {
      const admins = await db.adminUser.findMany({ orderBy: { createdAt: 'asc' }, select: { email: true, isActive: true, lastLoginAt: true, createdAt: true } });
      if (!admins.length) return console.log('No admins yet. Create one with: npm run admin -- create <email>');
      admins.forEach((a) => console.log(`${a.email}  ${a.isActive ? 'active' : 'DEACTIVATED'}  created ${a.createdAt.toISOString()}  last sign-in ${a.lastLoginAt?.toISOString() ?? 'never'}`));
      return;
    }
    case 'create': {
      const email = requireEmail();
      if (await db.adminUser.findUnique({ where: { email }, select: { id: true } })) throw new Error(`${email} already exists. Use reset-password.`);
      const passwordHash = await hashPassword(await newPassword());
      await db.adminUser.create({ data: { email, passwordHash, role: 'ADMIN' } });
      return console.log(`✔ Admin ${email} created. Sign in at /admin/login.`);
    }
    case 'reset-password': {
      const email = requireEmail();
      const admin = await findAdmin(email);
      const passwordHash = await hashPassword(await newPassword());
      await db.adminUser.update({ where: { id: admin.id }, data: { passwordHash } });
      await db.adminAuditLog.create({ data: { adminUserId: admin.id, event: 'PASSWORD_CHANGED', userAgent: 'admin-cli' } });
      const count = await revoke(admin.id);
      return console.log(`✔ Password changed for ${email}; ${count} session(s) signed out.`);
    }
    case 'deactivate':
    case 'activate': {
      const email = requireEmail();
      const admin = await findAdmin(email);
      await db.adminUser.update({ where: { id: admin.id }, data: { isActive: command === 'activate' } });
      const count = command === 'deactivate' ? await revoke(admin.id) : 0;
      return console.log(`✔ ${email} ${command}d${command === 'deactivate' ? `; ${count} session(s) signed out` : ''}.`);
    }
    case 'revoke-sessions': {
      const email = requireEmail();
      const count = await revoke((await findAdmin(email)).id);
      return console.log(`✔ ${count} session(s) signed out for ${email}.`);
    }
    default:
      throw new Error(`Unknown command "${command}". Use create, reset-password, deactivate, activate, revoke-sessions or list.`);
  }
}

main()
  .catch((err) => { console.error(`✖ ${(err as Error).message}`); process.exitCode = 1; })
  .finally(() => { rl?.close(); return db.$disconnect(); });
