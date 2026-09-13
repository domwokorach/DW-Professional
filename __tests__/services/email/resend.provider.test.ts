const mockSend = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

describe('ResendEmailProvider', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    mockSend.mockReset();
    process.env = {
      ...ORIGINAL_ENV,
      RESEND_API_KEY: 'test-key',
      EMAIL_FROM_NAME: 'Dominic Wokorach',
      EMAIL_FROM_ADDRESS: 'no-reply@dominicwokorach.me',
    };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('sends with the configured from header', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email-1' }, error: null });
    const { ResendEmailProvider } = await import('@/services/email/resend.provider');
    const provider = new ResendEmailProvider();

    const result = await provider.send({
      to: 'user@example.com',
      subject: 'Reset your password',
      html: '<p>hi</p>',
      text: 'hi',
    });

    expect(result).toEqual({ ok: true, id: 'email-1' });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Dominic Wokorach <no-reply@dominicwokorach.me>',
        to: 'user@example.com',
        subject: 'Reset your password',
      })
    );
  });

  it('returns a failure result and logs a redacted error when Resend errors', async () => {
    mockSend.mockResolvedValue({ data: null, error: { name: 'validation_error', message: 'bad request' } });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { ResendEmailProvider } = await import('@/services/email/resend.provider');
    const provider = new ResendEmailProvider();

    const result = await provider.send({
      to: 'user@example.com',
      subject: 'Reset your password',
      html: '<p>hi</p>',
      text: 'hi',
    });

    expect(result.ok).toBe(false);
    expect(errorSpy).toHaveBeenCalled();
    const loggedPayload = JSON.stringify(errorSpy.mock.calls[0]);
    expect(loggedPayload).not.toContain('test-key');
    expect(loggedPayload).not.toContain('user@example.com');
    errorSpy.mockRestore();
  });

  it('skips sending and reports not_configured when RESEND_API_KEY is missing', async () => {
    delete process.env.RESEND_API_KEY;
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { ResendEmailProvider } = await import('@/services/email/resend.provider');
    const provider = new ResendEmailProvider();

    const result = await provider.send({
      to: 'user@example.com',
      subject: 'Reset your password',
      html: '<p>hi</p>',
      text: 'hi',
    });

    expect(result).toEqual({ ok: false, error: 'not_configured' });
    expect(mockSend).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
