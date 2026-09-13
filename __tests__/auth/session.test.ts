import {
  contextFromRequest,
  createSession,
  rotateSession,
  findActiveSessionByRefreshToken,
  revokeSession,
  revokeAllSessionsForUser,
} from '@/lib/auth/session';
import { db } from '@/lib/database/db';
import { hashToken, verifyAccessToken } from '@/lib/auth/tokens';
import { REFRESH_TOKEN_TTL_SECONDS_DEFAULT, REFRESH_TOKEN_TTL_SECONDS_REMEMBER } from '@/lib/auth/env';
import { buildUser, buildSession } from '../../test/factories';

jest.mock('@/lib/database/db');

describe('contextFromRequest', () => {
  it('extracts userAgent, ipAddress, and deviceId from request headers/cookies', () => {
    const request = new Request('http://localhost:3000/api/whatever', {
      headers: {
        'user-agent': 'test-agent/1.0',
        'x-forwarded-for': '203.0.113.5',
        cookie: 'admin_device=abc123; other=1',
      },
    });

    const ctx = contextFromRequest(request);
    expect(ctx.userAgent).toBe('test-agent/1.0');
    expect(ctx.ipAddress).toBe('203.0.113.5');
    expect(ctx.deviceId).toBe('abc123');
  });

  it('returns null deviceId when there is no admin_device cookie', () => {
    const request = new Request('http://localhost:3000/api/whatever', {
      headers: { 'user-agent': 'test-agent/1.0' },
    });

    const ctx = contextFromRequest(request);
    expect(ctx.deviceId).toBeNull();
    expect(ctx.ipAddress).toBeNull();
  });
});

describe('createSession', () => {
  it('stores a hashed refresh token with the default TTL when rememberMe is false', async () => {
    const user = buildUser();
    (db.session.create as jest.Mock).mockImplementation(({ data }) => buildSession({ ...data }));

    const ctx = { userAgent: 'test-agent', ipAddress: '127.0.0.1', deviceId: null };
    const result = await createSession(user, ctx, false);

    expect(db.session.create).toHaveBeenCalledTimes(1);
    const call = (db.session.create as jest.Mock).mock.calls[0][0];
    expect(call.data.refreshTokenHash).toBe(hashToken(result.refreshToken));
    expect(call.data.refreshTokenHash).not.toBe(result.refreshToken);
    expect(result.refreshTtlSeconds).toBe(REFRESH_TOKEN_TTL_SECONDS_DEFAULT);

    const claims = await verifyAccessToken(result.accessToken);
    expect(claims?.sub).toBe(user.id);
    expect(claims?.sessionId).toBe(result.session.id);
  });

  it('uses the remember-me TTL when rememberMe is true', async () => {
    const user = buildUser();
    (db.session.create as jest.Mock).mockImplementation(({ data }) => buildSession({ ...data }));

    const ctx = { userAgent: 'test-agent', ipAddress: '127.0.0.1', deviceId: 'existing-device' };
    const result = await createSession(user, ctx, true);

    expect(result.refreshTtlSeconds).toBe(REFRESH_TOKEN_TTL_SECONDS_REMEMBER);
    const call = (db.session.create as jest.Mock).mock.calls[0][0];
    expect(call.data.deviceId).toBe('existing-device');
  });
});

describe('rotateSession', () => {
  it('returns null when the user is missing', async () => {
    const session = buildSession();
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);

    const ctx = { userAgent: 'test-agent', ipAddress: '127.0.0.1' };
    await expect(rotateSession(session, ctx)).resolves.toBeNull();
  });

  it('returns null when the user is inactive', async () => {
    const user = buildUser({ status: 'SUSPENDED' });
    const session = buildSession({ userId: user.id });
    (db.user.findUnique as jest.Mock).mockResolvedValue(user);

    const ctx = { userAgent: 'test-agent', ipAddress: '127.0.0.1' };
    await expect(rotateSession(session, ctx)).resolves.toBeNull();
  });

  it('rotates the refresh token hash on success', async () => {
    const user = buildUser();
    const oldHash = hashToken('old-plaintext-refresh-token');
    const session = buildSession({ userId: user.id, refreshTokenHash: oldHash });

    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.session.update as jest.Mock).mockResolvedValue(session);

    const ctx = { userAgent: 'new-agent', ipAddress: '10.0.0.1' };
    const result = await rotateSession(session, ctx);

    expect(result).not.toBeNull();
    expect(db.session.update).toHaveBeenCalledTimes(1);
    const call = (db.session.update as jest.Mock).mock.calls[0][0];
    expect(call.where).toEqual({ id: session.id });
    expect(call.data.refreshTokenHash).toBe(hashToken(result!.refreshToken));
    expect(call.data.refreshTokenHash).not.toBe(oldHash);

    const claims = await verifyAccessToken(result!.accessToken);
    expect(claims?.sub).toBe(user.id);
    expect(claims?.sessionId).toBe(session.id);
  });
});

describe('findActiveSessionByRefreshToken', () => {
  it('returns null when no session matches the hashed token', async () => {
    (db.session.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(findActiveSessionByRefreshToken('unknown-token')).resolves.toBeNull();
  });

  it('returns null when the matching session is revoked', async () => {
    const plaintext = 'known-refresh-token';
    const session = buildSession({ refreshTokenHash: hashToken(plaintext), revokedAt: new Date() });
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);

    await expect(findActiveSessionByRefreshToken(plaintext)).resolves.toBeNull();
  });

  it('returns null when the matching session is expired', async () => {
    const plaintext = 'known-refresh-token';
    const session = buildSession({
      refreshTokenHash: hashToken(plaintext),
      expiresAt: new Date(Date.now() - 1000),
    });
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);

    await expect(findActiveSessionByRefreshToken(plaintext)).resolves.toBeNull();
  });

  it('returns the session for a valid, active refresh token', async () => {
    const plaintext = 'known-refresh-token';
    const session = buildSession({ refreshTokenHash: hashToken(plaintext) });
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);

    const result = await findActiveSessionByRefreshToken(plaintext);
    expect(result).toEqual(session);
    expect(db.session.findUnique).toHaveBeenCalledWith({
      where: { refreshTokenHash: hashToken(plaintext) },
    });
  });
});

describe('revokeSession', () => {
  it('updates only the non-revoked session matching the id', async () => {
    (db.session.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    await revokeSession('session_1');

    expect(db.session.updateMany).toHaveBeenCalledWith({
      where: { id: 'session_1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });
});

describe('revokeAllSessionsForUser', () => {
  it('revokes all active sessions for a user with no exclusion', async () => {
    (db.session.updateMany as jest.Mock).mockResolvedValue({ count: 3 });
    await revokeAllSessionsForUser('user_1');

    expect(db.session.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user_1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('excludes the given session id when exceptSessionId is provided', async () => {
    (db.session.updateMany as jest.Mock).mockResolvedValue({ count: 2 });
    await revokeAllSessionsForUser('user_1', 'session_keep');

    expect(db.session.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user_1', revokedAt: null, id: { not: 'session_keep' } },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
