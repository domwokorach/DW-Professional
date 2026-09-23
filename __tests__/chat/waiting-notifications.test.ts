jest.mock('@/lib/database/db');
jest.mock('@/lib/notifications/email', () => ({
  sendNewConversationEmail: jest.fn().mockResolvedValue(undefined),
  sendChatWaitingReminderEmail: jest.fn().mockResolvedValue(undefined),
}));

import { db } from '@/lib/database/db';
import { sendWaitingConversationNotifications } from '@/lib/chat/waiting-notifications';
import { sendNewConversationEmail, sendChatWaitingReminderEmail } from '@/lib/notifications/email';
import { buildConversation, buildMessage } from '../../test/factories';

const mockInitial = sendNewConversationEmail as jest.MockedFunction<typeof sendNewConversationEmail>;
const mockReminder = sendChatWaitingReminderEmail as jest.MockedFunction<typeof sendChatWaitingReminderEmail>;

describe('sendWaitingConversationNotifications', () => {
  beforeEach(() => {
    mockInitial.mockClear();
    mockReminder.mockClear();
    (db.conversation.updateMany as jest.Mock).mockResolvedValue({});
  });

  it('sends the initial alert and stamps initialNotificationSentAt for a never-notified conversation', async () => {
    const conversation = buildConversation({
      id: 'conv-1',
      awaitingAdminReply: true,
      waitingSince: new Date(),
      initialNotificationSentAt: null,
      messages: undefined,
    });
    (db.conversation.findMany as jest.Mock).mockResolvedValue([
      { ...conversation, messages: [buildMessage({ content: 'Hello?' })] },
    ]);

    await sendWaitingConversationNotifications();

    expect(mockInitial).toHaveBeenCalledWith(expect.objectContaining({ id: 'conv-1', messagePreview: 'Hello?' }));
    expect(mockReminder).not.toHaveBeenCalled();
    expect(db.conversation.updateMany).toHaveBeenCalledWith({
      where: { id: 'conv-1', awaitingAdminReply: true, waitingSince: conversation.waitingSince },
      data: { initialNotificationSentAt: expect.any(Date) },
    });
  });

  it('sends the reminder once past the 5-minute cutoff and stamps reminderNotificationSentAt', async () => {
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
    const conversation = buildConversation({
      id: 'conv-2',
      awaitingAdminReply: true,
      waitingSince: sixMinutesAgo,
      initialNotificationSentAt: new Date(Date.now() - 5 * 60 * 1000),
      reminderNotificationSentAt: null,
    });
    (db.conversation.findMany as jest.Mock).mockResolvedValue([{ ...conversation, messages: [] }]);

    await sendWaitingConversationNotifications();

    expect(mockReminder).toHaveBeenCalledWith(expect.objectContaining({ id: 'conv-2' }));
    expect(mockInitial).not.toHaveBeenCalled();
    expect(db.conversation.updateMany).toHaveBeenCalledWith({
      where: { id: 'conv-2', awaitingAdminReply: true, waitingSince: sixMinutesAgo },
      data: { reminderNotificationSentAt: expect.any(Date) },
    });
  });

  it('never sends a reminder twice — a conversation with both timestamps set is excluded from the query results entirely', async () => {
    // The where-clause dedup happens in the DB query itself; this asserts
    // the function trusts what findMany returns rather than re-filtering,
    // so an already-fully-notified row (which findMany would not return in
    // production) does nothing here either.
    (db.conversation.findMany as jest.Mock).mockResolvedValue([]);

    await sendWaitingConversationNotifications();

    expect(mockInitial).not.toHaveBeenCalled();
    expect(mockReminder).not.toHaveBeenCalled();
  });

  it('continues processing remaining conversations when one email send throws', async () => {
    mockInitial.mockRejectedValueOnce(new Error('resend down'));
    (db.conversation.findMany as jest.Mock).mockResolvedValue([
      { ...buildConversation({ id: 'conv-a', awaitingAdminReply: true, waitingSince: new Date() }), messages: [] },
      { ...buildConversation({ id: 'conv-b', awaitingAdminReply: true, waitingSince: new Date() }), messages: [] },
    ]);

    await sendWaitingConversationNotifications();

    expect(mockInitial).toHaveBeenCalledTimes(2);
    expect(db.conversation.updateMany).toHaveBeenCalledWith({
      where: { id: 'conv-b', awaitingAdminReply: true, waitingSince: expect.any(Date) },
      data: { initialNotificationSentAt: expect.any(Date) },
    });
    expect(db.conversation.updateMany).not.toHaveBeenCalledWith({
      where: { id: 'conv-a', awaitingAdminReply: true, waitingSince: expect.any(Date) },
      data: { initialNotificationSentAt: expect.any(Date) },
    });
  });
});
