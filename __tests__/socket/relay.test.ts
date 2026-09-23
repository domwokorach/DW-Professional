import { signRelay, verifyRelay } from '@/lib/socket/relay';
it('accepts a fresh signed event and rejects modified, unsigned and expired requests', () => {
  const body = JSON.stringify({ channel: 'chat:message-created', payload: { conversationId: 'c', messageId: 'm' } });
  const now = String(Date.now());
  const signature = signRelay(body, now, 'secret');
  expect(verifyRelay(body, now, signature, 'secret')).toBe(true);
  expect(verifyRelay(body + ' ', now, signature, 'secret')).toBe(false);
  expect(verifyRelay(body, now, '', 'secret')).toBe(false);
  expect(verifyRelay(body, String(Date.now() - 60000), signature, 'secret')).toBe(false);
  expect(verifyRelay(body, now, signature, 'wrong-secret')).toBe(false);
});
