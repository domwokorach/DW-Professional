import { canAccessConversation, canSendAdminMessage, canSendCandidateMessage, isAdmin } from '@/lib/chat/permissions';
import { getAdminSession, type AdminSession } from '@/lib/auth/guard';
import { getConversationById } from '@/lib/chat/get-conversations';
import { buildConversation } from '../../test/factories';

jest.mock('@/lib/auth/guard');
jest.mock('@/lib/chat/get-conversations');

const mockAdmin: AdminSession = {
  userId: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin',
  role: 'ADMIN' as never,
  status: 'ACTIVE' as never,
  avatarUrl: null,
  sessionId: 'session-1',
};

describe('isAdmin', () => {
  it('delegates to getAdminSession', async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(mockAdmin);

    const result = await isAdmin();

    expect(result).toBe(mockAdmin);
    expect(getAdminSession).toHaveBeenCalledTimes(1);
  });
});

describe('canAccessConversation', () => {
  it('returns null when the conversation does not exist', async () => {
    (getConversationById as jest.Mock).mockResolvedValue(null);

    const result = await canAccessConversation('missing', { admin: mockAdmin });

    expect(result).toBeNull();
  });

  it('grants access to any admin regardless of visitorId', async () => {
    const conversation = buildConversation({ id: 'conv-1', visitorId: 'visitor-a' });
    (getConversationById as jest.Mock).mockResolvedValue(conversation);

    const result = await canAccessConversation('conv-1', { admin: mockAdmin });

    expect(result).not.toBeNull();
    expect(result?.id).toBe('conv-1');
  });

  it('grants access to a visitor whose visitorId matches the conversation', async () => {
    const conversation = buildConversation({ id: 'conv-1', visitorId: 'visitor-a' });
    (getConversationById as jest.Mock).mockResolvedValue(conversation);

    const result = await canAccessConversation('conv-1', { visitorId: 'visitor-a' });

    expect(result?.id).toBe('conv-1');
  });

  it('denies access to a visitor whose visitorId does not match (wrong id / someone else\'s conversation)', async () => {
    const conversation = buildConversation({ id: 'conv-1', visitorId: 'visitor-a' });
    (getConversationById as jest.Mock).mockResolvedValue(conversation);

    const result = await canAccessConversation('conv-1', { visitorId: 'visitor-b' });

    expect(result).toBeNull();
  });

  it('denies access when neither admin nor visitorId is supplied', async () => {
    const conversation = buildConversation({ id: 'conv-1', visitorId: 'visitor-a' });
    (getConversationById as jest.Mock).mockResolvedValue(conversation);

    const result = await canAccessConversation('conv-1', {});

    expect(result).toBeNull();
  });
});

describe('canSendAdminMessage', () => {
  it('is true for a non-null admin session', () => {
    expect(canSendAdminMessage(mockAdmin)).toBe(true);
  });

  it('is false for null', () => {
    expect(canSendAdminMessage(null)).toBe(false);
  });
});

describe('canSendCandidateMessage', () => {
  it('is true when the conversation exists and visitorId matches', () => {
    const conversation = buildConversation({ visitorId: 'visitor-a' });
    expect(canSendCandidateMessage(conversation, 'visitor-a')).toBe(true);
  });

  it('is false when visitorId does not match', () => {
    const conversation = buildConversation({ visitorId: 'visitor-a' });
    expect(canSendCandidateMessage(conversation, 'visitor-b')).toBe(false);
  });

  it('is false when conversation is null', () => {
    expect(canSendCandidateMessage(null, 'visitor-a')).toBe(false);
  });

  it('is false when visitorId is undefined', () => {
    const conversation = buildConversation({ visitorId: 'visitor-a' });
    expect(canSendCandidateMessage(conversation, undefined)).toBe(false);
  });
});
