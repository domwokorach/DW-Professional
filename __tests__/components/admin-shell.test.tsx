import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminShell from '@/components/admin/AdminShell';
import { mockFetchOnce, jsonResponse } from '../../test/mockFetch';
import { __mockRouter, resetNextNavigationMocks } from '../../test/mocks/next-navigation';
import type { AdminSession } from '@/lib/auth/guard';

const admin: AdminSession = {
  userId: 'user_1',
  email: 'dominic-wokorach@outlook.com',
  name: 'Dominic Wokorach',
  role: 'SUPER_ADMIN',
  status: 'ACTIVE',
  avatarUrl: null,
  sessionId: 'session_1',
};

afterEach(() => resetNextNavigationMocks());

describe('AdminShell', () => {
  it('renders nav links to chat, account, settings, and devices', () => {
    render(
      <AdminShell admin={admin}>
        <p>content</p>
      </AdminShell>
    );

    expect(screen.getByRole('link', { name: 'Chat' })).toHaveAttribute('href', '/admin/chat');
    expect(screen.getAllByRole('link', { name: /account/i })[0]).toHaveAttribute('href', '/admin/account');
    expect(screen.getAllByRole('link', { name: /settings/i })[0]).toHaveAttribute('href', '/admin/settings');
    expect(screen.getAllByRole('link', { name: /devices/i })[0]).toHaveAttribute('href', '/admin/devices');
  });

  it("renders the admin's name and a role badge derived from their role", async () => {
    render(
      <AdminShell admin={admin}>
        <p>content</p>
      </AdminShell>
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /dominic wokorach/i }));

    await waitFor(() => expect(screen.getByText('Super Admin')).toBeInTheDocument());
    expect(screen.getByText(admin.email)).toBeInTheDocument();
  });

  it('signing out calls the sign-out API and redirects to sign-in', async () => {
    mockFetchOnce(jsonResponse({ ok: true }));

    render(
      <AdminShell admin={admin}>
        <p>content</p>
      </AdminShell>
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /dominic wokorach/i }));
    await user.click(await screen.findByText('Sign Out'));

    await waitFor(() => expect(__mockRouter.push).toHaveBeenCalledWith('/auth/sign-in'));
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/sign-out', expect.objectContaining({ method: 'POST' }));
  });

  it('renders children inside the layout', () => {
    render(
      <AdminShell admin={admin}>
        <p>unique admin content marker</p>
      </AdminShell>
    );
    expect(screen.getByText('unique admin content marker')).toBeInTheDocument();
  });
});
