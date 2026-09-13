import { DELETE } from '@/app/api/auth/sessions/[sessionId]/route';
import { db } from '@/lib/database/db';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth/cookies';
import { buildUser, buildSession } from '../../../test/factories';
import { makeRequest, authCookiesFor, clearMockAuthCookies } from '../../../test/testRequest';

jest.mock('@/lib/database/db');

async function authedDeleteRequest(targetSessionId: string, opts: { origin?: string; host?: string } = {}) {
  const user = buildUser();
  const currentSession = buildSession({ userId: user.id });
  const cookies = await authCookiesFor({
    userId: user.id,
    email: user.email,
    role: user.role,
    sessionId: currentSession.id,
  });

  (db.user.findUnique as jest.Mock).mockResolvedValue(user);
  (db.session.findUnique as jest.Mock).mockImplementation(async ({ where }: { where: { id: string } }) => {
    if (where.id === currentSession.id) return currentSession;
    return null;
  });

  const headers: Record<string, string> = {};
  if (opts.origin) headers.origin = opts.origin;
  if (opts.host) headers.host = opts.host;

  const request = makeRequest(`/api/auth/sessions/${targetSessionId}`, { method: 'DELETE', cookies, headers });
  return { request, user, currentSession };
}

function callDelete(request: ReturnType<typeof makeRequest>, sessionId: string) {
  return DELETE(request, { params: Promise.resolve({ sessionId }) });
}

describe('DELETE /api/auth/sessions/[sessionId]', () => {
  afterEach(() => clearMockAuthCookies());
  afterEach(() => jest.clearAllMocks());

  it('rejects a cross-origin request with 403', async () => {
    const { request } = await authedDeleteRequest('irrelevant-session-id', {
      origin: 'https://evil.example.com',
      host: 'localhost:3000',
    });
    const response = await callDelete(request, 'irrelevant-session-id');
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('Cross-site request rejected');
  });

  it("returns 404 not_found for a session belonging to a different user", async () => {
    const { request, currentSession } = await authedDeleteRequest('someone-elses-session');
    // db.session.findUnique for the target session resolves to a session owned by a different user.
    (db.session.findUnique as jest.Mock).mockImplementation(async ({ where }: { where: { id: string } }) => {
      if (where.id === currentSession.id) return currentSession;
      if (where.id === 'someone-elses-session') return buildSession({ id: 'someone-elses-session', userId: 'a-different-user' });
      return null;
    });

    const response = await callDelete(request, 'someone-elses-session');
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('not_found');
  });

  it('revokes an other-device session of the same user, logs SESSION_REVOKED, and does NOT clear cookies', async () => {
    const { request, user, currentSession } = await authedDeleteRequest('other-device-session');
    const otherDeviceSession = buildSession({ id: 'other-device-session', userId: user.id });
    (db.session.findUnique as jest.Mock).mockImplementation(async ({ where }: { where: { id: string } }) => {
      if (where.id === currentSession.id) return currentSession;
      if (where.id === otherDeviceSession.id) return otherDeviceSession;
      return null;
    });
    (db.session.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    (db.securityEvent.create as jest.Mock).mockResolvedValue(undefined);

    const response = await callDelete(request, otherDeviceSession.id);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(db.session.updateMany).toHaveBeenCalledWith({
      where: { id: otherDeviceSession.id, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(db.securityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: user.id, sessionId: otherDeviceSession.id, type: 'SESSION_REVOKED' }),
      })
    );
    expect(response.cookies.get(ACCESS_COOKIE)?.value).toBeUndefined();
    expect(response.cookies.get(REFRESH_COOKIE)?.value).toBeUndefined();
  });

  it('revoking the CURRENT session also clears auth cookies', async () => {
    const { request, currentSession } = await authedDeleteRequest('placeholder-target-id');
    (db.session.findUnique as jest.Mock).mockImplementation(async ({ where }: { where: { id: string } }) => {
      if (where.id === currentSession.id) return currentSession;
      return null;
    });
    (db.session.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    (db.securityEvent.create as jest.Mock).mockResolvedValue(undefined);

    const response = await callDelete(request, currentSession.id);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(response.cookies.get(ACCESS_COOKIE)?.value).toBe('');
    expect(response.cookies.get(REFRESH_COOKIE)?.value).toBe('');
  });
});

