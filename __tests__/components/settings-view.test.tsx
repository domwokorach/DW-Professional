import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsView, { type Preferences } from '@/components/admin/settings/SettingsView';
import { jsonResponse } from '../../test/mockFetch';

const preferences: Preferences = {
  theme: 'dark',
  language: 'en-GB',
  timeZone: 'Europe/London',
  notifications: { newMessage: true, sound: false, browserPush: true },
};

describe('SettingsView', () => {
  beforeEach(() => {
    // The Security tab's "Recent security activity" card fetches on mount
    // once that tab becomes active; keep every render network-safe.
    global.fetch = jest.fn().mockResolvedValue(jsonResponse({ events: [] })) as unknown as typeof fetch;
  });

  it('renders General, Chat and Security tabs with General active by default', () => {
    render(<SettingsView name="Dominic" email="dominic@example.com" availability="ONLINE" preferences={preferences} />);

    expect(screen.getByRole('tab', { name: 'General' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('Display name')).toBeInTheDocument();
  });

  it('switches to the Chat tab and shows its controls when clicked', async () => {
    render(<SettingsView name="Dominic" email="dominic@example.com" availability="ONLINE" preferences={preferences} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('tab', { name: 'Chat' }));

    expect(await screen.findByText('Notifications')).toBeInTheDocument();
    expect(screen.getByLabelText('New message notifications')).toBeInTheDocument();
    expect(screen.queryByLabelText('Display name')).not.toBeInTheDocument();
  });

  it('switches to the Security tab and shows its controls when clicked', async () => {
    render(<SettingsView name="Dominic" email="dominic@example.com" availability="ONLINE" preferences={preferences} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('tab', { name: 'Security' }));

    expect(await screen.findByText(/changing your password signs out every other active session/i)).toBeInTheDocument();
    expect(screen.getByText(/current address: dominic@example.com/i)).toBeInTheDocument();
  });
});
