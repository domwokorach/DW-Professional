import { POST } from '@/app/api/auth/sessions/revoke-others/route';
import { db } from '@/lib/database/db';
import { buildUser, buildSession } from '../../../test/factories';
import { makeRequest, authCookiesFor, clearMockAuthCookies } from '../../../test/testRequest';
import { getMockedEmailService } from '../../../test/mockEmail';

jest.mock('@/lib/database/db');
jest.mock('@/services/email/email.service');

async function authedRequest(opts: { origin?: string; host?: string } = {}) {
  const user = buildUser();
  const session = buildSession({ userId: user.id });
  const cookies = await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

  (db.user.findUnique as jest.Mock).mockResolvedValue(user);
  (db.session.findUnique as jest.Mock).mockResolvedValue(session);

  const headers: Record<string, string> = {};
  if (opts.origin) headers.origin = opts.origin;
  if (opts.host) headers.host = opts.host;

  const request = makeRequest('/api/auth/sessions/revoke-others', { method: 'POST', cookies, headers });
  return { request, user, session };
}

describe('POST /api/auth/sessions/revoke-others', () => {
  afterEach(() => clearMockAuthCookies());
  afterEach(() => jest.clearAllMocks());

  it('rejects a cross-origin request with 403', async () => {
    const { request } = await authedRequest({ origin: 'https://evil.example.com', host: 'localhost:3000' });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('Cross-site request rejected');
  });

  it('returns 401 when there is no session', async () => {
    const response = await POST(makeRequest('/api/auth/sessions/revoke-others', { method: 'POST' }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('revokes all other sessions, logs SESSION_REVOKED with the all_other_sessions scope, and emails a security alert', async () => {
    const { request, user, session } = await authedRequest();
    (db.session.updateMany as jest.Mock).mockResolvedValue({ count: 3 });
    (db.securityEvent.create as jest.Mock).mockResolvedValue(undefined);

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });

    expect(db.session.updateMany).toHaveBeenCalledWith({
      where: { userId: user.id, revokedAt: null, id: { not: session.id } },
      data: { revokedAt: expect.any(Date) },
    });

    expect(db.securityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: user.id,
          sessionId: session.id,
          type: 'SESSION_REVOKED',
          metadata: { scope: 'all_other_sessions' },
        }),
      })
    );

    const mockedService = getMockedEmailService();
    expect(mockedService.sendSecurityAlertEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: user.email, title: 'All other sessions were signed out' })
    );
  });
});
