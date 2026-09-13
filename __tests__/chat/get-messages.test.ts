import { getMessages } from '@/lib/chat/get-messages';
import { db } from '@/lib/database/db';
import { buildMessage } from '../../test/factories';

jest.mock('@/lib/database/db');

describe('getMessages', () => {
  it('queries by conversationId, ordered ascending, and maps rows', async () => {
    const rows = [buildMessage({ conversationId: 'conv-1' }), buildMessage({ conversationId: 'conv-1' })];
    (db.message.findMany as jest.Mock).mockResolvedValue(rows);

    const result = await getMessages('conv-1');

    expect(db.message.findMany).toHaveBeenCalledWith({
      where: { conversationId: 'conv-1' },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
    expect(result).toHaveLength(2);
    expect(result[0].sender).toBe('visitor');
  });

  it('respects a custom limit', async () => {
    (db.message.findMany as jest.Mock).mockResolvedValue([]);

    await getMessages('conv-1', 10);

    expect(db.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 })
    );
  });
});
