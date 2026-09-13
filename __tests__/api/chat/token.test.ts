import { POST } from '@/app/api/chat/token/route';
import { db } from '@/lib/database/db';
import { verifyLiveChatToken } from '@/lib/liveChatAuth';
import { makeRequest, authCookiesFor, clearMockAuthCookies } from '../../../test/testRequest';
import { buildConversation, buildSession, buildUser } from '../../../test/factories';

jest.mock('@/lib/database/db');

const SECRET = process.env.SOCKET_SECRET as string;

describe('POST /api/chat/token', () => {
  afterEach(() => clearMockAuthCookies());

  it('issues an admin-scoped token for an authenticated admin session', async () => {
    const user = buildUser();
    const session = buildSession({ userId: user.id });
    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);
    const cookies = await authCookiesFor({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    });

    const request = makeRequest('http://localhost:3000/api/chat/token', {
      method: 'POST',
      body: {},
      cookies,
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    const claims = verifyLiveChatToken(body.token, SECRET);
    expect(claims).toEqual({ role: 'admin', adminId: user.id });
  });

  it('returns 401 (not 400) when body requests {role:"admin"} while unauthenticated', async () => {
    const request = makeRequest('http://localhost:3000/api/chat/token', {
      method: 'POST',
      body: { role: 'admin' },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Not authorized');
  });

  it('issues a visitor-scoped token bound to a conversation for a valid visitorId with no admin session', async () => {
    (db.conversation.findFirst as jest.Mock).mockResolvedValue(null);
    const created = buildConversation({ id: 'conv-1', visitorId: 'visitor-1' });
    (db.conversation.create as jest.Mock).mockResolvedValue(created);

    const request = makeRequest('http://localhost:3000/api/chat/token', {
      method: 'POST',
      body: { visitorId: 'visitor-1' },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    const claims = verifyLiveChatToken(body.token, SECRET);
    expect(claims).toEqual({ role: 'visitor', visitorId: 'visitor-1', conversationId: 'conv-1' });
  });

  it('returns 400 for a missing visitorId', async () => {
    const request = makeRequest('http://localhost:3000/api/chat/token', {
      method: 'POST',
      body: {},
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 for a malformed visitorId', async () => {
    const request = makeRequest('http://localhost:3000/api/chat/token', {
      method: 'POST',
      body: { visitorId: 'has spaces!' },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 503 when SOCKET_SECRET is unset', async () => {
    const original = process.env.SOCKET_SECRET;
    delete process.env.SOCKET_SECRET;

    try {
      const request = makeRequest('http://localhost:3000/api/chat/token', {
        method: 'POST',
        body: { visitorId: 'visitor-1' },
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(503);
      expect(body.error).toBe('Live chat is not configured');
    } finally {
      process.env.SOCKET_SECRET = original;
    }
  });
});
