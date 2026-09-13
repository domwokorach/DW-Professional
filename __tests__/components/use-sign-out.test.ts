import { renderHook, act } from '@testing-library/react';
import { useSignOut } from '@/hooks/use-sign-out';
import { mockFetchOnce, jsonResponse } from '../../test/mockFetch';
import { __mockRouter, resetNextNavigationMocks } from '../../test/mocks/next-navigation';

afterEach(() => resetNextNavigationMocks());

describe('useSignOut', () => {
  it('calls the sign-out API, dispatches admin-sign-out, and redirects to sign-in', async () => {
    mockFetchOnce(jsonResponse({ ok: true }));
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

    const { result } = renderHook(() => useSignOut());
    await act(async () => {
      await result.current.signOut();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/sign-out', expect.objectContaining({ method: 'POST' }));
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'admin-sign-out' }));
    expect(__mockRouter.push).toHaveBeenCalledWith('/auth/sign-in');
    expect(__mockRouter.refresh).toHaveBeenCalled();
  });

  it('still redirects to sign-in even when the sign-out request itself fails', async () => {
    (global.fetch as jest.Mock) = jest.fn().mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useSignOut());
    await act(async () => {
      await result.current.signOut();
    });

    expect(__mockRouter.push).toHaveBeenCalledWith('/auth/sign-in');
  });

  it('reflects signingOut state while the sign-out request is in flight', async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    (global.fetch as jest.Mock) = jest.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    const { result } = renderHook(() => useSignOut());
    expect(result.current.signingOut).toBe(false);

    let signOutPromise: Promise<void>;
    act(() => {
      signOutPromise = result.current.signOut();
    });
    expect(result.current.signingOut).toBe(true);

    await act(async () => {
      resolveFetch({ ok: true, json: async () => ({}) });
      await signOutPromise!;
    });
  });
});
