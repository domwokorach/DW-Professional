jest.mock('@/lib/database/db');
jest.mock('@vercel/blob', () => ({ del: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/lib/redis/pubsub', () => ({ publish: jest.fn().mockResolvedValue(undefined) }));

import { POST } from '@/app/api/chat/attachments/complete/route';
import { db } from '@/lib/database/db';
import { del } from '@vercel/blob';
import { publish } from '@/lib/redis/pubsub';
import { makeRequest, authCookiesFor, clearMockAuthCookies } from '../../../test/testRequest';
import { buildConversation, buildMessage, buildSession, buildUser } from '../../../test/factories';
import { CHAT_MESSAGE_CREATED_CHANNEL } from '@/lib/chat/message-created-channel';

const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // "%PDF-1.4"

function mockFetchOnce(bytes: Uint8Array, ok = true) {
  (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    body: new ReadableStream({ start(controller) { controller.enqueue(bytes); controller.close(); } }),
  });
}

async function authAsAdmin() {
  const user = buildUser();
  const session = buildSession({ userId: user.id });
  (db.user.findUnique as jest.Mock).mockResolvedValue(user);
  (db.session.findUnique as jest.Mock).mockResolvedValue(session);
  const cookies = await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });
  return { user, cookies };
}

describe('POST /api/chat/attachments/complete', () => {
  beforeEach(() => { process.env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_teststore_test'; });
  afterEach(() => {
    clearMockAuthCookies();
    jest.clearAllMocks();
  });

  const validBody = {
    conversationId: 'conv-1',
    url: 'https://teststore.public.blob.vercel-storage.com/chat-uploads/conv-1/12345678-1234-1234-1234-123456789abc.pdf',
    originalName: 'report.pdf',
    mimeType: 'application/pdf',
    size: 8,
  };

  it('rejects a request with missing required fields', async () => {
    const request = makeRequest('http://localhost:3000/api/chat/attachments/complete', {
      method: 'POST',
      body: { conversationId: 'conv-1' },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('rejects a URL outside the chat attachment prefix', async () => {
    const request = makeRequest('http://localhost:3000/api/chat/attachments/complete', {
      method: 'POST',
      body: { ...validBody, url: 'https://blob.example/other-uploads/x.pdf' },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('rejects a declared size over the 5 MB limit without deleting a client-supplied blob', async () => {
    const request = makeRequest('http://localhost:3000/api/chat/attachments/complete', {
      method: 'POST',
      body: { ...validBody, size: 6 * 1024 * 1024 },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(del).not.toHaveBeenCalled();
  });

  it('returns 404 when the visitor does not own the conversation', async () => {
    (db.conversation.findUnique as jest.Mock).mockResolvedValue(
      buildConversation({ id: 'conv-1', visitorId: 'real-visitor' })
    );
    mockFetchOnce(PDF_BYTES);

    const request = makeRequest('http://localhost:3000/api/chat/attachments/complete', {
      method: 'POST',
      body: { ...validBody, visitorId: 'attacker-visitor' },
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
  });

  it('rejects a file whose bytes do not match the declared type (spoofed extension)', async () => {
    const conversation = buildConversation({ id: 'conv-1' });
    (db.conversation.findUnique as jest.Mock).mockResolvedValue(conversation);
    mockFetchOnce(new Uint8Array([0x4d, 0x5a])); // "MZ" — a Windows executable header, not a PDF

    const request = makeRequest('http://localhost:3000/api/chat/attachments/complete', {
      method: 'POST',
      body: { ...validBody, visitorId: conversation.visitorId },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(del).toHaveBeenCalled();
  });

  it('creates the message with attachment metadata and broadcasts on success, for an authorized admin', async () => {
    await authAsAdmin();
    (db.conversation.findUnique as jest.Mock).mockResolvedValue(buildConversation({ id: 'conv-1', status: 'OPEN' }));
    mockFetchOnce(PDF_BYTES);
    const created = buildMessage({ id: 'msg-1', conversationId: 'conv-1', sender: 'ADMIN', content: '' });
    (db.message.create as jest.Mock).mockResolvedValue({ ...created, attachments: [] });
    (db.conversation.update as jest.Mock).mockResolvedValue({});

    const request = makeRequest('http://localhost:3000/api/chat/attachments/complete', {
      method: 'POST',
      body: { ...validBody, content: 'Here you go' },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    expect(db.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sender: 'ADMIN',
          content: 'Here you go',
          attachments: {
            create: [
              { originalName: 'report.pdf', storageKey: validBody.url, mimeType: 'application/pdf', size: 8 },
            ],
          },
        }),
      })
    );
    expect(publish).toHaveBeenCalledWith(CHAT_MESSAGE_CREATED_CHANNEL, {
      conversationId: 'conv-1',
      messageId: 'msg-1',
    });
  });

  it('rejects sending into a closed conversation', async () => {
    await authAsAdmin();
    (db.conversation.findUnique as jest.Mock).mockResolvedValue(buildConversation({ id: 'conv-1', status: 'CLOSED' }));
    mockFetchOnce(PDF_BYTES);

    const request = makeRequest('http://localhost:3000/api/chat/attachments/complete', {
      method: 'POST',
      body: validBody,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
