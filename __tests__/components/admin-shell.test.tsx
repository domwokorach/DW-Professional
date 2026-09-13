import { render, screen } from '@testing-library/react';
import AdminShell from '@/components/admin/AdminShell';
import { resetNextNavigationMocks } from '../../test/mocks/next-navigation';
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

  // The admin's name and a role label are rendered directly on the always-
  // visible dropdown trigger button itself (not gated behind opening the
  // dropdown) — see AdminShell.tsx's SidebarFooter button. Opening the Radix
  // DropdownMenu via userEvent in jsdom for this component tree hangs well
  // past a generous timeout (tried up to 20s) rather than resolving slowly,
  // so this suite verifies the trigger's own content instead of driving the
  // menu open; the menu items themselves are just <Link>s to routes already
  // covered by the "nav links" test above plus the Sign Out button, which is
  // exercised directly against useSignOut in use-sign-out.test.tsx instead.
  it("renders the admin's name and role on the account trigger without needing to open the menu", () => {
    render(
      <AdminShell admin={admin}>
        <p>content</p>
      </AdminShell>
    );

    const trigger = screen.getByRole('button', { name: /dominic wokorach/i });
    expect(trigger).toHaveTextContent('Dominic Wokorach');
    expect(trigger).toHaveTextContent('Super Admin');
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
