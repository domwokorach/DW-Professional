import { SignJWT } from 'jose';
import {
  signAccessToken,
  verifyAccessToken,
  generateOpaqueToken,
  hashToken,
} from '@/lib/auth/tokens';

describe('signAccessToken / verifyAccessToken', () => {
  const claims = {
    sub: 'user_1',
    email: 'admin@example.com',
    role: 'ADMIN' as const,
    sessionId: 'session_1',
  };

  it('round-trips valid claims', async () => {
    const token = await signAccessToken(claims);
    const verified = await verifyAccessToken(token);

    expect(verified).not.toBeNull();
    expect(verified?.sub).toBe(claims.sub);
    expect(verified?.email).toBe(claims.email);
    expect(verified?.role).toBe(claims.role);
    expect(verified?.sessionId).toBe(claims.sessionId);
  });

  it('returns null for a garbage string', async () => {
    await expect(verifyAccessToken('not-a-real-token')).resolves.toBeNull();
  });

  it('returns null for a token signed with a different secret', async () => {
    const wrongSecretKey = new TextEncoder().encode('a-totally-different-secret-value-0123456789');
    const badToken = await new SignJWT(claims)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('12m')
      .sign(wrongSecretKey);

    await expect(verifyAccessToken(badToken)).resolves.toBeNull();
  });

  it('returns null for an expired token', async () => {
    const correctSecretKey = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
    const expiredToken = await new SignJWT(claims)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(correctSecretKey);

    await expect(verifyAccessToken(expiredToken)).resolves.toBeNull();
  });

  it('returns null when sub or sessionId claims are missing', async () => {
    const correctSecretKey = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
    const incompleteToken = await new SignJWT({ email: 'x@example.com' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('12m')
      .sign(correctSecretKey);

    await expect(verifyAccessToken(incompleteToken)).resolves.toBeNull();
  });
});

describe('generateOpaqueToken', () => {
  it('produces distinct, high-entropy strings on each call', () => {
    const tokens = new Set(Array.from({ length: 20 }, () => generateOpaqueToken()));
    expect(tokens.size).toBe(20);
    for (const token of tokens) {
      expect(token.length).toBeGreaterThanOrEqual(32);
    }
  });
});

describe('hashToken', () => {
  it('is deterministic for the same input', () => {
    expect(hashToken('same-input')).toBe(hashToken('same-input'));
  });

  it('is one-way: the hash never equals the input', () => {
    const input = 'my-plaintext-token';
    expect(hashToken(input)).not.toBe(input);
  });

  it('produces different hashes for different inputs', () => {
    expect(hashToken('input-a')).not.toBe(hashToken('input-b'));
  });
});
