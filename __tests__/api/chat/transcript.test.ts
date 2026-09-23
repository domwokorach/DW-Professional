jest.mock('@/lib/database/db');

import { GET } from '@/app/api/chat/conversations/[id]/transcript/route';
import { db } from '@/lib/database/db';
import { makeRequest, authCookiesFor, clearMockAuthCookies } from '../../../test/testRequest';
import { buildConversation, buildMessage, buildSession, buildUser } from '../../../test/factories';

function paramsFor(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('GET /api/chat/conversations/[id]/transcript', () => {
  afterEach(() => clearMockAuthCookies());

  it('returns 404 for a visitor who does not own the conversation', async () => {
    (db.conversation.findUnique as jest.Mock).mockResolvedValue(
      buildConversation({ id: 'conv-1', visitorId: 'real-visitor' })
    );

    const request = makeRequest('http://localhost:3000/api/chat/conversations/conv-1/transcript', {
      searchParams: { visitorId: 'attacker-visitor' },
    });

    const response = await GET(request, paramsFor('conv-1'));
    expect(response.status).toBe(404);
  });

  it('returns a downloadable text transcript for the owning visitor, including messages and attachment references', async () => {
    const conversation = buildConversation({ id: 'conv-1', name: 'Amara Chen', visitorId: 'visitor-1' });
    (db.conversation.findUnique as jest.Mock).mockResolvedValue(conversation);
    (db.message.findMany as jest.Mock).mockResolvedValue([
      buildMessage({ conversationId: 'conv-1', sender: 'VISITOR', content: 'Hi there' }),
      {
        ...buildMessage({ conversationId: 'conv-1', sender: 'ADMIN', content: 'Here is the file' }),
        attachments: [{ id: 'att-1', originalName: 'report.pdf', storageKey: 'x', mimeType: 'application/pdf', size: 1 }],
      },
    ]);

    const request = makeRequest('http://localhost:3000/api/chat/conversations/conv-1/transcript', {
      searchParams: { visitorId: conversation.visitorId },
    });

    const response = await GET(request, paramsFor('conv-1'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-disposition')).toContain('attachment; filename="conversation-conv-1.txt"');

    const body = await response.text();
    expect(body).toContain('Conversation ID: conv-1');
    expect(body).toContain('Amara Chen');
    expect(body).toContain('Hi there');
    expect(body).toContain('[Attachment: report.pdf]');
  });

  it('is also accessible to an authenticated admin regardless of visitorId', async () => {
    const user = buildUser();
    const session = buildSession({ userId: user.id });
    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);
    await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

    (db.conversation.findUnique as jest.Mock).mockResolvedValue(buildConversation({ id: 'conv-1' }));
    (db.message.findMany as jest.Mock).mockResolvedValue([]);

    const request = makeRequest('http://localhost:3000/api/chat/conversations/conv-1/transcript');
    const response = await GET(request, paramsFor('conv-1'));
    expect(response.status).toBe(200);
  });
});
