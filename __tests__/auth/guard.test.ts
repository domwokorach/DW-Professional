import { getAdminSession, requireAdminApi, requireRole, hasTrustedOrigin } from '@/lib/auth/guard';
import { db } from '@/lib/database/db';
import { buildUser, buildSession } from '../../test/factories';
import { authCookiesFor, clearMockAuthCookies, makeRequest } from '../../test/testRequest';

jest.mock('@/lib/database/db');

describe('getAdminSession', () => {
  afterEach(() => clearMockAuthCookies());

  it('returns null when there is no admin_at cookie', async () => {
    await expect(getAdminSession()).resolves.toBeNull();
  });

  it('returns null for an invalid/garbage token', async () => {
    const nextHeadersMock = jest.requireMock('next/headers') as {
      __setMockCookies: (cookies: Record<string, string>) => void;
    };
    nextHeadersMock.__setMockCookies({ admin_at: 'garbage-token' });

    await expect(getAdminSession()).resolves.toBeNull();
  });

  it('returns null when the user is not found', async () => {
    const user = buildUser();
    const session = buildSession({ userId: user.id });
    await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

    (db.user.findUnique as jest.Mock).mockResolvedValue(null);
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);

    await expect(getAdminSession()).resolves.toBeNull();
  });

  it('returns null when the user status is not ACTIVE', async () => {
    const user = buildUser({ status: 'SUSPENDED' });
    const session = buildSession({ userId: user.id });
    await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);

    await expect(getAdminSession()).resolves.toBeNull();
  });

  it('returns null when the session is missing', async () => {
    const user = buildUser();
    const session = buildSession({ userId: user.id });
    await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.session.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(getAdminSession()).resolves.toBeNull();
  });

  it('returns null when the session is revoked', async () => {
    const user = buildUser();
    const session = buildSession({ userId: user.id, revokedAt: new Date() });
    await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);

    await expect(getAdminSession()).resolves.toBeNull();
  });

  it('returns null when the session is expired', async () => {
    const user = buildUser();
    const session = buildSession({ userId: user.id, expiresAt: new Date(Date.now() - 1000) });
    await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);

    await expect(getAdminSession()).resolves.toBeNull();
  });

  it('returns the AdminSession shape on the happy path', async () => {
    const user = buildUser();
    const session = buildSession({ userId: user.id });
    await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);

    const result = await getAdminSession();
    expect(result).toEqual({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
      sessionId: session.id,
    });
  });
});

describe('hasTrustedOrigin', () => {
  it('is trusted when Origin host matches Host header', () => {
    const request = makeRequest('http://localhost:3000/api/whatever', {
      method: 'POST',
      headers: { origin: 'http://localhost:3000', host: 'localhost:3000' },
    });
    expect(hasTrustedOrigin(request)).toBe(true);
  });

  it('is untrusted when Origin host differs from Host header', () => {
    const request = makeRequest('http://localhost:3000/api/whatever', {
      method: 'POST',
      headers: { origin: 'https://evil.example.com', host: 'localhost:3000' },
    });
    expect(hasTrustedOrigin(request)).toBe(false);
  });

  it('is trusted when there is no Origin header at all', () => {
    const request = makeRequest('http://localhost:3000/api/whatever', {
      method: 'POST',
      headers: { host: 'localhost:3000' },
    });
    expect(hasTrustedOrigin(request)).toBe(true);
  });
});

describe('requireAdminApi', () => {
  afterEach(() => clearMockAuthCookies());

  it('rejects a cross-site POST with 403 when a request is passed and the origin mismatches', async () => {
    const request = makeRequest('http://localhost:3000/api/whatever', {
      method: 'POST',
      headers: { origin: 'https://evil.example.com', host: 'localhost:3000' },
    });

    const result = await requireAdminApi(request);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
      const body = await result.response.json();
      expect(body).toEqual({ error: 'Cross-site request rejected' });
    }
  });

  it('proceeds to normal auth checks for a matching-origin POST (401 when unauthenticated)', async () => {
    const request = makeRequest('http://localhost:3000/api/whatever', {
      method: 'POST',
      headers: { origin: 'http://localhost:3000', host: 'localhost:3000' },
    });

    const result = await requireAdminApi(request);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });

  it('skips the CSRF check entirely when no request arg is given', async () => {
    const result = await requireAdminApi();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });

  it('returns 401 when there is no admin_at cookie', async () => {
    const result = await requireAdminApi();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });

  it('returns 401 for an invalid token', async () => {
    const nextHeadersMock = jest.requireMock('next/headers') as {
      __setMockCookies: (cookies: Record<string, string>) => void;
    };
    nextHeadersMock.__setMockCookies({ admin_at: 'garbage-token' });

    const result = await requireAdminApi();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });

  it('returns 403 when the user is missing', async () => {
    const user = buildUser();
    const session = buildSession({ userId: user.id });
    await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

    (db.user.findUnique as jest.Mock).mockResolvedValue(null);
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);

    const result = await requireAdminApi();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it('returns 403 when the user is inactive', async () => {
    const user = buildUser({ status: 'SUSPENDED' });
    const session = buildSession({ userId: user.id });
    await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);

    const result = await requireAdminApi();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it('returns 401 when the session is revoked', async () => {
    const user = buildUser();
    const session = buildSession({ userId: user.id, revokedAt: new Date() });
    await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);

    const result = await requireAdminApi();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });

  it('returns { ok: true, admin } on the happy path', async () => {
    const user = buildUser();
    const session = buildSession({ userId: user.id });
    await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);

    const result = await requireAdminApi();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.admin.userId).toBe(user.id);
      expect(result.admin.sessionId).toBe(session.id);
    }
  });
});

describe('requireRole', () => {
  const admin = {
    userId: 'u1',
    email: 'a@example.com',
    name: 'Admin',
    role: 'ADMIN' as const,
    status: 'ACTIVE' as const,
    avatarUrl: null,
    sessionId: 's1',
  };

  it('returns true when the admin role is included', () => {
    expect(requireRole(admin, ['ADMIN', 'SUPER_ADMIN'])).toBe(true);
  });

  it('returns false when the admin role is not included', () => {
    expect(requireRole(admin, ['SUPER_ADMIN'])).toBe(false);
  });
});
