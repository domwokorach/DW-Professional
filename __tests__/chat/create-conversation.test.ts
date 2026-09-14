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

  it('backfills details missing from an existing conversation without overwriting ones already set', async () => {
    const existing = buildConversation({
      visitorId: 'visitor-3',
      name: 'Jane Visitor',
      mobile: null,
      companyName: null,
    });
    (db.conversation.findFirst as jest.Mock).mockResolvedValue(existing);
    const updated = { ...existing, mobile: '+447000000000', companyName: 'Acme Corp' };
    (db.conversation.update as jest.Mock).mockResolvedValue(updated);

    const result = await findOrCreateConversation('visitor-3', {
      name: 'Someone Else',
      mobile: '+447000000000',
      companyName: 'Acme Corp',
    });

    expect(db.conversation.update).toHaveBeenCalledWith({
      where: { id: existing.id },
      data: { mobile: '+447000000000', companyName: 'Acme Corp' },
    });
    expect(result.mobile).toBe('+447000000000');
    expect(result.companyName).toBe('Acme Corp');
  });

  it('skips the update when the existing conversation already has every detail', async () => {
    const existing = buildConversation({ visitorId: 'visitor-4', name: 'Jane Visitor', email: 'jane@example.com' });
    (db.conversation.findFirst as jest.Mock).mockResolvedValue(existing);

    await findOrCreateConversation('visitor-4', { name: 'Someone Else', email: 'someone@example.com' });

    expect(db.conversation.update).not.toHaveBeenCalled();
  });

  it('resolves to the winning row instead of throwing when a concurrent request already created the conversation', async () => {
    (db.conversation.findFirst as jest.Mock).mockResolvedValueOnce(null);
    const conflictError = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
    (db.conversation.create as jest.Mock).mockRejectedValue(conflictError);
    const winner = buildConversation({ visitorId: 'visitor-5', name: 'Jane', email: 'jane@example.com' });
    (db.conversation.findFirst as jest.Mock).mockResolvedValueOnce(winner);

    const result = await findOrCreateConversation('visitor-5', { name: 'Jane', email: 'jane@example.com' });

    expect(db.conversation.findFirst).toHaveBeenCalledTimes(2);
    expect(result.id).toBe(winner.id);
  });

  it('re-throws a create failure that is not a unique constraint conflict', async () => {
    (db.conversation.findFirst as jest.Mock).mockResolvedValue(null);
    const dbError = new Error('connection lost');
    (db.conversation.create as jest.Mock).mockRejectedValue(dbError);

    await expect(findOrCreateConversation('visitor-6')).rejects.toThrow('connection lost');
  });
});
