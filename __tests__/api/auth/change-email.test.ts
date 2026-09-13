import { POST } from '@/app/api/auth/change-email/route';
import { db } from '@/lib/database/db';
import { buildUserWithPassword, buildSession, FIXTURE_PASSWORD } from '../../../test/factories';
import { makeRequest, authCookiesFor, clearMockAuthCookies } from '../../../test/testRequest';
import { getMockedEmailService } from '../../../test/mockEmail';

jest.mock('@/lib/database/db');
jest.mock('@/services/email/email.service');

const NEW_EMAIL = 'brand-new-address@example.com';

async function authedRequest(body: unknown, opts: { origin?: string; host?: string } = {}) {
  const user = await buildUserWithPassword({ email: 'current-owner@example.com' });
  const session = buildSession({ userId: user.id });
  const cookies = await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

  (db.user.findUnique as jest.Mock).mockResolvedValue(user);
  (db.session.findUnique as jest.Mock).mockResolvedValue(session);

  const headers: Record<string, string> = {};
  if (opts.origin) headers.origin = opts.origin;
  if (opts.host) headers.host = opts.host;

  const request = makeRequest('/api/auth/change-email', {
    method: 'POST',
    body,
    cookies,
    headers,
  });

  return { request, user, session };
}

describe('POST /api/auth/change-email', () => {
  afterEach(() => clearMockAuthCookies());
  afterEach(() => jest.clearAllMocks());

  it('rejects a cross-origin request with 403', async () => {
    const { request } = await authedRequest(
      { currentPassword: FIXTURE_PASSWORD, newEmail: NEW_EMAIL },
      { origin: 'https://evil.example.com', host: 'localhost:3000' }
    );

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('Cross-site request rejected');
  });

  it('returns 401 when there is no session', async () => {
    const response = await POST(
      makeRequest('/api/auth/change-email', {
        method: 'POST',
        body: { currentPassword: FIXTURE_PASSWORD, newEmail: NEW_EMAIL },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 incorrect_password on the wrong current password', async () => {
    const { request } = await authedRequest({ currentPassword: 'TotallyWrongPassword1!', newEmail: NEW_EMAIL });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('incorrect_password');
  });

  it('returns 400 same_email when the new email equals the current email', async () => {
    const { request } = await authedRequest({ currentPassword: FIXTURE_PASSWORD, newEmail: 'current-owner@example.com' });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('same_email');
  });

  it('returns 409 email_in_use when the new email is already taken by another user', async () => {
    const { request, user } = await authedRequest({ currentPassword: FIXTURE_PASSWORD, newEmail: NEW_EMAIL });
    const existingUser = buildUserWithPasswordSync();
    // Both guard.ts (resolving the session) and the route itself look up by
    // id; only the route's lookup by the new email should find someone else.
    (db.user.findUnique as jest.Mock).mockImplementation(async ({ where }: { where: { id?: string; email?: string } }) => {
      if (where.id) return user;
      if (where.email === NEW_EMAIL) return existingUser;
      return null;
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error.code).toBe('email_in_use');
  });

  it('creates a hashed email-change request, logs the event, and emails the NEW address on success', async () => {
    const { request, user, session } = await authedRequest({ currentPassword: FIXTURE_PASSWORD, newEmail: NEW_EMAIL });
    (db.user.findUnique as jest.Mock).mockImplementation(async ({ where }: { where: { id?: string; email?: string } }) => {
      if (where.id) return user;
      if (where.email === NEW_EMAIL) return null; // not taken
      return null;
    });
    (db.emailChangeRequest.create as jest.Mock).mockResolvedValue(undefined);
    (db.securityEvent.create as jest.Mock).mockResolvedValue(undefined);

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    // The message must not claim the email has already changed — it hasn't,
    // pending confirmation of the verification link.
    expect(body.message).not.toMatch(/your email (has been|was) changed/i);
    expect(body.message).toMatch(/won.t change until you confirm/i);
    expect(body.message).toContain(NEW_EMAIL);

    const createCall = (db.emailChangeRequest.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data.userId).toBe(user.id);
    expect(createCall.data.oldEmail).toBe(user.email);
    expect(createCall.data.newEmail).toBe(NEW_EMAIL);
    expect(createCall.data.tokenHash).not.toBe(NEW_EMAIL);
    expect(createCall.data.tokenHash).toMatch(/^[a-f0-9]{64}$/);

    expect(db.securityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: user.id, sessionId: session.id, type: 'EMAIL_CHANGE_REQUESTED' }),
      })
    );

    const mockedService = getMockedEmailService();
    expect(mockedService.sendEmailChangeVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: NEW_EMAIL, newEmail: NEW_EMAIL })
    );
  });

  it('returns 422 validation_error for a malformed new email', async () => {
    const { request } = await authedRequest({ currentPassword: FIXTURE_PASSWORD, newEmail: 'not-an-email' });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe('validation_error');
  });
});

function buildUserWithPasswordSync() {
  // A distinct existing user record to represent "email already taken" —
  // synchronous placeholder is fine here since only .email/.id are read.
  return {
    id: 'other-user-id',
    name: 'Other User',
    email: 'brand-new-address@example.com',
    passwordHash: 'irrelevant',
    role: 'ADMIN',
    status: 'ACTIVE',
    avatarUrl: null,
    availability: 'OFFLINE',
    preferences: {},
    emailVerifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: null,
  };
}
