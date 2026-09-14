import { GET, PATCH } from '@/app/api/chat/conversations/[id]/route';
import { db } from '@/lib/database/db';
import { makeRequest, authCookiesFor, clearMockAuthCookies } from '../../../test/testRequest';
import { buildConversation, buildMessage, buildSession, buildUser } from '../../../test/factories';

jest.mock('@/lib/database/db');

function paramsFor(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function authAsAdmin() {
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
  return { user, session, cookies };
}

describe('GET /api/chat/conversations/[id]', () => {
  afterEach(() => clearMockAuthCookies());

  it('requires admin auth', async () => {
    const request = makeRequest('http://localhost:3000/api/chat/conversations/conv-1');

    const response = await GET(request, paramsFor('conv-1'));

    expect(response.status).toBe(401);
  });

  it('returns 404 for an unknown id', async () => {
    await authAsAdmin();
    (db.conversation.findUnique as jest.Mock).mockResolvedValue(null);

    const request = makeRequest('http://localhost:3000/api/chat/conversations/missing');
    const response = await GET(request, paramsFor('missing'));

    expect(response.status).toBe(404);
  });

  it('returns the conversation with messages and marks messages read as a side effect', async () => {
    await authAsAdmin();
    const conversation = buildConversation({ id: 'conv-1' });
    (db.conversation.findUnique as jest.Mock).mockResolvedValue(conversation);
    (db.message.findMany as jest.Mock).mockResolvedValue([buildMessage({ conversationId: 'conv-1' })]);
    (db.message.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    (db.conversation.update as jest.Mock).mockResolvedValue({});

    const request = makeRequest('http://localhost:3000/api/chat/conversations/conv-1');
    const response = await GET(request, paramsFor('conv-1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.conversation.id).toBe('conv-1');
    expect(body.conversation.messages).toHaveLength(1);
    // markAsRead('conv-1', 'admin') side effect:
    expect(db.message.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ conversationId: 'conv-1', sender: 'VISITOR' }) })
    );
    expect(db.conversation.update).toHaveBeenCalledWith({
      where: { id: 'conv-1' },
      data: { unreadByAdmin: 0 },
    });
  });
});

describe('PATCH /api/chat/conversations/[id]', () => {
  afterEach(() => clearMockAuthCookies());

  it('requires admin auth', async () => {
    const request = makeRequest('http://localhost:3000/api/chat/conversations/conv-1', {
      method: 'PATCH',
      body: { status: 'closed' },
    });

    const response = await PATCH(request, paramsFor('conv-1'));

    expect(response.status).toBe(401);
  });

  it('validates the body — rejects an empty patch', async () => {
    await authAsAdmin();

    const request = makeRequest('http://localhost:3000/api/chat/conversations/conv-1', {
      method: 'PATCH',
      body: {},
    });

    const response = await PATCH(request, paramsFor('conv-1'));

    expect(response.status).toBe(400);
    expect(db.conversation.update).not.toHaveBeenCalled();
  });

  // Status changes (close/reopen) now go over Socket.IO (`chat:set-status`,
  // src/lib/socket/server.ts) so they can broadcast to every connected admin
  // and the candidate live — a REST route can't reach the standalone socket
  // server, so this route no longer accepts a status field at all.
  it('validates the body — rejects a status-only patch (status is no longer accepted here)', async () => {
    await authAsAdmin();

    const request = makeRequest('http://localhost:3000/api/chat/conversations/conv-1', {
      method: 'PATCH',
      body: { status: 'closed' },
    });

    const response = await PATCH(request, paramsFor('conv-1'));

    expect(response.status).toBe(400);
    expect(db.conversation.update).not.toHaveBeenCalled();
  });

  it('updates unread via markUnread:true', async () => {
    await authAsAdmin();
    (db.conversation.update as jest.Mock).mockResolvedValue(buildConversation({ id: 'conv-1' }));

    const request = makeRequest('http://localhost:3000/api/chat/conversations/conv-1', {
      method: 'PATCH',
      body: { markUnread: true },
    });

    const response = await PATCH(request, paramsFor('conv-1'));

    expect(response.status).toBe(200);
    expect(db.conversation.update).toHaveBeenCalledWith({
      where: { id: 'conv-1' },
      data: { status: undefined, assignedAdminId: undefined, unreadByAdmin: 1 },
    });
  });
});
