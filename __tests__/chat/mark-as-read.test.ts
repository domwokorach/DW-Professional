import { markAsRead } from '@/lib/chat/mark-as-read';
import { db } from '@/lib/database/db';

jest.mock('@/lib/database/db');

describe('markAsRead', () => {
  it('reader "admin" clears VISITOR-sent unread messages and the unreadByAdmin counter', async () => {
    (db.message.updateMany as jest.Mock).mockResolvedValue({ count: 2 });
    (db.conversation.update as jest.Mock).mockResolvedValue({});

    await markAsRead('conv-1', 'admin');

    expect(db.message.updateMany).toHaveBeenCalledWith({
      where: { conversationId: 'conv-1', sender: 'VISITOR', status: { not: 'READ' } },
      data: { status: 'READ', readAt: expect.any(Date) },
    });
    expect(db.conversation.update).toHaveBeenCalledWith({
      where: { id: 'conv-1' },
      data: { unreadByAdmin: 0 },
    });
  });

  it('reader "visitor" clears ADMIN-sent unread messages and the unreadByVisitor counter', async () => {
    (db.message.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    (db.conversation.update as jest.Mock).mockResolvedValue({});

    await markAsRead('conv-2', 'visitor');

    expect(db.message.updateMany).toHaveBeenCalledWith({
      where: { conversationId: 'conv-2', sender: 'ADMIN', status: { not: 'READ' } },
      data: { status: 'READ', readAt: expect.any(Date) },
    });
    expect(db.conversation.update).toHaveBeenCalledWith({
      where: { id: 'conv-2' },
      data: { unreadByVisitor: 0 },
    });
  });

  it('runs both writes inside a single transaction', async () => {
    (db.message.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
    (db.conversation.update as jest.Mock).mockResolvedValue({});

    await markAsRead('conv-3', 'admin');

    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(db.$transaction).toHaveBeenCalledWith(expect.arrayContaining([expect.anything(), expect.anything()]));
  });
});
