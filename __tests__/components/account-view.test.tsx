import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountView from '@/components/admin/account/AccountView';
import { mockFetchOnce, jsonResponse } from '../../test/mockFetch';
import { toast, resetSonnerMocks } from '../../test/mocks/sonner';

afterEach(() => resetSonnerMocks());

const user1 = {
  id: 'u1',
  name: 'Dominic Olanya',
  email: 'dominic@example.com',
  role: 'ADMIN' as const,
  status: 'ACTIVE' as const,
  avatarUrl: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  lastLoginAt: '2024-06-01T10:00:00.000Z',
  emailVerifiedAt: '2024-01-02T00:00:00.000Z',
};

describe('AccountView', () => {
  it('displays the current user name, email, role and status', () => {
    render(<AccountView user={user1} />);

    expect(screen.getByText('Dominic Olanya')).toBeInTheDocument();
    expect(screen.getByText('dominic@example.com')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('updates the profile and reflects the change in the UI on success', async () => {
    mockFetchOnce(jsonResponse({ user: { name: 'New Name', avatarUrl: null } }));

    render(<AccountView user={user1} />);
    const testUser = userEvent.setup();

    await testUser.click(screen.getByRole('button', { name: /edit/i }));
    const nameInput = screen.getByLabelText('Name');
    await testUser.clear(nameInput);
    await testUser.type(nameInput, 'New Name');
    await testUser.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(screen.getByText('New Name')).toBeInTheDocument());
    expect(toast.success).toHaveBeenCalled();
    // Dialog closes on success.
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
  });

  it('surfaces an error toast when the update fails', async () => {
    mockFetchOnce(jsonResponse({ error: { message: "Couldn't update your profile." } }, false, 400));

    render(<AccountView user={user1} />);
    const testUser = userEvent.setup();

    await testUser.click(screen.getByRole('button', { name: /edit/i }));
    await testUser.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Couldn't update your profile."));
    // Dialog stays open, original name unchanged.
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByText('Dominic Olanya')).toBeInTheDocument();
  });
});
