import { POST } from '@/app/api/auth/sign-out/route';
import { db } from '@/lib/database/db';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth/cookies';
import { buildSession } from '../../../test/factories';
import { makeRequest } from '../../../test/testRequest';
import { hashToken } from '@/lib/auth/tokens';

jest.mock('@/lib/database/db');

describe('POST /api/auth/sign-out', () => {
  afterEach(() => jest.clearAllMocks());

  it('rejects a cross-origin request with 403', async () => {
    const response = await POST(
      makeRequest('/api/auth/sign-out', {
        method: 'POST',
        headers: { origin: 'https://evil.example.com', host: 'localhost:3000' },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('cross_site_rejected');
  });

  it('revokes the session, logs SIGN_OUT, and clears cookies when the refresh cookie resolves to an active session', async () => {
    const refreshToken = 'plaintext-refresh-token';
    const session = buildSession({ refreshTokenHash: hashToken(refreshToken) });
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);
    (db.session.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    (db.securityEvent.create as jest.Mock).mockResolvedValue(undefined);

    const response = await POST(
      makeRequest('/api/auth/sign-out', {
        method: 'POST',
        cookies: { [REFRESH_COOKIE]: refreshToken },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });

    expect(db.session.updateMany).toHaveBeenCalledWith({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(db.securityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: session.userId, type: 'SIGN_OUT' }) })
    );

    expect(response.cookies.get(ACCESS_COOKIE)?.value).toBe('');
    expect(response.cookies.get(REFRESH_COOKIE)?.value).toBe('');
  });

  it('returns 200 ok and clears cookies even when there is no refresh-token cookie', async () => {
    const response = await POST(makeRequest('/api/auth/sign-out', { method: 'POST' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(db.session.updateMany).not.toHaveBeenCalled();
    expect(response.cookies.get(ACCESS_COOKIE)?.value).toBe('');
    expect(response.cookies.get(REFRESH_COOKIE)?.value).toBe('');
  });

  it('returns 200 ok and clears cookies when the refresh token does not resolve to an active session', async () => {
    (db.session.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await POST(
      makeRequest('/api/auth/sign-out', {
        method: 'POST',
        cookies: { [REFRESH_COOKIE]: 'unknown-refresh-token' },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(db.session.updateMany).not.toHaveBeenCalled();
    expect(response.cookies.get(ACCESS_COOKIE)?.value).toBe('');
    expect(response.cookies.get(REFRESH_COOKIE)?.value).toBe('');
  });
});
