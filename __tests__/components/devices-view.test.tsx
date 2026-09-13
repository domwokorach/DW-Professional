import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DevicesView from '@/components/admin/devices/DevicesView';
import { mockFetchOnce, mockFetchSequence, jsonResponse } from '../../test/mockFetch';
import { toast, resetSonnerMocks } from '../../test/mocks/sonner';

afterEach(() => resetSonnerMocks());

const sessions = [
  {
    id: 'session-1',
    deviceId: 'device-1',
    deviceName: "Dominic's MacBook",
    deviceType: 'desktop',
    operatingSystem: 'macOS',
    browser: 'Chrome',
    ipAddress: '10.0.0.1',
    createdAt: '2024-01-01T00:00:00.000Z',
    lastActiveAt: new Date().toISOString(),
    expiresAt: '2024-02-01T00:00:00.000Z',
    isCurrent: true,
  },
  {
    id: 'session-2',
    deviceId: 'device-2',
    deviceName: 'iPhone 15',
    deviceType: 'mobile',
    operatingSystem: 'iOS',
    browser: 'Safari',
    ipAddress: '10.0.0.2',
    createdAt: '2024-01-02T00:00:00.000Z',
    lastActiveAt: new Date().toISOString(),
    expiresAt: '2024-02-02T00:00:00.000Z',
    isCurrent: false,
  },
];

describe('DevicesView', () => {
  it('renders the list of active sessions and labels the current device distinctly', async () => {
    mockFetchOnce(jsonResponse({ sessions }));

    render(<DevicesView />);

    expect(await screen.findByText("Dominic's MacBook")).toBeInTheDocument();
    expect(screen.getByText('iPhone 15')).toBeInTheDocument();

    const currentCard = screen.getByText("Dominic's MacBook").closest('[class*="rounded-xl"]') as HTMLElement;
    expect(within(currentCard).getByText('This device')).toBeInTheDocument();

    const otherCard = screen.getByText('iPhone 15').closest('[class*="rounded-xl"]') as HTMLElement;
    expect(within(otherCard).queryByText('This device')).not.toBeInTheDocument();
  });

  it('shows an empty state when there are no sessions', async () => {
    mockFetchOnce(jsonResponse({ sessions: [] }));

    render(<DevicesView />);

    expect(await screen.findByText('No active devices found.')).toBeInTheDocument();
  });

  it('revokes a single non-current device and removes it from the list', async () => {
    const fetchSpy = mockFetchSequence([jsonResponse({ sessions }), jsonResponse({})]);

    render(<DevicesView />);
    await screen.findByText('iPhone 15');

    const otherCard = screen.getByText('iPhone 15').closest('[class*="rounded-xl"]') as HTMLElement;
    const user = userEvent.setup();
    await user.click(within(otherCard).getByRole('button', { name: /sign out device/i }));

    await waitFor(() => expect(screen.queryByText('iPhone 15')).not.toBeInTheDocument());
    expect(fetchSpy.mock.calls[1][0]).toBe('/api/auth/sessions/session-2');
    expect(fetchSpy.mock.calls[1][1]).toMatchObject({ method: 'DELETE' });
    expect(toast.success).toHaveBeenCalledWith('Device signed out.');
    expect(screen.getByText("Dominic's MacBook")).toBeInTheDocument();
  });

  it('does not revoke other devices until the confirmation dialog is confirmed, then calls revoke-others', async () => {
    const fetchSpy = mockFetchSequence([jsonResponse({ sessions }), jsonResponse({}), jsonResponse({ sessions: [sessions[0]] })]);

    render(<DevicesView />);
    await screen.findByText('iPhone 15');

    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: /sign out all other devices/i });
    await user.click(trigger);

    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: /cancel/i }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(fetchSpy).toHaveBeenCalledTimes(1); // only the initial sessions fetch so far

    await user.click(trigger);
    const reopenedDialog = await screen.findByRole('alertdialog');
    await user.click(within(reopenedDialog).getByRole('button', { name: /sign out other devices/i }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Every other device has been signed out.'));
    expect(fetchSpy.mock.calls[1][0]).toBe('/api/auth/sessions/revoke-others');
    // Refetches the session list after revoking others.
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(3));
  });

  it('shows an error toast when revoking a device fails', async () => {
    mockFetchSequence([jsonResponse({ sessions }), jsonResponse({ error: { message: 'nope' } }, false, 500)]);

    render(<DevicesView />);
    await screen.findByText('iPhone 15');

    const otherCard = screen.getByText('iPhone 15').closest('[class*="rounded-xl"]') as HTMLElement;
    const user = userEvent.setup();
    await user.click(within(otherCard).getByRole('button', { name: /sign out device/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Couldn't sign out that device."));
    expect(screen.getByText('iPhone 15')).toBeInTheDocument();
  });
});
