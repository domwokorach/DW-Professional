import { PATCH } from '@/app/api/admin/account/route';
import { db } from '@/lib/database/db';
import { buildUser, buildSession } from '../../../test/factories';
import { makeRequest, authCookiesFor, clearMockAuthCookies } from '../../../test/testRequest';

jest.mock('@/lib/database/db');

async function authedRequest(body: unknown, opts: { origin?: string; host?: string } = {}) {
  const user = buildUser({ passwordHash: 'super-secret-account-hash' });
  const session = buildSession({ userId: user.id });
  const cookies = await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

  (db.user.findUnique as jest.Mock).mockResolvedValue(user);
  (db.session.findUnique as jest.Mock).mockResolvedValue(session);

  const headers: Record<string, string> = {};
  if (opts.origin) headers.origin = opts.origin;
  if (opts.host) headers.host = opts.host;

  const request = makeRequest('/api/admin/account', { method: 'PATCH', body, cookies, headers });
  return { request, user, session };
}

describe('PATCH /api/admin/account', () => {
  afterEach(() => clearMockAuthCookies());
  afterEach(() => jest.clearAllMocks());

  it('rejects a cross-origin request with 403', async () => {
    const { request } = await authedRequest({ name: 'New Name' }, { origin: 'https://evil.example.com', host: 'localhost:3000' });

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('Cross-site request rejected');
  });

  it('returns 401 when there is no session', async () => {
    const response = await PATCH(makeRequest('/api/admin/account', { method: 'PATCH', body: { name: 'New Name' } }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('updates the name and returns the updated user without the password hash', async () => {
    const { request, user } = await authedRequest({ name: 'Updated Name' });
    const updatedUser = { ...user, name: 'Updated Name' };
    (db.user.update as jest.Mock).mockResolvedValue(updatedUser);

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.user).toEqual({
      id: user.id,
      name: 'Updated Name',
      email: user.email,
      avatarUrl: user.avatarUrl,
    });
    expect(JSON.stringify(body)).not.toContain('super-secret-account-hash');

    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { name: 'Updated Name' },
    });
  });

  it('explicitly sets avatarUrl to null when passed null', async () => {
    const { request, user } = await authedRequest({ avatarUrl: null });
    const updatedUser = { ...user, avatarUrl: null };
    (db.user.update as jest.Mock).mockResolvedValue(updatedUser);

    const response = await PATCH(request);
    expect(response.status).toBe(200);

    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { avatarUrl: null },
    });
  });

  it('returns 422 validation_error for an invalid payload', async () => {
    const { request } = await authedRequest({ avatarUrl: 'not-a-url' });

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe('validation_error');
  });
});
