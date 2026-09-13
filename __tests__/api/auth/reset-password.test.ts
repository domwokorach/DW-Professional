import { POST } from '@/app/api/auth/reset-password/route';
import { db } from '@/lib/database/db';
import { verifyPassword } from '@/lib/auth/passwords';
import { hashToken } from '@/lib/auth/tokens';
import { buildPasswordResetToken, buildUser } from '../../../test/factories';
import { makeRequest } from '../../../test/testRequest';
import { getMockedSendTemplateEmail } from '../../../test/mockEmail';

jest.mock('@/lib/database/db');
jest.mock('@/lib/email/mailer');

const NEW_PASSWORD = 'BrandNewPassw0rd!';

function resetPasswordRequest(body: unknown) {
  return makeRequest('/api/auth/reset-password', { method: 'POST', body });
}

describe('POST /api/auth/reset-password', () => {
  afterEach(() => jest.clearAllMocks());

  it('resets the password, revokes all sessions, logs the event, and emails a confirmation', async () => {
    const plainToken = 'valid-reset-token';
    const resetToken = buildPasswordResetToken({ tokenHash: hashToken(plainToken) });
    const user = buildUser({ id: resetToken.userId });

    (db.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(resetToken);
    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.user.update as jest.Mock).mockResolvedValue(user);
    (db.passwordResetToken.update as jest.Mock).mockResolvedValue(resetToken);
    (db.session.updateMany as jest.Mock).mockResolvedValue({ count: 2 });
    (db.securityEvent.create as jest.Mock).mockResolvedValue(undefined);

    const response = await POST(resetPasswordRequest({ token: plainToken, password: NEW_PASSWORD }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);

    const updateCall = (db.user.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.where).toEqual({ id: user.id });
    expect(updateCall.data.passwordHash).not.toBe(user.passwordHash);
    await expect(verifyPassword(NEW_PASSWORD, updateCall.data.passwordHash)).resolves.toBe(true);

    expect(db.passwordResetToken.update).toHaveBeenCalledWith({
      where: { id: resetToken.id },
      data: { usedAt: expect.any(Date) },
    });

    expect(db.session.updateMany).toHaveBeenCalledWith({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });

    expect(db.securityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: user.id, type: 'PASSWORD_RESET_COMPLETED' }),
      })
    );

    const mockedSend = getMockedSendTemplateEmail();
    expect(mockedSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: user.email, subject: 'Your password was changed' })
    );
  });

  it('returns 400 invalid_token when the token does not exist', async () => {
    (db.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await POST(resetPasswordRequest({ token: 'nonexistent', password: NEW_PASSWORD }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('invalid_token');
  });

  it('returns 400 invalid_token when the token has already been used', async () => {
    const resetToken = buildPasswordResetToken({ usedAt: new Date() });
    (db.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(resetToken);

    const response = await POST(resetPasswordRequest({ token: 'used-token', password: NEW_PASSWORD }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('invalid_token');
  });

  it('returns 400 invalid_token when the token has expired', async () => {
    const resetToken = buildPasswordResetToken({ expiresAt: new Date(Date.now() - 1000) });
    (db.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(resetToken);

    const response = await POST(resetPasswordRequest({ token: 'expired-token', password: NEW_PASSWORD }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('invalid_token');
  });

  it('returns 422 validation_error for a weak new password', async () => {
    const response = await POST(resetPasswordRequest({ token: 'some-token', password: 'weak' }));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe('validation_error');
    expect(body.error.fields).toBeDefined();
  });
});
