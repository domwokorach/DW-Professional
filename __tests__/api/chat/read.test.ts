import { POST } from '@/app/api/chat/read/route';
import { db } from '@/lib/database/db';
import { makeRequest, authCookiesFor, clearMockAuthCookies } from '../../../test/testRequest';
import { buildSession, buildUser, buildConversation } from '../../../test/factories';

jest.mock('@/lib/database/db');

describe('POST /api/chat/read', () => {
  afterEach(() => clearMockAuthCookies());

  it('rejects a body missing conversationId/reader', async () => {
    const request = makeRequest('http://localhost:3000/api/chat/read', {
      method: 'POST',
      body: {},
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  describe('admin branch', () => {
    it('requires admin auth', async () => {
      const request = makeRequest('http://localhost:3000/api/chat/read', {
        method: 'POST',
        body: { conversationId: 'conv-1', reader: 'admin' },
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('marks messages read when authenticated', async () => {
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
      (db.message.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (db.conversation.update as jest.Mock).mockResolvedValue({});

      const request = makeRequest('http://localhost:3000/api/chat/read', {
        method: 'POST',
        body: { conversationId: 'conv-1', reader: 'admin' },
        cookies,
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(db.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: { unreadByAdmin: 0 },
      });
    });
  });

  describe('visitor branch', () => {
    it('requires a visitorId in the body', async () => {
      const request = makeRequest('http://localhost:3000/api/chat/read', {
        method: 'POST',
        body: { conversationId: 'conv-1', reader: 'visitor' },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('rejects a visitor trying to read another conversation', async () => {
      (db.conversation.findUnique as jest.Mock).mockResolvedValue(buildConversation({ id: 'conv-1', visitorId: 'owner' }));

      const request = makeRequest('http://localhost:3000/api/chat/read', {
        method: 'POST',
        body: { conversationId: 'conv-1', reader: 'visitor', visitorId: 'not-the-real-visitor' },
      });

      const response = await POST(request);

      expect(response.status).toBe(404);
      expect(db.conversation.findUnique).toHaveBeenCalled();
      expect(db.conversation.update).not.toHaveBeenCalled();
    });
  });
});
