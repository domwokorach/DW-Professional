import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminUnauthorized from '@/components/admin/AdminUnauthorized';
import { mockFetchOnce, jsonResponse } from '../../test/mockFetch';
import { __mockRouter, resetNextNavigationMocks } from '../../test/mocks/next-navigation';

afterEach(() => resetNextNavigationMocks());

describe('AdminUnauthorized', () => {
  it('signed-out variant shows a sign-in link with a redirect_url back to admin chat', () => {
    render(<AdminUnauthorized variant="signed-out" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Access restricted');
    const signInLink = screen.getByRole('link', { name: 'Sign in to Admin' });
    expect(signInLink).toHaveAttribute('href', expect.stringContaining('/auth/sign-in'));
    expect(signInLink).toHaveAttribute('href', expect.stringContaining(encodeURIComponent('/admin/chat')));
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument();
  });

  it('forbidden variant offers signing out instead of a sign-in link', async () => {
    mockFetchOnce(jsonResponse({ ok: true }));
    render(<AdminUnauthorized variant="forbidden" />);

    expect(screen.getByText(/does not have administrator permissions/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Sign in to Admin' })).not.toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /sign out and use another account/i }));

    await waitFor(() => expect(__mockRouter.push).toHaveBeenCalled());
  });

  it('always offers a way back to the public portfolio', () => {
    render(<AdminUnauthorized variant="signed-out" />);
    expect(screen.getByRole('link', { name: 'Return to Portfolio' })).toHaveAttribute('href', '/');
  });
});
