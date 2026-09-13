jest.mock('@/services/email/resend.provider', () => ({
  resendProvider: { send: jest.fn() },
}));

import { resendProvider } from '@/services/email/resend.provider';
import { sendNewConversationEmail } from '@/lib/notifications/email';

const mockSend = resendProvider.send as jest.MockedFunction<typeof resendProvider.send>;

describe('sendNewConversationEmail', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    mockSend.mockReset();
    process.env = { ...ORIGINAL_ENV, ADMIN_NOTIFICATION_EMAIL: 'admin@dominicwokorach.me' };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('does nothing when ADMIN_NOTIFICATION_EMAIL is not configured', async () => {
    delete process.env.ADMIN_NOTIFICATION_EMAIL;

    await sendNewConversationEmail({ id: 'conv-1', name: 'Visitor', email: 'visitor@example.com' });

    expect(mockSend).not.toHaveBeenCalled();
  });

  it('logs success and does not throw when Resend accepts the send', async () => {
    mockSend.mockResolvedValue({ ok: true, id: 'email-1' });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await sendNewConversationEmail({ id: 'conv-1', name: 'Visitor', email: 'visitor@example.com' });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'admin@dominicwokorach.me', subject: 'New live chat message' })
    );
    expect(logSpy).toHaveBeenCalledWith(
      '[email] sent',
      expect.objectContaining({ status: 'success', resendMessageId: 'email-1' })
    );
    logSpy.mockRestore();
  });

  it('logs the failure instead of silently swallowing a Resend error', async () => {
    mockSend.mockResolvedValue({ ok: false, error: 'domain_not_verified' });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await sendNewConversationEmail({ id: 'conv-1', name: 'Visitor', email: 'visitor@example.com' });

    expect(errorSpy).toHaveBeenCalledWith(
      '[email] provider request failed',
      expect.objectContaining({ status: 'failed', error: 'domain_not_verified' })
    );
    errorSpy.mockRestore();
  });
});
