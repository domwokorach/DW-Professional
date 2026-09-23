import { mergeMessages } from '@/lib/chat/merge-messages';
import type { ChatMessage } from '@/types/message';
const message: ChatMessage = { id: 'server-1', conversationId: 'conversation', sender: 'visitor', content: 'hello', status: 'sent', createdAt: '2026-09-23T10:00:00Z' };

it('reconciles an optimistic message from history even when its acknowledgement was lost', () => {
  const result = mergeMessages([{ ...message, id: 'client-1' }], [{ ...message, clientMessageId: 'client-1' }]);
  expect(result).toHaveLength(1);
  expect(result[0].id).toBe('server-1');
});
it('applies delivery updates without duplication and never regresses a read receipt', () => {
  const delivered = mergeMessages([message], [{ ...message, status: 'delivered' }]);
  expect(delivered).toHaveLength(1);
  expect(delivered[0].status).toBe('delivered');
  expect(mergeMessages([{ ...message, status: 'read' }], [message])[0].status).toBe('read');
});
it('sorts out-of-order messages and preserves deletion over stale history', () => {
  expect(mergeMessages([{ ...message, deleted: true, content: '' }], [message])[0].content).toBe('');
  const older = { ...message, id: 'older', createdAt: '2026-09-23T09:00:00Z' };
  expect(mergeMessages([message], [older]).map(m => m.id)).toEqual(['older', 'server-1']);
});
