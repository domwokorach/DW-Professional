import { SignJWT } from 'jose';
import { signAccessToken, verifyAccessToken } from '@/lib/auth/tokens';

describe('verifyAccessToken — forged/tampered JWT rejection', () => {
  const claims = { sub: 'user-1', email: 'user@example.com', role: 'ADMIN' as const, sessionId: 'session-1' };

  it('rejects a token with a single flipped character', async () => {
    const token = await signAccessToken(claims);
    // Flip one character in the signature segment (after the last dot).
    const parts = token.split('.');
    const lastSegment = parts[2];
    const flippedChar = lastSegment[0] === 'a' ? 'b' : 'a';
    parts[2] = flippedChar + lastSegment.slice(1);
    const tampered = parts.join('.');

    const result = await verifyAccessToken(tampered);

    expect(result).toBeNull();
  });

  it('rejects a token signed with the wrong secret', async () => {
    const wrongSecretKey = new TextEncoder().encode('a-completely-different-secret-0123456789');
    const forged = await new SignJWT(claims)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(wrongSecretKey);

    const result = await verifyAccessToken(forged);

    expect(result).toBeNull();
  });

  it('rejects a structurally malformed token', async () => {
    const result = await verifyAccessToken('not.a.valid.jwt.at.all');

    expect(result).toBeNull();
  });

  it('accepts a genuinely valid token (sanity check for the above negatives)', async () => {
    const token = await signAccessToken(claims);

    const result = await verifyAccessToken(token);

    expect(result?.sub).toBe('user-1');
    expect(result?.sessionId).toBe('session-1');
  });
});
