import { getConversations, getConversationById } from '@/lib/chat/get-conversations';
import { db } from '@/lib/database/db';
import { buildConversation } from '../../test/factories';

jest.mock('@/lib/database/db');

describe('getConversations', () => {
  it('uppercases the status filter', async () => {
    (db.conversation.findMany as jest.Mock).mockResolvedValue([]);

    await getConversations({ status: 'open' as never });

    expect(db.conversation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'OPEN' }),
      })
    );
  });

  it('filters by name/email case-insensitively when search is provided', async () => {
    (db.conversation.findMany as jest.Mock).mockResolvedValue([]);

    await getConversations({ search: 'Jane' });

    expect(db.conversation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { name: { contains: 'Jane', mode: 'insensitive' } },
            { email: { contains: 'Jane', mode: 'insensitive' } },
            { mobile: { contains: 'Jane', mode: 'insensitive' } },
          ],
        }),
      })
    );
  });

  it('leaves status/OR undefined when no filters are given', async () => {
    (db.conversation.findMany as jest.Mock).mockResolvedValue([]);

    await getConversations();

    expect(db.conversation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: undefined, OR: undefined },
      })
    );
  });

  it('maps rows to Conversation objects, including lastMessagePreview from included messages', async () => {
    const row = {
      ...buildConversation(),
      messages: [{ content: 'Latest message', createdAt: new Date() }],
    };
    (db.conversation.findMany as jest.Mock).mockResolvedValue([row]);

    const result = await getConversations();

    expect(result).toHaveLength(1);
    expect(result[0].lastMessagePreview).toBe('Latest message');
  });
});

describe('getConversationById', () => {
  it('returns null for an unknown id', async () => {
    (db.conversation.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await getConversationById('does-not-exist');

    expect(result).toBeNull();
  });

  it('returns the mapped conversation when found', async () => {
    const row = buildConversation({ id: 'conv-1' });
    (db.conversation.findUnique as jest.Mock).mockResolvedValue(row);

    const result = await getConversationById('conv-1');

    expect(result?.id).toBe('conv-1');
  });
});
