import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SecuritySettingsTab from '@/components/admin/settings/SecuritySettingsTab';
import { mockFetchSequence, mockFetchOnce, jsonResponse } from '../../test/mockFetch';
import { toast, resetSonnerMocks } from '../../test/mocks/sonner';
import { resetNextNavigationMocks } from '../../test/mocks/next-navigation';

afterEach(() => {
  resetSonnerMocks();
  resetNextNavigationMocks();
});

// "Current password" is used as a label in both the Change password card and
// the Change email card, so plain getByLabelText is ambiguous — resolve via
// the field's id instead (both fields remain reachable by their accessible
// label; this just disambiguates which of the two).
function currentPasswordFieldFor(cardTitle: string) {
  const heading = screen.getAllByText(cardTitle).find((el) => el.tagName === 'DIV') as HTMLElement;
  const card = heading.closest('[class*="rounded-xl"]') as HTMLElement;
  return within(card).getByLabelText('Current password');
}

describe('SecuritySettingsTab', () => {
  it('changes password and clears the form on success', async () => {
    const fetchSpy = mockFetchSequence([jsonResponse({ events: [] }), jsonResponse({})]);

    render(<SecuritySettingsTab email="dominic@example.com" />);
    const user = userEvent.setup();

    await user.type(currentPasswordFieldFor('Change password'), 'OldPassw0rd!');
    await user.type(screen.getByLabelText(/new password/i), 'NewPassw0rd!!');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Password changed. Other sessions have been signed out.')
    );
    expect(fetchSpy.mock.calls[1][0]).toBe('/api/auth/change-password');
    expect(currentPasswordFieldFor('Change password')).toHaveValue('');
  });

  it('shows an error toast when the password change request fails', async () => {
    mockFetchSequence([jsonResponse({ events: [] }), jsonResponse({ error: { message: 'Wrong password.' } }, false, 400)]);

    render(<SecuritySettingsTab email="dominic@example.com" />);
    const user = userEvent.setup();

    await user.type(currentPasswordFieldFor('Change password'), 'OldPassw0rd!');
    await user.type(screen.getByLabelText(/new password/i), 'NewPassw0rd!!');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Wrong password.'));
  });

  it('requests an email change and shows the pending-verification message', async () => {
    mockFetchSequence([jsonResponse({ events: [] }), jsonResponse({ message: 'Verification link sent.' })]);

    render(<SecuritySettingsTab email="dominic@example.com" />);
    const user = userEvent.setup();

    await user.type(currentPasswordFieldFor('Change email'), 'OldPassw0rd!');
    await user.type(screen.getByLabelText('New email address'), 'new@example.com');
    await user.click(screen.getByRole('button', { name: /send verification link/i }));

    expect(await screen.findByText(/a verification link was sent to/i)).toBeInTheDocument();
    expect(screen.getByText('new@example.com')).toBeInTheDocument();
  });

  it('does not revoke other devices until the confirmation dialog is confirmed', async () => {
    const fetchSpy = mockFetchSequence([jsonResponse({ events: [] }), jsonResponse({})]);

    render(<SecuritySettingsTab email="dominic@example.com" />);
    const user = userEvent.setup();

    const trigger = screen.getByRole('button', { name: /sign out other devices/i });
    await user.click(trigger);
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /cancel/i }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(fetchSpy).toHaveBeenCalledTimes(1); // only the initial security-events fetch

    await user.click(trigger);
    const reopenedDialog = await screen.findByRole('alertdialog');
    await user.click(within(reopenedDialog).getByRole('button', { name: /sign out other devices/i }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Every other device has been signed out.'));
    expect(fetchSpy.mock.calls[1][0]).toBe('/api/auth/sessions/revoke-others');
  });

  it('shows recent security activity fetched on mount, and an empty state when there is none', async () => {
    mockFetchOnce(jsonResponse({ events: [] }));

    render(<SecuritySettingsTab email="dominic@example.com" />);

    expect(await screen.findByText('No recent activity.')).toBeInTheDocument();
  });
});
