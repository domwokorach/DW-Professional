import { POST } from '@/app/api/auth/forgot-password/route';
import { db } from '@/lib/database/db';
import { buildUser } from '../../../test/factories';
import { makeRequest } from '../../../test/testRequest';
import { getMockedEmailService } from '../../../test/mockEmail';

jest.mock('@/lib/database/db');
jest.mock('@/services/email/email.service');

const GENERIC_MESSAGE = 'If an account exists for that email, a password reset link has been sent.';

function forgotPasswordRequest(body: unknown, ip = '2.2.2.1') {
  return makeRequest('/api/auth/forgot-password', {
    method: 'POST',
    body,
    headers: { 'x-forwarded-for': ip },
  });
}

describe('POST /api/auth/forgot-password', () => {
  afterEach(() => jest.clearAllMocks());

  it('creates a reset token, logs the event, and emails a reset link for an existing active user', async () => {
    const user = buildUser({ email: 'forgot-active@example.com', status: 'ACTIVE' });
    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.passwordResetToken.create as jest.Mock).mockResolvedValue(undefined);
    (db.securityEvent.create as jest.Mock).mockResolvedValue(undefined);

    const response = await POST(forgotPasswordRequest({ email: user.email }, '2.2.2.1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe(GENERIC_MESSAGE);

    expect(db.passwordResetToken.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: user.id }) })
    );
    expect(db.securityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: user.id, type: 'PASSWORD_RESET_REQUESTED' }),
      })
    );

    const mockedService = getMockedEmailService();
    expect(mockedService.sendForgotPasswordEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: user.email,
        name: user.name,
        resetUrl: expect.stringContaining('/auth/reset-password?token='),
      })
    );
  });

  it('returns the same generic response for an unknown email, without creating a token', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await POST(forgotPasswordRequest({ email: 'unknown-user@example.com' }, '2.2.2.2'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe(GENERIC_MESSAGE);
    expect(db.passwordResetToken.create).not.toHaveBeenCalled();
    const mockedService = getMockedEmailService();
    expect(mockedService.sendForgotPasswordEmail).not.toHaveBeenCalled();
  });

  it('returns the same generic response for a SUSPENDED user, without creating a token', async () => {
    const user = buildUser({ email: 'forgot-suspended@example.com', status: 'SUSPENDED' });
    (db.user.findUnique as jest.Mock).mockResolvedValue(user);

    const response = await POST(forgotPasswordRequest({ email: user.email }, '2.2.2.3'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe(GENERIC_MESSAGE);
    expect(db.passwordResetToken.create).not.toHaveBeenCalled();
  });

  it('returns the same generic response for a DISABLED user, without creating a token', async () => {
    const user = buildUser({ email: 'forgot-disabled@example.com', status: 'DISABLED' });
    (db.user.findUnique as jest.Mock).mockResolvedValue(user);

    const response = await POST(forgotPasswordRequest({ email: user.email }, '2.2.2.4'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe(GENERIC_MESSAGE);
    expect(db.passwordResetToken.create).not.toHaveBeenCalled();
  });

  it('returns 422 validation_error for a malformed email', async () => {
    const response = await POST(forgotPasswordRequest({ email: 'not-an-email' }, '2.2.2.5'));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe('validation_error');
  });

  it('returns the same generic 200 response (not 429) once rate-limited', async () => {
    const email = 'forgot-rate-limited@example.com';
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);

    let lastResponse;
    for (let i = 0; i < 4; i += 1) {
      lastResponse = await POST(forgotPasswordRequest({ email }, '2.2.2.6'));
    }

    const body = await lastResponse!.json();
    expect(lastResponse!.status).toBe(200);
    expect(body.message).toBe(GENERIC_MESSAGE);
  });
});
