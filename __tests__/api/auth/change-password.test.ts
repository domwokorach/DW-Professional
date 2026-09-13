import { POST } from '@/app/api/auth/change-password/route';
import { db } from '@/lib/database/db';
import { verifyPassword } from '@/lib/auth/passwords';
import { buildUserWithPassword, buildSession, FIXTURE_PASSWORD } from '../../../test/factories';
import { makeRequest, authCookiesFor, clearMockAuthCookies } from '../../../test/testRequest';
import { getMockedEmailService } from '../../../test/mockEmail';

jest.mock('@/lib/database/db');
jest.mock('@/services/email/email.service');

const NEW_PASSWORD = 'BrandNewPassw0rd!';

async function authedRequest(body: unknown, opts: { origin?: string; host?: string } = {}) {
  const user = await buildUserWithPassword();
  const session = buildSession({ userId: user.id });
  const cookies = await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

  (db.user.findUnique as jest.Mock).mockResolvedValue(user);
  (db.session.findUnique as jest.Mock).mockResolvedValue(session);

  const headers: Record<string, string> = {};
  if (opts.origin) headers.origin = opts.origin;
  if (opts.host) headers.host = opts.host;

  const request = makeRequest('/api/auth/change-password', {
    method: 'POST',
    body,
    cookies,
    headers,
  });

  return { request, user, session };
}

describe('POST /api/auth/change-password', () => {
  afterEach(() => clearMockAuthCookies());
  afterEach(() => jest.clearAllMocks());

  it('rejects a cross-origin request with 403', async () => {
    const { request } = await authedRequest(
      { currentPassword: FIXTURE_PASSWORD, newPassword: NEW_PASSWORD },
      { origin: 'https://evil.example.com', host: 'localhost:3000' }
    );

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('Cross-site request rejected');
  });

  it('returns 401 when there is no session', async () => {
    const response = await POST(
      makeRequest('/api/auth/change-password', {
        method: 'POST',
        body: { currentPassword: FIXTURE_PASSWORD, newPassword: NEW_PASSWORD },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 incorrect_password with a fields.currentPassword message on the wrong current password', async () => {
    const { request } = await authedRequest({ currentPassword: 'TotallyWrongPassword1!', newPassword: NEW_PASSWORD });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('incorrect_password');
    expect(body.error.fields.currentPassword).toBeTruthy();
  });

  it('updates the hash, revokes other sessions but not the current one, logs the event, and emails a confirmation', async () => {
    const { request, user, session } = await authedRequest({
      currentPassword: FIXTURE_PASSWORD,
      newPassword: NEW_PASSWORD,
    });
    (db.user.update as jest.Mock).mockResolvedValue(user);
    (db.session.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    (db.securityEvent.create as jest.Mock).mockResolvedValue(undefined);

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });

    const updateCall = (db.user.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.where).toEqual({ id: user.id });
    await expect(verifyPassword(NEW_PASSWORD, updateCall.data.passwordHash)).resolves.toBe(true);

    expect(db.session.updateMany).toHaveBeenCalledWith({
      where: { userId: user.id, revokedAt: null, id: { not: session.id } },
      data: { revokedAt: expect.any(Date) },
    });

    expect(db.securityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: user.id, sessionId: session.id, type: 'PASSWORD_CHANGED' }),
      })
    );

    const mockedService = getMockedEmailService();
    expect(mockedService.sendPasswordChangedEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: user.email })
    );
  });

  it('returns 422 validation_error for a weak new password', async () => {
    const { request } = await authedRequest({ currentPassword: FIXTURE_PASSWORD, newPassword: 'weak' });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe('validation_error');
  });
});
