import { findOrCreateConversation } from '@/lib/chat/create-conversation';
import { db } from '@/lib/database/db';
import { buildConversation } from '../../test/factories';

jest.mock('@/lib/database/db');

describe('findOrCreateConversation', () => {
  it('reuses an existing OPEN/PENDING conversation for the visitor', async () => {
    const existing = buildConversation({ visitorId: 'visitor-1', status: 'OPEN' });
    (db.conversation.findFirst as jest.Mock).mockResolvedValue(existing);

    const result = await findOrCreateConversation('visitor-1');

    expect(db.conversation.findFirst).toHaveBeenCalledWith({
      where: { visitorId: 'visitor-1', status: { in: ['OPEN', 'PENDING'] } },
      orderBy: { createdAt: 'desc' },
    });
    expect(db.conversation.create).not.toHaveBeenCalled();
    expect(result.id).toBe(existing.id);
  });

  it('creates a new conversation when none exists', async () => {
    (db.conversation.findFirst as jest.Mock).mockResolvedValue(null);
    const created = buildConversation({ visitorId: 'visitor-2', name: 'Jane', email: 'jane@example.com' });
    (db.conversation.create as jest.Mock).mockResolvedValue(created);

    const result = await findOrCreateConversation('visitor-2', { name: 'Jane', email: 'jane@example.com' });

    expect(db.conversation.create).toHaveBeenCalledWith({
      data: {
        visitorId: 'visitor-2',
        name: 'Jane',
        email: 'jane@example.com',
        status: 'OPEN',
      },
    });
    expect(result.id).toBe(created.id);
    expect(result.status).toBe('open');
  });
});
