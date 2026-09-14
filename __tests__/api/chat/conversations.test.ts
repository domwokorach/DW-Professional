import { GET, POST } from '@/app/api/chat/conversations/route';
import { db } from '@/lib/database/db';
import { makeRequest } from '../../../test/testRequest';
import { buildConversation, buildSession, buildUser } from '../../../test/factories';
import { authCookiesFor, clearMockAuthCookies } from '../../../test/testRequest';

jest.mock('@/lib/database/db');

describe('GET /api/chat/conversations', () => {
  afterEach(() => clearMockAuthCookies());

  it('requires admin auth', async () => {
    const request = makeRequest('http://localhost:3000/api/chat/conversations');

    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('returns conversations for an authenticated admin, filtered by status/search', async () => {
    const user = buildUser();
    const session = buildSession({ userId: user.id });
    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);
    await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

    const rows = [{ ...buildConversation({ status: 'OPEN' as never }), messages: [] }];
    (db.conversation.findMany as jest.Mock).mockResolvedValue(rows);

    const request = makeRequest('http://localhost:3000/api/chat/conversations', {
      searchParams: { status: 'open', search: 'jane' },
      cookies: await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id }),
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.conversations).toHaveLength(1);
    expect(db.conversation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'OPEN',
          OR: [
            { name: { contains: 'jane', mode: 'insensitive' } },
            { email: { contains: 'jane', mode: 'insensitive' } },
            { mobile: { contains: 'jane', mode: 'insensitive' } },
          ],
        }),
      })
    );
  });
});

describe('POST /api/chat/conversations', () => {
  it('is public and creates/resumes a conversation for a valid visitorId', async () => {
    (db.conversation.findFirst as jest.Mock).mockResolvedValue(null);
    const created = buildConversation({ visitorId: 'visitor-1' });
    (db.conversation.create as jest.Mock).mockResolvedValue(created);

    const request = makeRequest('http://localhost:3000/api/chat/conversations', {
      method: 'POST',
      body: { visitorId: 'visitor-1', name: 'Jane', email: 'jane@example.com' },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.conversation.visitorId).toBe('visitor-1');
  });

  it('resumes an existing OPEN/PENDING conversation instead of creating a new one', async () => {
    const existing = buildConversation({ visitorId: 'visitor-2' });
    (db.conversation.findFirst as jest.Mock).mockResolvedValue(existing);

    const request = makeRequest('http://localhost:3000/api/chat/conversations', {
      method: 'POST',
      body: { visitorId: 'visitor-2' },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.conversation.id).toBe(existing.id);
    expect(db.conversation.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid visitorId shape', async () => {
    const request = makeRequest('http://localhost:3000/api/chat/conversations', {
      method: 'POST',
      body: { visitorId: 'has spaces!' },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(db.conversation.findFirst).not.toHaveBeenCalled();
  });

  it('rejects a missing body entirely', async () => {
    const request = makeRequest('http://localhost:3000/api/chat/conversations', {
      method: 'POST',
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
