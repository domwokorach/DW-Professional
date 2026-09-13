import { GET } from '@/app/api/admin/security-events/route';
import { db } from '@/lib/database/db';
import { buildUser, buildSession, buildSecurityEvent } from '../../../test/factories';
import { authCookiesFor, clearMockAuthCookies } from '../../../test/testRequest';

jest.mock('@/lib/database/db');

describe('GET /api/admin/security-events', () => {
  afterEach(() => clearMockAuthCookies());
  afterEach(() => jest.clearAllMocks());

  it('returns 401 when there is no session', async () => {
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("returns only the requesting user's last 20 events, mapped to id/type/ipAddress/createdAt only", async () => {
    const user = buildUser();
    const session = buildSession({ userId: user.id });
    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);

    const event = buildSecurityEvent({
      userId: user.id,
      type: 'SIGN_IN',
      ipAddress: '10.0.0.1',
      userAgent: 'super-secret-user-agent-should-not-leak',
      metadata: { secretDetail: 'should-not-leak' },
    });
    (db.securityEvent.findMany as jest.Mock).mockResolvedValue([event]);

    await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(db.securityEvent.findMany).toHaveBeenCalledWith({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    expect(body.events).toHaveLength(1);
    expect(body.events[0]).toEqual({
      id: event.id,
      type: event.type,
      ipAddress: event.ipAddress,
      createdAt: event.createdAt.toISOString(),
    });
    expect(JSON.stringify(body)).not.toContain('should-not-leak');
    expect(JSON.stringify(body)).not.toContain('super-secret-user-agent-should-not-leak');
  });
});
