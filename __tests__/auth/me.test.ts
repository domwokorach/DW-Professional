import { GET } from '@/app/api/auth/me/route';
import { db } from '@/lib/database/db';
import { buildUser, buildSession } from '../../test/factories';
import { authCookiesFor, clearMockAuthCookies } from '../../test/testRequest';

jest.mock('@/lib/database/db');

describe('GET /api/auth/me', () => {
  afterEach(() => clearMockAuthCookies());

  it('returns 401 when there is no admin_at cookie', async () => {
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('returns the current admin user without the password hash', async () => {
    const user = buildUser({ passwordHash: 'super-secret-hash' });
    const session = buildSession({ userId: user.id });

    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);

    await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.user.id).toBe(user.id);
    expect(body.user.email).toBe(user.email);
    expect(body).not.toHaveProperty('user.passwordHash');
    expect(JSON.stringify(body)).not.toContain('super-secret-hash');
  });
});
