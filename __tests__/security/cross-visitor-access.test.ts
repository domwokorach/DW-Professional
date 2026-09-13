import { GET } from '@/app/api/chat/messages/route';
import { db } from '@/lib/database/db';
import { makeRequest } from '../../test/testRequest';
import { buildConversation, buildMessage } from '../../test/factories';

jest.mock('@/lib/database/db');

/**
 * Security regression, restated deliberately even though __tests__/api/chat
 * also covers the same route: a visitor must not be able to read another
 * visitor's conversation by guessing/reusing a conversationId and supplying
 * an arbitrary visitorId. The REST layer's authorization
 * (canAccessConversation) is a plain string comparison against a
 * client-supplied visitorId with no cryptographic binding — this is weaker
 * than the socket layer, where visitorId/conversationId are bound inside a
 * signed liveChatAuth token the client cannot forge. See the "known app-code
 * gap" note in the final report.
 */
describe('security: a visitor cannot read another visitor\'s conversation via GET /api/chat/messages', () => {
  it('returns 404 (not the real messages) when visitorId does not match the conversation owner', async () => {
    const victimConversation = buildConversation({ id: 'victim-conv', visitorId: 'victim-visitor' });
    (db.conversation.findUnique as jest.Mock).mockResolvedValue(victimConversation);
    (db.message.findMany as jest.Mock).mockResolvedValue([
      buildMessage({ conversationId: 'victim-conv', content: 'This is private' }),
    ]);

    const request = makeRequest('http://localhost:3000/api/chat/messages', {
      searchParams: { conversationId: 'victim-conv', visitorId: 'attacker-visitor' },
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(JSON.stringify(body)).not.toContain('This is private');
    expect(db.message.findMany).not.toHaveBeenCalled();
  });

  it('returns 404 when no visitorId is supplied at all (and no admin session)', async () => {
    const victimConversation = buildConversation({ id: 'victim-conv-2', visitorId: 'victim-visitor' });
    (db.conversation.findUnique as jest.Mock).mockResolvedValue(victimConversation);

    const request = makeRequest('http://localhost:3000/api/chat/messages', {
      searchParams: { conversationId: 'victim-conv-2' },
    });

    const response = await GET(request);

    expect(response.status).toBe(404);
  });

  it('succeeds only when the correct visitorId is supplied', async () => {
    const conversation = buildConversation({ id: 'own-conv', visitorId: 'owner-visitor' });
    (db.conversation.findUnique as jest.Mock).mockResolvedValue(conversation);
    (db.message.findMany as jest.Mock).mockResolvedValue([
      buildMessage({ conversationId: 'own-conv', content: 'My own message' }),
    ]);

    const request = makeRequest('http://localhost:3000/api/chat/messages', {
      searchParams: { conversationId: 'own-conv', visitorId: 'owner-visitor' },
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.messages[0].content).toBe('My own message');
  });
});
