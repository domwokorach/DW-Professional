jest.mock('@/lib/database/db');

import { GET, POST } from '@/app/api/chat/status/route';
import { db } from '@/lib/database/db';
import { buildUser, buildSession } from '../../../test/factories';
import { authCookiesFor, makeRequest, clearMockAuthCookies } from '../../../test/testRequest';

describe('GET /api/chat/status', () => {
  afterEach(() => clearMockAuthCookies());

  it('requires admin auth', async () => {
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("reports online:true when the requesting admin's id is in the online set", async () => {
    const user = buildUser();
    const session = buildSession({ userId: user.id });
    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);
    await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(typeof body.online).toBe('boolean');
  });
});

describe('POST /api/chat/status', () => {
  afterEach(() => clearMockAuthCookies());

  it('requires admin auth', async () => {
    const response = await POST(makeRequest('/api/chat/status', { method: 'POST', body: { available: true } }));
    expect(response.status).toBe(401);
  });

  it('marks the admin online when available:true', async () => {
    const user = buildUser();
    const session = buildSession({ userId: user.id });
    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);
    await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

    const response = await POST(makeRequest('/api/chat/status', { method: 'POST', body: { available: true } }));
    expect(response.status).toBe(200);

    const statusCheck = await GET();
    const body = await statusCheck.json();
    expect(body.online).toBe(true);
  });

  it('marks the admin offline when available:false', async () => {
    const user = buildUser();
    const session = buildSession({ userId: user.id });
    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);
    await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

    await POST(makeRequest('/api/chat/status', { method: 'POST', body: { available: true } }));
    await POST(makeRequest('/api/chat/status', { method: 'POST', body: { available: false } }));

    const statusCheck = await GET();
    const body = await statusCheck.json();
    expect(body.online).toBe(false);
  });

  it('treats a malformed JSON body as unavailable rather than crashing', async () => {
    const user = buildUser();
    const session = buildSession({ userId: user.id });
    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (db.session.findUnique as jest.Mock).mockResolvedValue(session);
    await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

    const request = makeRequest('/api/chat/status', { method: 'POST' });
    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
