const mockSend = jest.fn();

jest.mock('@/services/email/resend.provider', () => ({
  resendProvider: { send: mockSend },
}));

// Real rendering pulls in @react-email/render's dynamic import(), which Jest
// can't resolve without --experimental-vm-modules — irrelevant to what this
// suite is testing (the service layer's error handling), so it's stubbed out.
jest.mock('@react-email/components', () => ({
  render: jest.fn().mockResolvedValue('<html></html>'),
}));

describe('sendCommentPinEmail', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it('resolves when the provider reports success', async () => {
    mockSend.mockResolvedValue({ ok: true, id: 'email-1' });
    const { sendCommentPinEmail } = await import('@/services/email/email.service');

    await expect(
      sendCommentPinEmail({ to: 'user@example.com', pin: '123456', expiresInMinutes: 10 })
    ).resolves.toEqual({ ok: true, id: 'email-1' });
  });

  // Regression test: the provider used to swallow a Resend failure into
  // `{ ok: false }` while this function just returned it unchecked, so
  // /api/comments/send-pin's try/catch never fired and it reported success
  // to the client even though no email was ever delivered.
  it('throws when the provider reports failure, instead of resolving silently', async () => {
    mockSend.mockResolvedValue({ ok: false, error: 'domain_not_verified' });
    const { sendCommentPinEmail } = await import('@/services/email/email.service');

    await expect(
      sendCommentPinEmail({ to: 'user@example.com', pin: '123456', expiresInMinutes: 10 })
    ).rejects.toThrow(/domain_not_verified/);
  });

  it('throws when RESEND_API_KEY is missing (provider reports not_configured)', async () => {
    mockSend.mockResolvedValue({ ok: false, error: 'not_configured' });
    const { sendCommentPinEmail } = await import('@/services/email/email.service');

    await expect(
      sendCommentPinEmail({ to: 'user@example.com', pin: '123456', expiresInMinutes: 10 })
    ).rejects.toThrow(/not_configured/);
  });
});
