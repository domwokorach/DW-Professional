import { sendClientMessage } from '@/lib/chat/send-client-message';
import { MESSAGE_SAVE_FAILED_ERROR } from '@/lib/chat/constants';
import type { ChatSocket } from '@/lib/socket/client';

const payload = { conversationId: 'conv-1', content: 'hi hi hi', clientMessageId: 'cid-1' };
const saved = { id: 'msg-1', conversationId: 'conv-1', content: 'hi hi hi' };

function socketAcking(response: unknown) {
  return {
    connected: true,
    id: 'sock-1',
    emit: jest.fn((_event: string, _payload: unknown, ack: (r: unknown) => void) => ack(response)),
  } as unknown as ChatSocket & { emit: jest.Mock };
}

describe('sendClientMessage', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ message: saved }) }) as jest.Mock;
  });

  it('returns the socket-acknowledged message without touching HTTP', async () => {
    const socket = socketAcking({ message: saved });
    await expect(sendClientMessage(socket, payload, 'visitor-1')).resolves.toEqual(saved);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('falls back to HTTP when the socket host fails to save the message', async () => {
    const socket = socketAcking({ error: MESSAGE_SAVE_FAILED_ERROR });
    await expect(sendClientMessage(socket, payload, 'visitor-1')).resolves.toEqual(saved);
    expect(socket.emit).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/api/chat/messages', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ ...payload, visitorId: 'visitor-1' }),
    }));
  });

  it('matches the literal text older socket builds send', () => {
    expect(MESSAGE_SAVE_FAILED_ERROR).toBe('Message could not be saved. Please retry.');
  });

  it.each(['Message not authorized or invalid.', 'Message rejected. Check the conversation or try again shortly.'])(
    'does not retry over HTTP on a final rejection: %s',
    async (error) => {
      const socket = socketAcking({ error });
      await expect(sendClientMessage(socket, payload, 'visitor-1')).rejects.toThrow(error);
      expect(fetch).not.toHaveBeenCalled();
    }
  );
});
