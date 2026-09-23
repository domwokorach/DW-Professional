jest.mock('@/lib/database/db');

import { POST } from '@/app/api/chat/conversations/[id]/rating/route';
import { db } from '@/lib/database/db';
import { makeRequest } from '../../../test/testRequest';
import { buildConversation } from '../../../test/factories';

function paramsFor(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('POST /api/chat/conversations/[id]/rating', () => {
  it('rejects an invalid rating value', async () => {
    const request = makeRequest('http://localhost:3000/api/chat/conversations/conv-1/rating', {
      method: 'POST',
      body: { visitorId: 'visitor-1', rating: 6 },
    });

    const response = await POST(request, paramsFor('conv-1'));
    expect(response.status).toBe(400);
  });

  it('rejects a visitor supplying the wrong visitorId for the conversation', async () => {
    (db.conversation.findUnique as jest.Mock).mockResolvedValue(
      buildConversation({ id: 'conv-1', visitorId: 'real-visitor' })
    );

    const request = makeRequest('http://localhost:3000/api/chat/conversations/conv-1/rating', {
      method: 'POST',
      body: { visitorId: 'attacker-visitor', rating: 5 },
    });

    const response = await POST(request, paramsFor('conv-1'));
    expect(response.status).toBe(404);
    expect(db.conversation.updateMany).not.toHaveBeenCalled();
  });

  it('stores the rating and feedback exactly once', async () => {
    const conversation = buildConversation({ id: 'conv-1', visitorId: 'visitor-1' });
    (db.conversation.findUnique as jest.Mock).mockResolvedValue(conversation);
    (db.conversation.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

    const request = makeRequest('http://localhost:3000/api/chat/conversations/conv-1/rating', {
      method: 'POST',
      body: { visitorId: conversation.visitorId, rating: 4, feedback: 'Great, thanks!' },
    });

    const response = await POST(request, paramsFor('conv-1'));
    expect(response.status).toBe(200);
    expect(db.conversation.updateMany).toHaveBeenCalledWith({
      where: { id: 'conv-1', ratedAt: null },
      data: { rating: 4, feedback: 'Great, thanks!', ratedAt: expect.any(Date) },
    });
  });

  it('rejects a second rating submission for the same conversation', async () => {
    const conversation = buildConversation({ id: 'conv-1', visitorId: 'visitor-1' });
    (db.conversation.findUnique as jest.Mock).mockResolvedValue(conversation);
    // The WHERE ratedAt IS NULL guard matches nothing the second time round.
    (db.conversation.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

    const request = makeRequest('http://localhost:3000/api/chat/conversations/conv-1/rating', {
      method: 'POST',
      body: { visitorId: conversation.visitorId, rating: 5 },
    });

    const response = await POST(request, paramsFor('conv-1'));
    expect(response.status).toBe(409);
  });
});
