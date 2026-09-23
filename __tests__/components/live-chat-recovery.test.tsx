import { act, renderHook, waitFor } from '@testing-library/react';
import { useLiveChat } from '@/hooks/use-live-chat';
import { useSocket } from '@/hooks/use-socket';
import { REGISTERED_STORAGE_KEY } from '@/lib/chat/constants';

jest.mock('@/hooks/use-socket');
jest.mock('@/lib/chat/visitor-id', () => ({ getVisitorId: () => 'visitor-1' }));
const listeners = new Map<string, (payload: unknown) => void>();
const socket = { connected: true, emit: jest.fn(), on: jest.fn((name, fn) => listeners.set(name, fn)), off: jest.fn(), volatile: { emit: jest.fn() } };
const socketRef = { current: socket };
let state = 'online';
const message = { id: 'reply', conversationId: 'conv-1', sender: 'admin', status: 'sent', content: 'Missed reply', createdAt: '2026-09-23T10:00:00Z' };

beforeEach(() => {
  state = 'online';
  listeners.clear();
  sessionStorage.setItem(REGISTERED_STORAGE_KEY, '1');
  (useSocket as jest.Mock).mockImplementation(() => ({ socketRef, connectionState: state }));
  global.fetch = jest.fn(async (url) => ({ ok: true, json: async () => String(url).includes('/messages') ? { messages: [] } : { conversation: { id: 'conv-1', status: 'open' } } })) as jest.Mock;
});

afterEach(() => sessionStorage.clear());

it('fetches missed messages after reconnect without refresh and deduplicates live echoes', async () => {
  const { result, rerender } = renderHook(() => useLiveChat());
  await waitFor(() => expect(result.current.ready).toBe(true));
  (fetch as jest.Mock).mockClear();
  state = 'reconnecting';
  rerender();
  (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ messages: [message] }) });
  state = 'online';
  rerender();
  await waitFor(() => expect(result.current.messages).toHaveLength(1));
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/chat/messages?'));
  act(() => listeners.get('chat:message')?.({ message: { ...message, status: 'read' } }));
  expect(result.current.messages).toHaveLength(1);
  expect(result.current.messages[0].status).toBe('read');
});

it('renders typing immediately and clears it after inactivity', async () => {
  const { result } = renderHook(() => useLiveChat());
  await waitFor(() => expect(result.current.ready).toBe(true));
  jest.useFakeTimers();
  act(() => listeners.get('chat:typing')?.({ conversationId: 'conv-1', sender: 'admin', isTyping: true }));
  expect(result.current.typing).toBe(true);
  act(() => jest.advanceTimersByTime(6000));
  expect(result.current.typing).toBe(false);
  jest.useRealTimers();
});
