import type * as EmailService from '@/services/email/email.service';

type MockedEmailService = {
  [K in keyof typeof EmailService]: jest.MockedFunction<(typeof EmailService)[K]>;
};

/**
 * Every test file that exercises a route calling a src/services/email/email.service
 * function must put `jest.mock('@/services/email/email.service')` directly at its own
 * top level (NOT via a helper call) — babel-plugin-jest-hoist only hoists a literal
 * `jest.mock(...)` call written in the test file itself above the file's imports; hiding
 * it inside an imported function would run too late and let the real service (Resend +
 * react-email render) load first.
 *
 * Once that direct call is in place, use this to get a typed handle on the auto-mock
 * without re-typing the cast in every test file:
 *   jest.mock('@/services/email/email.service');
 *   const mockedEmailService = getMockedEmailService();
 */
export function getMockedEmailService(): MockedEmailService {
  const service = jest.requireMock('@/services/email/email.service') as MockedEmailService;
  for (const fn of Object.values(service)) {
    if (typeof fn === 'function' && 'mockResolvedValue' in fn) {
      fn.mockResolvedValue({ ok: true, id: 'test-email-id' });
    }
  }
  return service;
}
