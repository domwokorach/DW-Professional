import { updateConversation } from '@/lib/chat/update-conversation';
import { db } from '@/lib/database/db';
import { buildConversation } from '../../test/factories';

jest.mock('@/lib/database/db');

describe('updateConversation', () => {
  it('uppercases the status when provided', async () => {
    (db.conversation.update as jest.Mock).mockResolvedValue(buildConversation({ status: 'CLOSED' as never }));

    await updateConversation('conv-1', { status: 'closed' as never });

    expect(db.conversation.update).toHaveBeenCalledWith({
      where: { id: 'conv-1' },
      data: {
        status: 'CLOSED',
        assignedAdminId: undefined,
        unreadByAdmin: undefined,
        closedAt: expect.any(Date),
        awaitingAdminReply: false,
        waitingSince: null,
      },
    });
  });

  it('passes assignedAdminId and unreadByAdmin through untouched', async () => {
    (db.conversation.update as jest.Mock).mockResolvedValue(buildConversation());

    await updateConversation('conv-1', { assignedAdminId: 'admin-1', unreadByAdmin: 3 });

    expect(db.conversation.update).toHaveBeenCalledWith({
      where: { id: 'conv-1' },
      data: { status: undefined, assignedAdminId: 'admin-1', unreadByAdmin: 3 },
    });
  });

  it('allows explicitly clearing assignedAdminId with null', async () => {
    (db.conversation.update as jest.Mock).mockResolvedValue(buildConversation());

    await updateConversation('conv-1', { assignedAdminId: null });

    expect(db.conversation.update).toHaveBeenCalledWith({
      where: { id: 'conv-1' },
      data: { status: undefined, assignedAdminId: null, unreadByAdmin: undefined },
    });
  });

  it('returns the mapped conversation', async () => {
    (db.conversation.update as jest.Mock).mockResolvedValue(buildConversation({ id: 'conv-9' }));

    const result = await updateConversation('conv-9', {});

    expect(result.id).toBe('conv-9');
  });
});
