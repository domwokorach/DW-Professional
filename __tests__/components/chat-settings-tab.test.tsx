import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatSettingsTab from '@/components/admin/settings/ChatSettingsTab';
import type { Preferences } from '@/components/admin/settings/SettingsView';
import { mockFetchOnce, jsonResponse } from '../../test/mockFetch';
import { toast, resetSonnerMocks } from '../../test/mocks/sonner';

afterEach(() => resetSonnerMocks());

const preferences: Preferences = {
  theme: 'dark',
  language: 'en-GB',
  timeZone: 'Europe/London',
  notifications: { newMessage: true, sound: false, browserPush: true },
};

describe('ChatSettingsTab', () => {
  it('renders the availability select and notification switches with initial values', () => {
    render(<ChatSettingsTab initialAvailability="ONLINE" initialPreferences={preferences} />);

    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByLabelText('New message notifications')).toBeChecked();
    expect(screen.getByLabelText('Sound notifications')).not.toBeChecked();
    expect(screen.getByLabelText('Browser notifications')).toBeChecked();
  });

  it('toggling a notification switch immediately persists the new preference payload', async () => {
    const fetchSpy = mockFetchOnce(jsonResponse({}));

    render(<ChatSettingsTab initialAvailability="ONLINE" initialPreferences={preferences} />);
    const user = userEvent.setup();

    await user.click(screen.getByLabelText('Sound notifications'));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/admin/settings');
    expect(JSON.parse(fetchSpy.mock.calls[0][1].body)).toEqual({
      notifications: { newMessage: true, sound: true, browserPush: true },
    });
    expect(screen.getByLabelText('Sound notifications')).toBeChecked();
  });

  it(
    'changing availability persists it and shows an error toast on failure',
    async () => {
      mockFetchOnce(jsonResponse({ error: { message: 'nope' } }, false, 500));

      render(<ChatSettingsTab initialAvailability="ONLINE" initialPreferences={preferences} />);
      const user = userEvent.setup();

      await user.click(screen.getByRole('combobox'));
      await user.click(await screen.findByRole('option', { name: /away/i }));

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Couldn't save your preference."));
      expect(screen.getByText('Away')).toBeInTheDocument();
    },
    45000
  );
});
