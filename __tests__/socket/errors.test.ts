import { SessionExpiredError, ChatUnavailableError } from '@/lib/socket/errors';

describe('socket error types', () => {
  it('SessionExpiredError carries the right name/message and is a real Error', () => {
    const error = new SessionExpiredError();
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('SessionExpiredError');
    expect(error.message).toBe('Session expired');
  });

  it('ChatUnavailableError carries the right name/message and is a real Error', () => {
    const error = new ChatUnavailableError();
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ChatUnavailableError');
    expect(error.message).toBe('Unable to authenticate chat');
  });

  it('the two error types are distinguishable via instanceof', () => {
    const sessionError: Error = new SessionExpiredError();
    const unavailableError: Error = new ChatUnavailableError();
    expect(sessionError instanceof ChatUnavailableError).toBe(false);
    expect(unavailableError instanceof SessionExpiredError).toBe(false);
  });
});
