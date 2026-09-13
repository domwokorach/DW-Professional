import { createHmac } from 'node:crypto';
import { createLiveChatToken, verifyLiveChatToken } from '@/lib/liveChatAuth';

const SECRET = process.env.SOCKET_SECRET as string;

describe('security: liveChatAuth token forgery/tampering rejection', () => {
  it('rejects a token with a bit-flipped signature', () => {
    const token = createLiveChatToken({ role: 'admin', adminId: 'admin-1' }, SECRET);
    const [payloadB64, signature] = token.split('.');
    const flippedChar = signature[0] === 'a' ? 'b' : 'a';
    const tamperedSignature = flippedChar + signature.slice(1);
    const tampered = `${payloadB64}.${tamperedSignature}`;

    expect(verifyLiveChatToken(tampered, SECRET)).toBeNull();
  });

  it('rejects a token signed with the wrong secret', () => {
    const token = createLiveChatToken({ role: 'visitor', visitorId: 'v1', conversationId: 'c1' }, 'wrong-secret');

    expect(verifyLiveChatToken(token, SECRET)).toBeNull();
  });

  it('rejects a token whose payload was tampered with to change the claims (e.g. escalate visitor -> admin)', () => {
    const token = createLiveChatToken({ role: 'visitor', visitorId: 'v1', conversationId: 'c1' }, SECRET);
    const [, signature] = token.split('.');

    const forgedPayload = `${JSON.stringify({ role: 'admin', adminId: 'v1' })}.${Date.now() + 5 * 60 * 1000}`;
    const forgedToken = `${Buffer.from(forgedPayload).toString('base64url')}.${signature}`;

    expect(verifyLiveChatToken(forgedToken, SECRET)).toBeNull();
  });

  it('rejects a structurally malformed token', () => {
    expect(verifyLiveChatToken('not-a-token', SECRET)).toBeNull();
    expect(verifyLiveChatToken('a.b.c', SECRET)).toBeNull();
  });

  it('accepts a genuinely valid token (sanity check)', () => {
    const token = createLiveChatToken({ role: 'admin', adminId: 'admin-1' }, SECRET);

    const claims = verifyLiveChatToken(token, SECRET);

    expect(claims).toEqual({ role: 'admin', adminId: 'admin-1' });
  });
});

describe('security: an expired liveChatAuth token is rejected', () => {
  it('rejects a token whose baked-in expiry has already passed', () => {
    const claims = { role: 'visitor' as const, visitorId: 'v1', conversationId: 'c1' };
    const pastExpiresAt = Date.now() - 1000;
    const payload = `${JSON.stringify(claims)}.${pastExpiresAt}`;
    const signature = createHmac('sha256', SECRET).update(payload).digest('hex');
    const expiredToken = `${Buffer.from(payload).toString('base64url')}.${signature}`;

    expect(verifyLiveChatToken(expiredToken, SECRET)).toBeNull();
  });

  it('accepts a token whose expiry has not yet passed (sanity check)', () => {
    const claims = { role: 'visitor' as const, visitorId: 'v1', conversationId: 'c1' };
    const futureExpiresAt = Date.now() + 60 * 1000;
    const payload = `${JSON.stringify(claims)}.${futureExpiresAt}`;
    const signature = createHmac('sha256', SECRET).update(payload).digest('hex');
    const validToken = `${Buffer.from(payload).toString('base64url')}.${signature}`;

    expect(verifyLiveChatToken(validToken, SECRET)).toEqual(claims);
  });
});
