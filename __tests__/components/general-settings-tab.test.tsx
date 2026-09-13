import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GeneralSettingsTab from '@/components/admin/settings/GeneralSettingsTab';
import type { Preferences } from '@/components/admin/settings/SettingsView';
import { mockFetchSequence, jsonResponse } from '../../test/mockFetch';
import { toast, resetSonnerMocks } from '../../test/mocks/sonner';

afterEach(() => resetSonnerMocks());

const preferences: Preferences = {
  theme: 'dark',
  language: 'en-GB',
  timeZone: 'Europe/London',
  notifications: { newMessage: true, sound: false, browserPush: true },
};

describe('GeneralSettingsTab', () => {
  it('renders the display name field and current preference values', () => {
    render(<GeneralSettingsTab initialName="Dominic" initialPreferences={preferences} />);
    expect(screen.getByLabelText('Display name')).toHaveValue('Dominic');
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('English (UK)')).toBeInTheDocument();
    expect(screen.getByText('Europe/London')).toBeInTheDocument();
  });

  it(
    'changing the theme select updates the displayed value',
    async () => {
      render(<GeneralSettingsTab initialName="Dominic" initialPreferences={preferences} />);
      const user = userEvent.setup();

      const triggers = screen.getAllByRole('combobox');
      await user.click(triggers[0]); // Theme trigger
      await user.click(await screen.findByRole('option', { name: 'Light' }));

      expect(screen.getByText('Light')).toBeInTheDocument();
    },
    45000
  );

  it('saves the name and preferences, calling both PATCH endpoints', async () => {
    const fetchSpy = mockFetchSequence([jsonResponse({}), jsonResponse({})]);

    render(<GeneralSettingsTab initialName="Dominic" initialPreferences={preferences} />);
    const user = userEvent.setup();

    const nameInput = screen.getByLabelText('Display name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Dom O.');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Settings saved.'));

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const [firstCall, secondCall] = fetchSpy.mock.calls;
    expect(firstCall[0]).toBe('/api/admin/account');
    expect(JSON.parse(firstCall[1].body)).toEqual({ name: 'Dom O.' });
    expect(secondCall[0]).toBe('/api/admin/settings');
    expect(JSON.parse(secondCall[1].body)).toEqual({
      theme: 'dark',
      language: 'en-GB',
      timeZone: 'Europe/London',
    });
  });

  it('shows an error toast when either save request fails', async () => {
    mockFetchSequence([jsonResponse({}), jsonResponse({ error: { message: 'nope' } }, false, 500)]);

    render(<GeneralSettingsTab initialName="Dominic" initialPreferences={preferences} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Couldn't save your changes."));
  });
});
