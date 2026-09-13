import { POST } from '@/app/api/auth/verify-email-change/route';
import { db } from '@/lib/database/db';
import { hashToken } from '@/lib/auth/tokens';
import { buildEmailChangeRequest, buildUser } from '../../../test/factories';
import { makeRequest } from '../../../test/testRequest';
import { getMockedEmailService } from '../../../test/mockEmail';

jest.mock('@/lib/database/db');
jest.mock('@/services/email/email.service');

function verifyRequest(body: unknown) {
  return makeRequest('/api/auth/verify-email-change', { method: 'POST', body });
}

describe('POST /api/auth/verify-email-change', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns 400 invalid_token for an unknown token', async () => {
    (db.emailChangeRequest.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await POST(verifyRequest({ token: 'nonexistent' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('invalid_token');
  });

  it('returns 400 invalid_token for an already-verified token', async () => {
    const changeRequest = buildEmailChangeRequest({ verifiedAt: new Date() });
    (db.emailChangeRequest.findUnique as jest.Mock).mockResolvedValue(changeRequest);

    const response = await POST(verifyRequest({ token: 'already-verified' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('invalid_token');
  });

  it('returns 400 expired_token for an expired token', async () => {
    const changeRequest = buildEmailChangeRequest({ expiresAt: new Date(Date.now() - 1000) });
    (db.emailChangeRequest.findUnique as jest.Mock).mockResolvedValue(changeRequest);

    const response = await POST(verifyRequest({ token: 'expired' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('expired_token');
  });

  it('returns 409 email_in_use when the new email became taken by someone else in the meantime', async () => {
    const changeRequest = buildEmailChangeRequest();
    (db.emailChangeRequest.findUnique as jest.Mock).mockResolvedValue(changeRequest);
    (db.user.findUnique as jest.Mock).mockImplementation(async ({ where }: { where: { email?: string } }) => {
      if (where.email === changeRequest.newEmail) return buildUser({ email: changeRequest.newEmail });
      return null;
    });

    const response = await POST(verifyRequest({ token: 'plaintext-valid-token' }));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error.code).toBe('email_in_use');
  });

  it('updates the email, revokes all sessions, logs EMAIL_CHANGED, and emails the OLD address', async () => {
    const plainToken = 'plaintext-verify-token';
    const changeRequest = buildEmailChangeRequest({ tokenHash: hashToken(plainToken) });
    const user = buildUser({ id: changeRequest.userId, email: changeRequest.oldEmail });

    (db.emailChangeRequest.findUnique as jest.Mock).mockResolvedValue(changeRequest);
    (db.user.findUnique as jest.Mock).mockImplementation(async ({ where }: { where: { email?: string; id?: string } }) => {
      if (where.email === changeRequest.newEmail) return null; // not taken
      if (where.id === changeRequest.userId) return user;
      return null;
    });
    (db.user.update as jest.Mock).mockResolvedValue({ ...user, email: changeRequest.newEmail });
    (db.emailChangeRequest.update as jest.Mock).mockResolvedValue(changeRequest);
    (db.session.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    (db.securityEvent.create as jest.Mock).mockResolvedValue(undefined);

    const response = await POST(verifyRequest({ token: plainToken }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);

    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { email: changeRequest.newEmail, emailVerifiedAt: expect.any(Date) },
    });
    expect(db.emailChangeRequest.update).toHaveBeenCalledWith({
      where: { id: changeRequest.id },
      data: { verifiedAt: expect.any(Date) },
    });
    expect(db.session.updateMany).toHaveBeenCalledWith({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(db.securityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: user.id,
          type: 'EMAIL_CHANGED',
          metadata: { oldEmail: changeRequest.oldEmail, newEmail: changeRequest.newEmail },
        }),
      })
    );

    const mockedService = getMockedEmailService();
    expect(mockedService.sendEmailChangedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: changeRequest.oldEmail,
        newEmail: changeRequest.newEmail,
      })
    );
    expect(mockedService.sendEmailChangedEmail).not.toHaveBeenCalledWith(
      expect.objectContaining({ to: changeRequest.newEmail })
    );
  });

  it('returns 422 validation_error for a missing token', async () => {
    const response = await POST(verifyRequest({}));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe('validation_error');
  });
});
