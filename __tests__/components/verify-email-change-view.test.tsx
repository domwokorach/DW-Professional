import { render, screen } from '@testing-library/react';
import VerifyEmailChangeView from '@/components/auth/VerifyEmailChangeView';
import { mockFetchOnce, jsonResponse } from '../../test/mockFetch';
import { __setMockSearchParams, resetNextNavigationMocks } from '../../test/mocks/next-navigation';

afterEach(() => resetNextNavigationMocks());

describe('VerifyEmailChangeView', () => {
  it('shows an invalid-link state immediately when there is no token, without calling the API', () => {
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    render(<VerifyEmailChangeView />);

    expect(screen.getByText(/invalid link/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('shows a verifying/pending state before the API responds', () => {
    let resolveFetch: (value: unknown) => void = () => {};
    global.fetch = jest.fn(() => new Promise((resolve) => (resolveFetch = resolve))) as unknown as typeof fetch;
    __setMockSearchParams({ token: 'good-token' });

    render(<VerifyEmailChangeView />);

    expect(screen.getByText(/confirming your email/i)).toBeInTheDocument();
    // avoid unused var lint noise; not resolved in this test
    void resolveFetch;
  });

  it('shows a success state when the API confirms the change', async () => {
    __setMockSearchParams({ token: 'good-token' });
    mockFetchOnce(jsonResponse({}));

    render(<VerifyEmailChangeView />);

    expect(await screen.findByText(/email address updated/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to sign in/i })).toHaveAttribute('href', '/auth/sign-in');
  });

  it('shows an expired-link state with a link back to settings', async () => {
    __setMockSearchParams({ token: 'expired-token' });
    mockFetchOnce(
      jsonResponse({ error: { code: 'expired_token', message: 'This link has expired.' } }, false, 400)
    );

    render(<VerifyEmailChangeView />);

    expect(await screen.findByText(/link expired/i)).toBeInTheDocument();
    expect(screen.getByText('This link has expired.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to settings/i })).toHaveAttribute('href', '/admin/settings');
  });

  it('shows an email-in-use state', async () => {
    __setMockSearchParams({ token: 'taken-token' });
    mockFetchOnce(
      jsonResponse({ error: { code: 'email_in_use', message: 'That address is already in use.' } }, false, 409)
    );

    render(<VerifyEmailChangeView />);

    expect(await screen.findByText(/email already in use/i)).toBeInTheDocument();
  });

  it('shows a generic error state on network failure', async () => {
    __setMockSearchParams({ token: 'good-token' });
    global.fetch = jest.fn().mockRejectedValue(new Error('down')) as unknown as typeof fetch;

    render(<VerifyEmailChangeView />);

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });
});
