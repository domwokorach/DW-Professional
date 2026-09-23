import { sendMessage } from '@/lib/chat/send-message';
import { db } from '@/lib/database/db';
import { buildMessage } from '../../test/factories';

jest.mock('@/lib/database/db');

describe('sendMessage', () => {
  it('uppercases the sender enum and persists content', async () => {
    const created = buildMessage({ sender: 'VISITOR', content: 'Hi there' });
    (db.message.create as jest.Mock).mockResolvedValue(created);
    (db.conversation.update as jest.Mock).mockResolvedValue({});

    await sendMessage({ conversationId: 'conv-1', sender: 'visitor', content: 'Hi there' });

    expect(db.message.create).toHaveBeenCalledWith({
      data: {
        conversationId: 'conv-1',
        sender: 'VISITOR',
        senderId: undefined,
        content: 'Hi there',
        clientMessageId: undefined,
        attachments: undefined,
      },
      include: { attachments: true },
    });
  });

  it('bumps lastMessageAt and sets status to OPEN on the conversation', async () => {
    (db.message.create as jest.Mock).mockResolvedValue(buildMessage());
    (db.conversation.update as jest.Mock).mockResolvedValue({});

    await sendMessage({ conversationId: 'conv-1', sender: 'admin', senderId: 'admin-1', content: 'Reply' });

    expect(db.conversation.update).toHaveBeenCalledWith({
      where: { id: 'conv-1' },
      data: {
        lastMessageAt: expect.any(Date),
        status: 'OPEN',
        unreadByVisitor: { increment: 1 },
        lastAdminMessageAt: expect.any(Date),
        awaitingAdminReply: false,
        waitingSince: null,
        initialNotificationSentAt: null,
        reminderNotificationSentAt: null,
      },
    });
  });

  it('increments unreadByAdmin when sender is visitor', async () => {
    (db.message.create as jest.Mock).mockResolvedValue(buildMessage({ sender: 'VISITOR' }));
    (db.conversation.update as jest.Mock).mockResolvedValue({});

    await sendMessage({ conversationId: 'conv-1', sender: 'visitor', content: 'Question' });

    expect(db.conversation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          unreadByAdmin: { increment: 1 },
          awaitingAdminReply: true,
          lastCandidateMessageAt: expect.any(Date),
        }),
      })
    );
  });

  it('pins waitingSince to first-message time via a COALESCE update on visitor messages only', async () => {
    (db.message.create as jest.Mock).mockResolvedValue(buildMessage({ sender: 'VISITOR' }));
    (db.conversation.update as jest.Mock).mockResolvedValue({});
    (db.$executeRaw as unknown as jest.Mock).mockResolvedValue(1);

    await sendMessage({ conversationId: 'conv-1', sender: 'visitor', content: 'Question' });
    expect(db.$executeRaw).toHaveBeenCalledTimes(1);

    (db.$executeRaw as unknown as jest.Mock).mockClear();
    await sendMessage({ conversationId: 'conv-1', sender: 'admin', senderId: 'admin-1', content: 'Answer' });
    expect(db.$executeRaw).not.toHaveBeenCalled();
  });

  it('increments unreadByVisitor when sender is admin', async () => {
    (db.message.create as jest.Mock).mockResolvedValue(buildMessage({ sender: 'ADMIN' }));
    (db.conversation.update as jest.Mock).mockResolvedValue({});

    await sendMessage({ conversationId: 'conv-1', sender: 'admin', senderId: 'admin-1', content: 'Answer' });

    expect(db.conversation.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ unreadByVisitor: { increment: 1 } }) })
    );
  });

  it('increments neither unread counter when sender is bot', async () => {
    (db.message.create as jest.Mock).mockResolvedValue(buildMessage({ sender: 'BOT' as never }));
    (db.conversation.update as jest.Mock).mockResolvedValue({});

    await sendMessage({ conversationId: 'conv-1', sender: 'bot' as never, content: 'Canned reply' });

    const call = (db.conversation.update as jest.Mock).mock.calls[0][0];
    expect(call.data).not.toHaveProperty('unreadByAdmin');
    expect(call.data).not.toHaveProperty('unreadByVisitor');
  });

  it('returns the mapped ChatMessage from the created row', async () => {
    const created = buildMessage({ id: 'msg-1', content: 'Hello' });
    (db.message.create as jest.Mock).mockResolvedValue(created);
    (db.conversation.update as jest.Mock).mockResolvedValue({});

    const result = await sendMessage({ conversationId: 'conv-1', sender: 'visitor', content: 'Hello' });

    expect(result.id).toBe('msg-1');
    expect(result.content).toBe('Hello');
  });
});
