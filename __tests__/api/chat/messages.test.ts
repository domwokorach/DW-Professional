import { GET } from '@/app/api/chat/messages/route';
import { db } from '@/lib/database/db';
import { makeRequest, authCookiesFor, clearMockAuthCookies } from '../../../test/testRequest';
import { buildConversation, buildMessage, buildSession, buildUser } from '../../../test/factories';

jest.mock('@/lib/database/db');

describe('GET /api/chat/messages', () => {
  afterEach(() => clearMockAuthCookies());

  it('requires a conversationId query param', async () => {
    const request = makeRequest('http://localhost:3000/api/chat/messages');

    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it('returns 404 when the conversation does not exist', async () => {
    (db.conversation.findUnique as jest.Mock).mockResolvedValue(null);

    const request = makeRequest('http://localhost:3000/api/chat/messages', {
      searchParams: { conversationId: 'missing', visitorId: 'visitor-1' },
    });

    const response = await GET(request);

    expect(response.status).toBe(404);
  });

  // Centerpiece security test: the REST layer's authorization for a visitor
  // is a plain string comparison against a client-supplied visitorId — there
  // is no cryptographic binding at this layer (unlike the socket layer's
  // signed liveChatAuth token). This proves both halves of that model.
  it('rejects a visitor supplying the WRONG visitorId for a real conversationId', async () => {
    const conversation = buildConversation({ id: 'conv-1', visitorId: 'real-visitor' });
    (db.conversation.findUnique as jest.Mock).mockResolvedValue(conversation);

    const request = makeRequest('http://localhost:3000/api/chat/messages', {
      searchParams: { conversationId: 'conv-1', visitorId: 'attacker-visitor' },
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Not found');
    expect(db.message.findMany).not.toHaveBeenCalled();
  });

  it('accepts a visitor supplying the CORRECT visitorId for their own conversation', async () => {
    const conversation = buildConversation({ id: 'conv-1', visitorId: 'real-visitor' });
    (db.conversation.findUnique as jest.Mock).mockResolvedValue(conversation);
    (db.message.findMany as jest.Mock).mockResolvedValue([buildMessage({ conversationId: 'conv-1' })]);

    const request = makeRequest('http://localhost:3000/api/chat/messages', {
      searchParams: { conversationId: 'conv-1', visitorId: 'real-visitor' },
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.messages).toHaveLength(1);
  });

  it('allows an authenticated admin to read any conversation regardless of visitorId', async () => {
    const user = buildUser();
    const session = buildSession({ userId: user.id });
    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);
    await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

    const conversation = buildConversation({ id: 'conv-1', visitorId: 'some-visitor' });
    (db.conversation.findUnique as jest.Mock).mockResolvedValue(conversation);
    (db.message.findMany as jest.Mock).mockResolvedValue([]);

    const request = makeRequest('http://localhost:3000/api/chat/messages', {
      searchParams: { conversationId: 'conv-1' },
      cookies: await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id }),
    });

    const response = await GET(request);

    expect(response.status).toBe(200);
  });
});
