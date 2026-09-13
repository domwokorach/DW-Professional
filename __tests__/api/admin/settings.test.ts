import { GET, PATCH } from '@/app/api/admin/settings/route';
import { db } from '@/lib/database/db';
import { buildUser, buildSession } from '../../../test/factories';
import { makeRequest, authCookiesFor, clearMockAuthCookies } from '../../../test/testRequest';

jest.mock('@/lib/database/db');

const DEFAULT_PREFERENCES = {
  theme: 'system',
  language: 'en-GB',
  timeZone: 'Europe/London',
  notifications: { newMessage: true, sound: true, browserPush: false },
};

async function authSetup(user = buildUser()) {
  const session = buildSession({ userId: user.id });
  const cookies = await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });
  (db.user.findUnique as jest.Mock).mockResolvedValue(user);
  (db.session.findUnique as jest.Mock).mockResolvedValue(session);
  return { user, session, cookies };
}

describe('GET /api/admin/settings', () => {
  afterEach(() => clearMockAuthCookies());
  afterEach(() => jest.clearAllMocks());

  it('returns 401 when there is no session', async () => {
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('merges stored preferences over the defaults', async () => {
    const user = buildUser({ preferences: { theme: 'dark' }, availability: 'ONLINE' });
    await authSetup(user);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.preferences).toEqual({ ...DEFAULT_PREFERENCES, theme: 'dark' });
    expect(body.availability).toBe('ONLINE');
  });

  it('returns full defaults when the user has no stored preferences', async () => {
    const user = buildUser({ preferences: {} });
    await authSetup(user);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.preferences).toEqual(DEFAULT_PREFERENCES);
  });
});

describe('PATCH /api/admin/settings', () => {
  afterEach(() => clearMockAuthCookies());
  afterEach(() => jest.clearAllMocks());

  async function authedPatchRequest(body: unknown, opts: { origin?: string; host?: string } = {}) {
    const user = buildUser({ preferences: { theme: 'dark', notifications: { newMessage: false, sound: true, browserPush: false } } });
    const { cookies } = await authSetup(user);

    const headers: Record<string, string> = {};
    if (opts.origin) headers.origin = opts.origin;
    if (opts.host) headers.host = opts.host;

    const request = makeRequest('/api/admin/settings', { method: 'PATCH', body, cookies, headers });
    return { request, user };
  }

  it('rejects a cross-origin request with 403', async () => {
    const { request } = await authedPatchRequest({ theme: 'light' }, { origin: 'https://evil.example.com', host: 'localhost:3000' });

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('Cross-site request rejected');
  });

  it('returns 401 when there is no session', async () => {
    const response = await PATCH(makeRequest('/api/admin/settings', { method: 'PATCH', body: { theme: 'light' } }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('merges a nested partial notifications update while preserving untouched notification prefs', async () => {
    const { request, user } = await authedPatchRequest({ notifications: { sound: false } });
    (db.user.update as jest.Mock).mockImplementation(async ({ data }: any) => ({ ...user, ...data }));

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.preferences.notifications).toEqual({
      newMessage: false, // preserved from the user's existing stored preferences
      sound: false, // updated by this patch
      browserPush: false, // preserved
    });
    expect(body.preferences.theme).toBe('dark'); // untouched top-level preference preserved
  });

  it('updates the availability enum on the User row directly when provided', async () => {
    const { request, user } = await authedPatchRequest({ availability: 'BUSY' });
    (db.user.update as jest.Mock).mockImplementation(async ({ data }: any) => ({ ...user, ...data }));

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.availability).toBe('BUSY');
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ availability: 'BUSY' }) })
    );
  });

  it('returns 422 validation_error for an invalid payload', async () => {
    const { request } = await authedPatchRequest({ theme: 'not-a-theme' });

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe('validation_error');
  });
});
