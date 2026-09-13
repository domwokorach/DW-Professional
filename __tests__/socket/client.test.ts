// An explicit factory avoids Jest's automock walking socket.io-client's real
// (large, class-heavy) module shape, which can hang rather than mocking cleanly.
jest.mock('socket.io-client', () => ({ io: jest.fn() }));

import { io } from 'socket.io-client';
import { createSocket } from '@/lib/socket/client';

describe('createSocket', () => {
  it('builds a non-auto-connecting socket with the expected transport/reconnection config', () => {
    createSocket(async () => 'a-token');

    expect(io).toHaveBeenCalledTimes(1);
    const [, options] = (io as jest.Mock).mock.calls[0];
    expect(options.autoConnect).toBe(false);
    expect(options.transports).toEqual(['polling', 'websocket']);
    expect(options.reconnection).toBe(true);
    expect(options.reconnectionAttempts).toBe(Infinity);
  });

  it("the auth callback resolves the caller's token fetcher and hands the token to socket.io's callback", async () => {
    createSocket(async () => 'fresh-token');
    const [, options] = (io as jest.Mock).mock.calls[0];

    const socketIoCallback = jest.fn();
    options.auth(socketIoCallback);
    await new Promise((resolve) => setImmediate(resolve));

    expect(socketIoCallback).toHaveBeenCalledWith({ token: 'fresh-token' });
  });

  it('the auth callback hands back an empty token when the fetcher rejects, instead of throwing', async () => {
    createSocket(async () => {
      throw new Error('network error');
    });
    const [, options] = (io as jest.Mock).mock.calls[0];

    const socketIoCallback = jest.fn();
    expect(() => options.auth(socketIoCallback)).not.toThrow();
    await new Promise((resolve) => setImmediate(resolve));

    expect(socketIoCallback).toHaveBeenCalledWith({ token: '' });
  });
});
