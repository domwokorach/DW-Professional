import { getAdminSession, requireAdminApi } from '@/lib/auth/guard';
import { db } from '@/lib/database/db';
import { buildSession, buildUser } from '../../test/factories';
import { authCookiesFor, clearMockAuthCookies } from '../../test/testRequest';

jest.mock('@/lib/database/db');

describe('security: a valid-signature JWT for a revoked session is rejected', () => {
  afterEach(() => clearMockAuthCookies());

  it('getAdminSession() returns null when the session has been revoked', async () => {
    const user = buildUser();
    const session = buildSession({ userId: user.id, revokedAt: new Date() });
    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);

    await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

    const result = await getAdminSession();

    expect(result).toBeNull();
  });

  it('requireAdminApi() returns a 401 response when the session has been revoked', async () => {
    const user = buildUser();
    const session = buildSession({ userId: user.id, revokedAt: new Date() });
    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);

    await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

    const result = await requireAdminApi();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });

  it('requireAdminApi() also rejects an expired (but not explicitly revoked) session', async () => {
    const user = buildUser();
    const session = buildSession({ userId: user.id, revokedAt: null, expiresAt: new Date(Date.now() - 1000) });
    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);

    await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

    const result = await requireAdminApi();

    expect(result.ok).toBe(false);
  });

  it('requireAdminApi() succeeds for a live, non-revoked session (sanity check)', async () => {
    const user = buildUser();
    const session = buildSession({ userId: user.id, revokedAt: null });
    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);

    await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

    const result = await requireAdminApi();

    expect(result.ok).toBe(true);
  });
});

describe('security: missing JWT entirely is rejected', () => {
  afterEach(() => clearMockAuthCookies());

  it('getAdminSession() returns null with no admin_at cookie at all', async () => {
    const result = await getAdminSession();

    expect(result).toBeNull();
  });

  it('requireAdminApi() returns 401 with no admin_at cookie at all', async () => {
    const result = await requireAdminApi();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });
});
