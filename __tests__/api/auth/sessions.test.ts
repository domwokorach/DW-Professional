import { GET } from '@/app/api/auth/sessions/route';
import { db } from '@/lib/database/db';
import { buildUser, buildSession } from '../../../test/factories';
import { authCookiesFor, clearMockAuthCookies } from '../../../test/testRequest';

jest.mock('@/lib/database/db');

describe('GET /api/auth/sessions', () => {
  afterEach(() => clearMockAuthCookies());
  afterEach(() => jest.clearAllMocks());

  it('returns 401 when there is no session', async () => {
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("returns only the requesting user's own sessions, marking the matching one isCurrent", async () => {
    const user = buildUser();
    const currentSession = buildSession({ userId: user.id });
    const otherDeviceSession = buildSession({ userId: user.id });

    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.session.findUnique as jest.Mock).mockResolvedValue(currentSession);
    (db.session.findMany as jest.Mock).mockResolvedValue([currentSession, otherDeviceSession]);

    await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: currentSession.id });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(db.session.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: user.id, revokedAt: null, expiresAt: { gt: expect.any(Date) } },
      })
    );

    expect(body.sessions).toHaveLength(2);
    const current = body.sessions.find((s: { id: string }) => s.id === currentSession.id);
    const other = body.sessions.find((s: { id: string }) => s.id === otherDeviceSession.id);
    expect(current.isCurrent).toBe(true);
    expect(other.isCurrent).toBe(false);
  });
});
