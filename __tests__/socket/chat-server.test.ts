import { createServer, type Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import { attachChatHandlers } from '@/lib/socket/server';
import { createLiveChatToken } from '@/lib/liveChatAuth';
import { db } from '@/lib/database/db';
import { setAdminOnline, setAdminOffline } from '@/lib/redis/presence';
import { buildConversation, buildMessage } from '../../test/factories';

jest.mock('@/lib/database/db');
jest.mock('@/lib/notifications/email', () => ({
  sendNewConversationEmail: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/portfolioAssistant/match', () => ({
  matchIntent: jest.fn().mockReturnValue('greeting'),
}));
jest.mock('@/lib/portfolioAssistant/responses', () => ({
  getResponseForIntent: jest.fn().mockReturnValue({ content: 'Canned bot reply', actions: [] }),
}));

const SECRET = process.env.SOCKET_SECRET as string;

jest.setTimeout(15000);

function once<T = unknown>(socket: ClientSocket, event: string): Promise<T> {
  return new Promise((resolve) => {
    socket.once(event, (payload: T) => resolve(payload));
  });
}

describe('chat socket server', () => {
  let httpServer: HttpServer;
  let io: Server;
  let port: number;
  const clients: ClientSocket[] = [];

  beforeAll(async () => {
    httpServer = createServer();
    io = new Server(httpServer, { cors: { origin: '*' } });
    attachChatHandlers(io);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => resolve());
    });
    const address = httpServer.address();
    port = typeof address === 'object' && address ? address.port : 0;
  });

  afterEach(async () => {
    for (const client of clients) {
      if (client.connected) client.disconnect();
    }
    clients.length = 0;
    // Give the server's own "disconnect" handlers (which are async — they
    // update presence state) a moment to finish before the next test reads
    // that same in-memory presence map.
    await new Promise((resolve) => setTimeout(resolve, 150));
  });

  afterAll(async () => {
    io.close();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  function connectClient(token: string): ClientSocket {
    const client = ioClient(`http://localhost:${port}`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: false,
      forceNew: true,
    });
    clients.push(client);
    return client;
  }

  function visitorToken(conversationId: string, visitorId = `visitor-${Math.random().toString(36).slice(2)}`) {
    return createLiveChatToken({ role: 'visitor', visitorId, conversationId }, SECRET);
  }

  function adminToken(adminId = `admin-${Math.random().toString(36).slice(2)}`) {
    return createLiveChatToken({ role: 'admin', adminId }, SECRET);
  }

  beforeEach(async () => {
    (db.conversation.findUnique as jest.Mock).mockImplementation(async (args: { where: { id: string } }) =>
      buildConversation({ id: args.where.id })
    );
    // Dedup check (sendMessage) and delivered-status update: default to "no
    // existing clientMessageId" / "not assigned yet" so tests that don't
    // care about these paths aren't affected by them.
    (db.message.findUnique as jest.Mock).mockResolvedValue(null);
    (db.message.update as jest.Mock).mockResolvedValue({});
    (db.conversation.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
    // Aggregate presence now combines connectivity (real in-memory presence
    // map) with each admin's manually-selected availability (User.availability,
    // Postgres). Default every connected admin id to "ONLINE" so existing
    // tests — which are about connectivity, not the availability feature —
    // keep seeing the same online/offline behaviour as before.
    (db.user.findMany as jest.Mock).mockImplementation(
      async (args: { where: { id: { in: string[] } } }) =>
        args.where.id.in.map((id) => ({ id, availability: 'ONLINE' }))
    );
    // Keep a control admin "online" (via the real in-memory presence map) by
    // default so tests that aren't specifically about the no-admin-online
    // bot fallback don't accidentally trigger it — that path has its own
    // real setTimeout delay (500-1000ms) that would otherwise run unawaited
    // past the end of an unrelated test and crash once db mocks reset.
    await setAdminOnline('control-admin');
  });

  afterEach(async () => {
    await setAdminOffline('control-admin');
  });

  it('rejects a connection with an invalid/garbage token', async () => {
    const client = connectClient('not-a-real-token');

    const error = await once<Error>(client, 'connect_error');

    expect(error.message).toBe('Unauthorized');
  });

  it('rejects a connection with an expired token', async () => {
    // Build a token whose baked-in expiry is already in the past by signing
    // with a fake "now" far enough back that TTL (5 min) has elapsed.
    const claims = { role: 'visitor' as const, visitorId: 'visitor-expired', conversationId: 'conv-expired' };
    const pastExpiresAt = Date.now() - 10 * 60 * 1000;
    const payload = `${JSON.stringify(claims)}.${pastExpiresAt}`;
    const { createHmac } = await import('node:crypto');
    const signature = createHmac('sha256', SECRET).update(payload).digest('hex');
    const expiredToken = `${Buffer.from(payload).toString('base64url')}.${signature}`;

    const client = connectClient(expiredToken);

    const error = await once<Error>(client, 'connect_error');

    expect(error.message).toBe('Unauthorized');
  });

  it('admin connects with a valid token and joins the admin room (receives an admin-room broadcast)', async () => {
    const conversation = buildConversation({ id: 'conv-admin-room' });
    (db.conversation.findUnique as jest.Mock).mockResolvedValue(conversation);
    (db.message.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
    (db.conversation.update as jest.Mock).mockResolvedValue({});

    const admin = connectClient(adminToken());
    await once(admin, 'connect');

    // Trigger a chat:read from a second (visitor) socket bound to the same
    // conversation; the resulting chat:conversation-updated is broadcast to
    // ADMIN_ROOM, proving the admin actually joined that room.
    const visitor = connectClient(visitorToken('conv-admin-room'));
    await once(visitor, 'connect');

    const updatedPromise = once(admin, 'chat:conversation-updated');
    visitor.emit('chat:read', { conversationId: 'conv-admin-room', reader: 'visitor' });

    const payload = await updatedPromise;
    expect(payload).toEqual({ conversation: expect.objectContaining({ id: 'conv-admin-room' }) });
  });

  it('visitor auto-joins their own conversation room; a message is persisted and broadcast to that room but not another conversation room', async () => {
    const conversationId = 'conv-isolation-a';
    const otherConversationId = 'conv-isolation-b';

    const created = buildMessage({ conversationId, sender: 'VISITOR', content: 'Hello from A' });
    (db.message.create as jest.Mock).mockResolvedValue(created);
    (db.conversation.update as jest.Mock).mockResolvedValue({});
    (db.conversation.findUnique as jest.Mock).mockImplementation(async (args: { where: { id: string } }) =>
      buildConversation({ id: args.where.id })
    );

    const visitorA = connectClient(visitorToken(conversationId));
    await once(visitorA, 'connect');
    const visitorB = connectClient(visitorToken(otherConversationId));
    await once(visitorB, 'connect');

    let receivedByB = false;
    visitorB.on('chat:message', () => {
      receivedByB = true;
    });

    const messagePromise = once<{ message: { content: string } }>(visitorA, 'chat:message');
    visitorA.emit('chat:message', { conversationId, content: 'Hello from A' });

    const received = await messagePromise;
    expect(received.message.content).toBe('Hello from A');
    expect(db.message.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ conversationId, sender: 'VISITOR', content: 'Hello from A' }) })
    );

    // Give any stray cross-room broadcast a moment to arrive before asserting it didn't.
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(receivedByB).toBe(false);
  });

  it('admin sends chat:reply and it is broadcast to the conversation room', async () => {
    const conversationId = 'conv-reply-1';
    const created = buildMessage({ conversationId, sender: 'ADMIN', content: 'Hi, how can I help?' });
    (db.message.create as jest.Mock).mockResolvedValue(created);
    (db.conversation.update as jest.Mock).mockResolvedValue({});
    (db.conversation.findUnique as jest.Mock).mockImplementation(async (args: { where: { id: string } }) =>
      buildConversation({ id: args.where.id })
    );

    const visitor = connectClient(visitorToken(conversationId));
    await once(visitor, 'connect');
    const admin = connectClient(adminToken());
    await once(admin, 'connect');

    const messagePromise = once<{ message: { content: string; sender: string } }>(visitor, 'chat:message');
    admin.emit('chat:reply', { conversationId, content: 'Hi, how can I help?' });

    const received = await messagePromise;
    expect(received.message.content).toBe('Hi, how can I help?');
  });

  it('chat:typing / chat:stop-typing broadcast to the other party but not back to the sender', async () => {
    const conversationId = 'conv-typing-1';

    const visitor = connectClient(visitorToken(conversationId));
    await once(visitor, 'connect');
    const admin = connectClient(adminToken());
    await once(admin, 'connect');
    // Admin explicitly joins this conversation room (admins may follow any conversation).
    admin.emit('chat:join', { conversationId });
    await new Promise((resolve) => setTimeout(resolve, 100));

    let visitorReceivedOwnTyping = false;
    visitor.on('chat:typing', () => {
      visitorReceivedOwnTyping = true;
    });

    const adminTypingPromise = once<{ sender: string; isTyping: boolean }>(admin, 'chat:typing');
    visitor.emit('chat:typing', { conversationId });

    const adminSawTyping = await adminTypingPromise;
    expect(adminSawTyping).toEqual({ conversationId, sender: 'visitor', isTyping: true });

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(visitorReceivedOwnTyping).toBe(false);

    const visitorStopPromise = once<{ sender: string; isTyping: boolean }>(visitor, 'chat:typing');
    admin.emit('chat:stop-typing', { conversationId });

    const visitorSawStop = await visitorStopPromise;
    expect(visitorSawStop).toEqual({ conversationId, sender: 'admin', isTyping: false });
  });

  it('chat:join lets a visitor join only their own token-bound conversationId', async () => {
    const ownConversationId = 'conv-join-own';
    const otherConversationId = 'conv-join-other';

    const created = buildMessage({ conversationId: otherConversationId, sender: 'ADMIN', content: 'Reply in other room' });
    (db.message.create as jest.Mock).mockResolvedValue(created);
    (db.conversation.update as jest.Mock).mockResolvedValue({});
    (db.conversation.findUnique as jest.Mock).mockImplementation(async (args: { where: { id: string } }) =>
      buildConversation({ id: args.where.id })
    );

    const visitor = connectClient(visitorToken(ownConversationId));
    await once(visitor, 'connect');

    // Attempt to join a different conversation than the one baked into the token.
    visitor.emit('chat:join', { conversationId: otherConversationId });
    await new Promise((resolve) => setTimeout(resolve, 100));

    let receivedOtherRoomMessage = false;
    visitor.on('chat:message', () => {
      receivedOtherRoomMessage = true;
    });

    // An admin replies in the OTHER conversation's room; if the join above
    // had actually taken effect, the visitor would receive this broadcast.
    const admin = connectClient(adminToken());
    await once(admin, 'connect');
    admin.emit('chat:reply', { conversationId: otherConversationId, content: 'Reply in other room' });

    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(receivedOtherRoomMessage).toBe(false);
  });

  it('an admin can join any conversation room via chat:join', async () => {
    const conversationId = 'conv-admin-join';
    const created = buildMessage({ conversationId, sender: 'VISITOR', content: 'Visitor message' });
    (db.message.create as jest.Mock).mockResolvedValue(created);
    (db.conversation.update as jest.Mock).mockResolvedValue({});
    (db.conversation.findUnique as jest.Mock).mockImplementation(async (args: { where: { id: string } }) =>
      buildConversation({ id: args.where.id })
    );

    const admin = connectClient(adminToken());
    await once(admin, 'connect');
    admin.emit('chat:join', { conversationId });
    await new Promise((resolve) => setTimeout(resolve, 100));

    const visitor = connectClient(visitorToken(conversationId));
    await once(visitor, 'connect');

    const messagePromise = once<{ message: { content: string } }>(admin, 'chat:message');
    visitor.emit('chat:message', { conversationId, content: 'Visitor message' });

    const received = await messagePromise;
    expect(received.message.content).toBe('Visitor message');
  });

  it('chat:read triggers a chat:conversation-updated broadcast to the admin room', async () => {
    const conversationId = 'conv-read-1';
    (db.message.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    (db.conversation.update as jest.Mock).mockResolvedValue({});
    (db.conversation.findUnique as jest.Mock).mockResolvedValue(buildConversation({ id: conversationId }));

    const admin = connectClient(adminToken());
    await once(admin, 'connect');
    const visitor = connectClient(visitorToken(conversationId));
    await once(visitor, 'connect');

    const updatedPromise = once<{ conversation: { id: string } }>(admin, 'chat:conversation-updated');
    visitor.emit('chat:read', { conversationId, reader: 'visitor' });

    const payload = await updatedPromise;
    expect(payload.conversation.id).toBe(conversationId);
  });

  it('falls back to a bot reply when no admin is online', async () => {
    // Override the beforeEach default: this test is specifically about the
    // no-admin-online path.
    await setAdminOffline('control-admin');

    const conversationId = 'conv-bot-1';
    const visitorMessage = buildMessage({ conversationId, sender: 'VISITOR', content: 'Hi bot' });
    const botMessage = buildMessage({ conversationId, sender: 'BOT' as never, content: 'Canned bot reply' });

    (db.message.create as jest.Mock)
      .mockResolvedValueOnce(visitorMessage)
      .mockResolvedValueOnce(botMessage);
    (db.conversation.update as jest.Mock).mockResolvedValue({});
    (db.conversation.findUnique as jest.Mock).mockResolvedValue(buildConversation({ id: conversationId }));

    const visitor = connectClient(visitorToken(conversationId));
    await once(visitor, 'connect');

    const messages: { message: { sender: string; content: string } }[] = [];
    visitor.on('chat:message', (payload: { message: { sender: string; content: string } }) => {
      messages.push(payload);
    });

    visitor.emit('chat:message', { conversationId, content: 'Hi bot' });

    // Real bot-reply delay is 500-1000ms; allow generous margin.
    await new Promise((resolve) => setTimeout(resolve, 1500));

    expect(messages.some((m) => m.message.content === 'Canned bot reply')).toBe(true);
    expect(db.message.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sender: 'BOT', content: 'Canned bot reply' }) })
    );
  });

  it('dedupes on clientMessageId: sending the same clientMessageId twice persists and broadcasts only once', async () => {
    const conversationId = 'conv-dup-1';
    const persisted = buildMessage({ conversationId, sender: 'VISITOR', content: 'First send', clientMessageId: 'same-client-id', senderId: 'visitor-dedupe' });
    let created = false;

    (db.message.findUnique as jest.Mock).mockImplementation(async (args: { where: { clientMessageId?: string } }) =>
      args.where.clientMessageId === 'same-client-id' && created ? persisted : null
    );
    (db.message.create as jest.Mock).mockImplementation(async () => {
      created = true;
      return persisted;
    });
    (db.conversation.update as jest.Mock).mockResolvedValue({});
    (db.conversation.findUnique as jest.Mock).mockResolvedValue(buildConversation({ id: conversationId }));

    const visitor = connectClient(visitorToken(conversationId, 'visitor-dedupe'));
    await once(visitor, 'connect');

    const received: unknown[] = [];
    visitor.on('chat:message', (payload) => received.push(payload));

    visitor.emit('chat:message', { conversationId, content: 'First send', clientMessageId: 'same-client-id', senderId: 'visitor-dedupe' });
    await new Promise((resolve) => setTimeout(resolve, 150));
    visitor.emit('chat:message', { conversationId, content: 'First send', clientMessageId: 'same-client-id', senderId: 'visitor-dedupe' });
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Retries may repeat the event, but must retain one persisted identity.
    expect(db.message.create).toHaveBeenCalledTimes(1);
    expect(received).toHaveLength(2);
    expect(received[0]).toEqual(received[1]);
  });

  it('admin:status broadcasts "online" to a visitor room when an admin connects', async () => {
    await setAdminOffline('control-admin');

    const conversationId = 'conv-status-1';
    const visitor = connectClient(visitorToken(conversationId));
    await once(visitor, 'connect');

    // Listen from before the admin connects so the initial "offline" emit
    // (sent to this socket the moment it connects) and the later "online"
    // broadcast (once the admin connects) are both captured, regardless of
    // exactly when each arrives relative to attaching this listener.
    const statuses: string[] = [];
    visitor.on('admin:status', (payload: { status: string }) => statuses.push(payload.status));

    const admin = connectClient(adminToken());
    await once(admin, 'connect');
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(statuses).toContain('online');

    await setAdminOnline('control-admin');
  });

  it('chat:admin-open assigns the conversation and emits admin:joined only to that conversation room', async () => {
    const conversationId = 'conv-open-1';
    const otherConversationId = 'conv-open-2';

    (db.conversation.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    (db.conversation.findUnique as jest.Mock).mockImplementation(async (args: { where: { id: string } }) =>
      buildConversation({ id: args.where.id, assignedAdminId: 'admin-1' })
    );

    const visitor = connectClient(visitorToken(conversationId));
    await once(visitor, 'connect');
    const otherVisitor = connectClient(visitorToken(otherConversationId));
    await once(otherVisitor, 'connect');

    let otherReceivedJoin = false;
    otherVisitor.on('admin:joined', () => {
      otherReceivedJoin = true;
    });

    const joinedPromise = once<{ conversationId: string; adminId: string }>(visitor, 'admin:joined');
    const admin = connectClient(adminToken('admin-1'));
    await once(admin, 'connect');
    admin.emit('chat:admin-open', { conversationId });

    const payload = await joinedPromise;
    expect(payload).toEqual({ conversationId, adminId: 'admin-1' });

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(otherReceivedJoin).toBe(false);
  });

  it('admin closes a conversation via chat:set-status — broadcasts to the room and to other admins', async () => {
    const conversationId = 'conv-close-1';
    (db.conversation.update as jest.Mock).mockResolvedValue(
      buildConversation({ id: conversationId, status: 'CLOSED' as never })
    );
    (db.conversation.findUnique as jest.Mock).mockImplementation(async (args: { where: { id: string } }) =>
      buildConversation({ id: args.where.id, status: 'CLOSED' as never })
    );

    const visitor = connectClient(visitorToken(conversationId));
    await once(visitor, 'connect');
    const admin = connectClient(adminToken('admin-close'));
    await once(admin, 'connect');
    const otherAdmin = connectClient(adminToken('admin-observer'));
    await once(otherAdmin, 'connect');

    const statusPromise = once<{ conversationId: string; status: string }>(visitor, 'chat:conversation-status');
    const updatedPromise = once<{ conversation: { id: string; status: string } }>(
      otherAdmin,
      'chat:conversation-updated'
    );

    admin.emit('chat:set-status', { conversationId, status: 'closed' });

    const status = await statusPromise;
    expect(status).toEqual({ conversationId, status: 'closed' });

    const updated = await updatedPromise;
    expect(updated.conversation.status).toBe('closed');
    expect(db.conversation.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: conversationId }, data: expect.objectContaining({ status: 'CLOSED' }) })
    );
  });

  it('a visitor can end their own conversation via chat:set-status', async () => {
    const conversationId = 'conv-close-2';
    (db.conversation.update as jest.Mock).mockResolvedValue(
      buildConversation({ id: conversationId, status: 'CLOSED' as never })
    );
    const visitor = connectClient(visitorToken(conversationId));
    await once(visitor, 'connect');

    const statusPromise = once<{ conversationId: string; status: string }>(visitor, 'chat:conversation-status');
    visitor.emit('chat:set-status', { conversationId, status: 'closed' });

    const status = await statusPromise;
    expect(status).toEqual({ conversationId, status: 'closed' });
    expect(db.conversation.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: conversationId }, data: expect.objectContaining({ status: 'CLOSED' }) })
    );
  });

  it('a visitor cannot reopen a conversation via chat:set-status', async () => {
    const conversationId = 'conv-close-3';
    const visitor = connectClient(visitorToken(conversationId));
    await once(visitor, 'connect');

    visitor.emit('chat:set-status', { conversationId, status: 'open' });
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(db.conversation.update).not.toHaveBeenCalled();
  });

  it("a visitor cannot close another visitor's conversation via chat:set-status", async () => {
    const ownConversationId = 'conv-close-own';
    const otherConversationId = 'conv-close-other';
    const visitor = connectClient(visitorToken(ownConversationId));
    await once(visitor, 'connect');

    visitor.emit('chat:set-status', { conversationId: otherConversationId, status: 'closed' });
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(db.conversation.update).not.toHaveBeenCalled();
  });

  it('a closed conversation rejects new visitor messages and does not reopen', async () => {
    const conversationId = 'conv-closed-guard-1';
    (db.conversation.findUnique as jest.Mock).mockImplementation(async (args: { where: { id: string } }) =>
      buildConversation({ id: args.where.id, status: 'CLOSED' as never })
    );

    const visitor = connectClient(visitorToken(conversationId));
    await once(visitor, 'connect');

    let received = false;
    visitor.on('chat:message', () => {
      received = true;
    });

    visitor.emit('chat:message', { conversationId, content: 'Are you still there?' });
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(received).toBe(false);
    expect(db.message.create).not.toHaveBeenCalled();
  });

  it('admin deletes a message via chat:delete-message — broadcasts message-deleted to the room', async () => {
    const conversationId = 'conv-delete-1';
    const messageId = 'msg-to-delete';
    (db.message.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    (db.conversation.findUnique as jest.Mock).mockImplementation(async (args: { where: { id: string } }) =>
      buildConversation({ id: args.where.id })
    );

    const visitor = connectClient(visitorToken(conversationId));
    await once(visitor, 'connect');
    const admin = connectClient(adminToken('admin-delete'));
    await once(admin, 'connect');

    const deletedPromise = once<{ conversationId: string; messageId: string }>(visitor, 'chat:message-deleted');
    admin.emit('chat:delete-message', { conversationId, messageId });

    const payload = await deletedPromise;
    expect(payload).toEqual({ conversationId, messageId });
    expect(db.message.updateMany).toHaveBeenCalledWith({
      where: { id: messageId, conversationId, deletedAt: null },
      data: { content: '', deletedAt: expect.any(Date) },
    });
  });

  it('a visitor cannot delete a message via chat:delete-message', async () => {
    const conversationId = 'conv-delete-2';
    const visitor = connectClient(visitorToken(conversationId));
    await once(visitor, 'connect');

    visitor.emit('chat:delete-message', { conversationId, messageId: 'some-message' });
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(db.message.updateMany).not.toHaveBeenCalled();
  });
  it('delivers a visitor message to an admin who has not opened the conversation and acknowledges persistence', async () => {
    const conversationId = 'conv-global-notification';
    (db.message.create as jest.Mock).mockResolvedValue(buildMessage({ conversationId, content: 'Global alert' }));
    (db.conversation.update as jest.Mock).mockResolvedValue({});
    const admin = connectClient(adminToken());
    await once(admin, 'connect');
    const visitor = connectClient(visitorToken(conversationId));
    await once(visitor, 'connect');
    const received = once<{ message: { content: string } }>(admin, 'chat:message');
    const ack = new Promise<{ message: { id: string } }>((resolve) => visitor.emit('chat:message', { conversationId, content: 'Global alert', clientMessageId: 'global-id' }, resolve));
    expect((await received).message.content).toBe('Global alert');
    expect((await ack).message.id).toBeTruthy();
    expect(db.message.create).toHaveBeenCalledTimes(1);
  });

  it('rejects cross-conversation typing and forged read roles', async () => {
    const visitor = connectClient(visitorToken('own-room'));
    await once(visitor, 'connect');
    const admin = connectClient(adminToken());
    await once(admin, 'connect');
    admin.emit('chat:join', { conversationId: 'other-room' });
    const typing = jest.fn();
    admin.on('chat:typing', typing);
    visitor.emit('chat:typing', { conversationId: 'other-room' });
    visitor.emit('chat:stop-typing', { conversationId: 'other-room' });
    visitor.emit('chat:read', { conversationId: 'other-room', reader: 'visitor' });
    visitor.emit('chat:read', { conversationId: 'own-room', reader: 'admin' });
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(typing).not.toHaveBeenCalled();
    expect(db.message.updateMany).not.toHaveBeenCalled();
  });

  it('reports persistence errors through acknowledgement', async () => {
    (db.message.create as jest.Mock).mockRejectedValueOnce(new Error('database unavailable'));
    (db.conversation.update as jest.Mock).mockResolvedValue({});
    const visitor = connectClient(visitorToken('conv-error'));
    await once(visitor, 'connect');
    const response = await new Promise<{ error: string }>((resolve) => visitor.emit('chat:message', { conversationId: 'conv-error', content: 'Save me' }, resolve));
    expect(response.error).toContain('could not be saved');
  });

});
