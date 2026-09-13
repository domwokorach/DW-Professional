import { POST } from '@/app/api/auth/refresh/route';
import { db } from '@/lib/database/db';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth/cookies';
import { buildSession, buildUser } from '../../../test/factories';
import { makeRequest } from '../../../test/testRequest';
import { hashToken } from '@/lib/auth/tokens';

jest.mock('@/lib/database/db');

describe('POST /api/auth/refresh', () => {
  afterEach(() => jest.clearAllMocks());

  it('rejects a cross-origin request with 403', async () => {
    const response = await POST(
      makeRequest('/api/auth/refresh', {
        method: 'POST',
        headers: { origin: 'https://evil.example.com', host: 'localhost:3000' },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('cross_site_rejected');
  });

  it('returns 401 no_session when there is no refresh-token cookie', async () => {
    const response = await POST(makeRequest('/api/auth/refresh', { method: 'POST' }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('no_session');
  });

  it('returns 401 session_expired and clears cookies when the refresh token does not resolve to an active session', async () => {
    (db.session.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await POST(
      makeRequest('/api/auth/refresh', {
        method: 'POST',
        cookies: { [REFRESH_COOKIE]: 'unknown-token' },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('session_expired');
    expect(response.cookies.get(ACCESS_COOKIE)?.value).toBe('');
    expect(response.cookies.get(REFRESH_COOKIE)?.value).toBe('');
  });

  it('returns 403 account_inactive and clears cookies when the underlying user is no longer ACTIVE', async () => {
    const refreshToken = 'plaintext-refresh-token-inactive';
    const session = buildSession({ refreshTokenHash: hashToken(refreshToken) });
    const user = buildUser({ id: session.userId, status: 'SUSPENDED' });
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);
    (db.user.findUnique as jest.Mock).mockResolvedValue(user);

    const response = await POST(
      makeRequest('/api/auth/refresh', {
        method: 'POST',
        cookies: { [REFRESH_COOKIE]: refreshToken },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('account_inactive');
    expect(response.cookies.get(ACCESS_COOKIE)?.value).toBe('');
    expect(response.cookies.get(REFRESH_COOKIE)?.value).toBe('');
  });

  it('rotates the session on the happy path: 200 ok, new cookies set, refresh token changes', async () => {
    const refreshToken = 'plaintext-refresh-token-happy';
    const session = buildSession({ refreshTokenHash: hashToken(refreshToken) });
    const user = buildUser({ id: session.userId, status: 'ACTIVE' });
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);
    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.session.update as jest.Mock).mockResolvedValue(session);

    const response = await POST(
      makeRequest('/api/auth/refresh', {
        method: 'POST',
        cookies: { [REFRESH_COOKIE]: refreshToken },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });

    const newAccessToken = response.cookies.get(ACCESS_COOKIE)?.value;
    const newRefreshToken = response.cookies.get(REFRESH_COOKIE)?.value;
    expect(newAccessToken).toBeTruthy();
    expect(newRefreshToken).toBeTruthy();
    expect(newRefreshToken).not.toBe(refreshToken);

    expect(db.session.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: session.id },
        data: expect.objectContaining({ refreshTokenHash: hashToken(newRefreshToken as string) }),
      })
    );
  });
});
