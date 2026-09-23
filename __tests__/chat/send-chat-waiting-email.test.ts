jest.mock('@/services/email/resend.provider', () => ({
  resendProvider: { send: jest.fn() },
}));

// Real rendering pulls in @react-email/render's dynamic import(), which Jest
// can't resolve without --experimental-vm-modules — irrelevant to what this
// suite is testing (recipient resolution, subject copy, error handling).
jest.mock('@react-email/components', () => ({
  render: jest.fn().mockResolvedValue('<html></html>'),
}));

import { resendProvider } from '@/services/email/resend.provider';
import { sendNewConversationEmail, sendChatWaitingReminderEmail } from '@/lib/notifications/email';

const mockSend = resendProvider.send as jest.MockedFunction<typeof resendProvider.send>;

describe('sendNewConversationEmail / sendChatWaitingReminderEmail', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, CONTACT_TO_EMAIL: 'admin@dominicwokorach.me' };
    delete process.env.ADMIN_NOTIFICATION_EMAIL;
    delete process.env.ADMIN_EMAILS;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  // Regression test: the env var was previously read once at module load
  // (`const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL`)
  // and only checked ADMIN_NOTIFICATION_EMAIL, which this project's env
  // never sets (it sets CONTACT_TO_EMAIL instead) — so chat waiting emails
  // silently never sent, in production or in a fresh module import here.
  it('does nothing and logs when no admin recipient env var is configured', async () => {
    delete process.env.CONTACT_TO_EMAIL;
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await sendNewConversationEmail({ id: 'conv-1', name: 'Visitor', email: 'visitor@example.com' });

    expect(mockSend).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Missing required environment variable'));
    errorSpy.mockRestore();
  });

  it('falls back to ADMIN_NOTIFICATION_EMAIL when CONTACT_TO_EMAIL is unset', async () => {
    delete process.env.CONTACT_TO_EMAIL;
    process.env.ADMIN_NOTIFICATION_EMAIL = 'fallback@dominicwokorach.me';
    mockSend.mockResolvedValue({ ok: true, id: 'email-2' });

    await sendNewConversationEmail({ id: 'conv-1', name: 'Visitor', email: 'visitor@example.com' });

    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ to: 'fallback@dominicwokorach.me' }));
  });

  it('sends the initial-notification email to the configured admin address', async () => {
    mockSend.mockResolvedValue({ ok: true, id: 'email-1' });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await sendNewConversationEmail({ id: 'conv-1', name: 'Visitor', email: 'visitor@example.com' });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'admin@dominicwokorach.me', subject: 'New candidate waiting in Live Chat' })
    );
    expect(logSpy).toHaveBeenCalledWith(
      '[email] sent',
      expect.objectContaining({ status: 'success', resendMessageId: 'email-1', isReminder: false })
    );
    logSpy.mockRestore();
  });

  it('sends the reminder email with reminder-specific subject copy', async () => {
    mockSend.mockResolvedValue({ ok: true, id: 'email-3' });

    await sendChatWaitingReminderEmail({ id: 'conv-1', name: 'Visitor', email: 'visitor@example.com' });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'admin@dominicwokorach.me', subject: 'Still waiting: Visitor in Live Chat' })
    );
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
