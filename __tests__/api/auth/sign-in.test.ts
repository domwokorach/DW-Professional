import { POST } from '@/app/api/auth/sign-in/route';
import { db } from '@/lib/database/db';
import { ACCESS_COOKIE, REFRESH_COOKIE, DEVICE_COOKIE } from '@/lib/auth/cookies';
import { buildUserWithPassword, buildSession, FIXTURE_PASSWORD } from '../../../test/factories';
import { makeRequest } from '../../../test/testRequest';
import { getMockedSendTemplateEmail } from '../../../test/mockEmail';

jest.mock('@/lib/database/db');
jest.mock('@/lib/email/mailer');

function signInRequest(body: unknown, opts: { ip?: string; cookies?: Record<string, string> } = {}) {
  return makeRequest('/api/auth/sign-in', {
    method: 'POST',
    body,
    headers: opts.ip ? { 'x-forwarded-for': opts.ip } : undefined,
    cookies: opts.cookies,
  });
}

describe('POST /api/auth/sign-in', () => {
  afterEach(() => jest.clearAllMocks());

  it('signs in with valid credentials, sets cookies, logs SIGN_IN and sends a new-device email', async () => {
    const user = await buildUserWithPassword({ email: 'sign-in-success@example.com' });
    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.session.count as jest.Mock).mockResolvedValue(0);
    (db.session.create as jest.Mock).mockImplementation(async ({ data }: any) =>
      buildSession({ ...data, userId: user.id })
    );
    (db.user.update as jest.Mock).mockResolvedValue(user);
    (db.securityEvent.create as jest.Mock).mockResolvedValue(undefined);

    const response = await POST(signInRequest(
      { email: user.email, password: FIXTURE_PASSWORD },
      { ip: '1.1.1.1', cookies: { [DEVICE_COOKIE]: 'device-abc' } }
    ));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.user).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
    });
    expect(JSON.stringify(body)).not.toContain(user.passwordHash);

    expect(response.cookies.get(ACCESS_COOKIE)?.value).toBeTruthy();
    expect(response.cookies.get(REFRESH_COOKIE)?.value).toBeTruthy();
    expect(response.cookies.get(DEVICE_COOKIE)?.value).toBeTruthy();

    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { lastLoginAt: expect.any(Date) },
    });

    expect(db.securityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: user.id, type: 'SIGN_IN' }) })
    );

    const mockedSend = getMockedSendTemplateEmail();
    expect(mockedSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: user.email, subject: 'New sign-in to your admin account' })
    );
  });

  it('does not send a new-device email when the device already has a session', async () => {
    const user = await buildUserWithPassword({ email: 'sign-in-known-device@example.com' });
    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.session.count as jest.Mock).mockResolvedValue(1);
    (db.session.create as jest.Mock).mockImplementation(async ({ data }: any) =>
      buildSession({ ...data, userId: user.id })
    );
    (db.user.update as jest.Mock).mockResolvedValue(user);

    const response = await POST(signInRequest(
      { email: user.email, password: FIXTURE_PASSWORD },
      { ip: '1.1.1.2', cookies: { [DEVICE_COOKIE]: 'device-known' } }
    ));

    expect(response.status).toBe(200);
    const mockedSend = getMockedSendTemplateEmail();
    expect(mockedSend).not.toHaveBeenCalled();
  });

  it('returns 401 invalid_credentials and logs FAILED_SIGN_IN on wrong password', async () => {
    const user = await buildUserWithPassword({ email: 'sign-in-wrong-password@example.com' });
    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.securityEvent.create as jest.Mock).mockResolvedValue(undefined);

    const response = await POST(signInRequest(
      { email: user.email, password: 'TotallyWrongPassword1!' },
      { ip: '1.1.1.3' }
    ));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('invalid_credentials');
    expect(db.securityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: user.id, type: 'FAILED_SIGN_IN' }) })
    );
  });

  it('returns the same generic 401 invalid_credentials for an unknown email (no enumeration)', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await POST(signInRequest(
      { email: 'nobody-here@example.com', password: FIXTURE_PASSWORD },
      { ip: '1.1.1.4' }
    ));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('invalid_credentials');
    expect(db.securityEvent.create).not.toHaveBeenCalled();
  });

  it('returns 403 account_disabled for a DISABLED user', async () => {
    const user = await buildUserWithPassword({ email: 'sign-in-disabled@example.com', status: 'DISABLED' });
    (db.user.findUnique as jest.Mock).mockResolvedValue(user);

    const response = await POST(signInRequest(
      { email: user.email, password: FIXTURE_PASSWORD },
      { ip: '1.1.1.5' }
    ));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('account_disabled');
  });

  it('returns 403 account_suspended for a SUSPENDED user', async () => {
    const user = await buildUserWithPassword({ email: 'sign-in-suspended@example.com', status: 'SUSPENDED' });
    (db.user.findUnique as jest.Mock).mockResolvedValue(user);

    const response = await POST(signInRequest(
      { email: user.email, password: FIXTURE_PASSWORD },
      { ip: '1.1.1.6' }
    ));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('account_suspended');
  });

  it('returns 422 validation_error for a malformed body', async () => {
    const response = await POST(signInRequest({ email: 'not-an-email', password: '' }, { ip: '1.1.1.7' }));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe('validation_error');
    expect(body.error.fields).toBeDefined();
  });

  it('returns 429 rate_limited after exceeding the per-email attempt limit', async () => {
    const email = 'sign-in-rate-limited@example.com';
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);

    let lastResponse;
    for (let i = 0; i < 6; i += 1) {
      lastResponse = await POST(signInRequest({ email, password: 'whatever-wrong-1' }, { ip: '9.9.9.9' }));
    }

    const body = await lastResponse!.json();
    expect(lastResponse!.status).toBe(429);
    expect(body.error.code).toBe('rate_limited');
  });
});
