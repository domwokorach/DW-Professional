// Server-only: admin password hashing with Argon2id (OWASP-recommended parameters).
import { hash, verify } from '@node-rs/argon2';

// Argon2id is @node-rs/argon2's default algorithm; the cost parameters are pinned so they never drift silently.
const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 } as const;

export const PASSWORD_MIN = 12;
/** Upper bound so a huge password can't be used to burn CPU. */
export const PASSWORD_MAX = 256;

export function passwordProblem(password: string): string | undefined {
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (password.length > PASSWORD_MAX) return `Use at most ${PASSWORD_MAX} characters.`;
}

export const hashPassword = (password: string) => hash(password, OPTIONS);

let dummy: Promise<string> | null = null;

/**
 * Checks a password against a stored hash. With no hash (unknown email) it verifies against a throwaway hash
 * anyway, so the response time doesn't reveal whether the account exists.
 */
export async function verifyPassword(storedHash: string | null, password: string): Promise<boolean> {
  if (!storedHash) {
    dummy ??= hashPassword('not-a-real-password-used-for-timing-only');
    await verify(await dummy, password).catch(() => false);
    return false;
  }
  try {
    return await verify(storedHash, password);
  } catch {
    return false;
  }
}
