import { logSecurityEvent } from '@/lib/auth/securityEvents';
import { db } from '@/lib/database/db';

jest.mock('@/lib/database/db');

describe('logSecurityEvent', () => {
  it('creates a security event with all fields provided', async () => {
    await logSecurityEvent({
      userId: 'user_1',
      type: 'SIGN_IN',
      sessionId: 'session_1',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      metadata: { foo: 'bar' },
    });

    expect(db.securityEvent.create).toHaveBeenCalledWith({
      data: {
        userId: 'user_1',
        type: 'SIGN_IN',
        sessionId: 'session_1',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        metadata: { foo: 'bar' },
      },
    });
  });

  it('defaults sessionId/ipAddress/userAgent to null and metadata to undefined when omitted', async () => {
    await logSecurityEvent({
      userId: 'user_2',
      type: 'SIGN_OUT',
    });

    expect(db.securityEvent.create).toHaveBeenCalledWith({
      data: {
        userId: 'user_2',
        type: 'SIGN_OUT',
        sessionId: null,
        ipAddress: null,
        userAgent: null,
        metadata: undefined,
      },
    });
  });
});
