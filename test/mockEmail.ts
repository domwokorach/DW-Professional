import type { sendTemplateEmail } from '@/lib/email/mailer';

/**
 * Every test file that exercises a route calling sendTemplateEmail must put
 * `jest.mock('@/lib/email/mailer')` directly at its own top level (NOT via a
 * helper call) — babel-plugin-jest-hoist only hoists a literal `jest.mock(...)`
 * call written in the test file itself above the file's imports; hiding it
 * inside an imported function would run too late and let the real mailer
 * (Resend + react-email render) load first.
 *
 * Once that direct call is in place, use this to get a typed handle on the
 * auto-mock without re-typing the cast in every test file:
 *   jest.mock('@/lib/email/mailer');
 *   const mockedSendTemplateEmail = getMockedSendTemplateEmail();
 */
export function getMockedSendTemplateEmail() {
  const mailer = jest.requireMock('@/lib/email/mailer') as {
    sendTemplateEmail: jest.MockedFunction<typeof sendTemplateEmail>;
  };
  mailer.sendTemplateEmail.mockResolvedValue(undefined);
  return mailer.sendTemplateEmail;
}
