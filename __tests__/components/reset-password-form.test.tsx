import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { mockFetchOnce, jsonResponse } from '../../test/mockFetch';
import { __setMockSearchParams, resetNextNavigationMocks } from '../../test/mocks/next-navigation';

afterEach(() => resetNextNavigationMocks());

const STRONG_PASSWORD = 'Str0ng!Password';

describe('ResetPasswordForm', () => {
  it('renders an invalid-link state when no token is present in the URL', () => {
    render(<ResetPasswordForm />);
    expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /request a new link/i })).toHaveAttribute(
      'href',
      '/auth/forgot-password'
    );
  });

  it('renders the password form when a token is present', () => {
    __setMockSearchParams({ token: 'good-token' });
    render(<ResetPasswordForm />);
    expect(screen.getByLabelText('New password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm new password')).toBeInTheDocument();
  });

  it('toggles password visibility for both password fields together', async () => {
    __setMockSearchParams({ token: 'good-token' });
    render(<ResetPasswordForm />);
    const user = userEvent.setup();

    const newPassword = screen.getByLabelText('New password') as HTMLInputElement;
    const confirmPassword = screen.getByLabelText('Confirm new password') as HTMLInputElement;
    expect(newPassword.type).toBe('password');
    expect(confirmPassword.type).toBe('password');

    await user.click(screen.getByRole('button', { name: /show password/i }));
    expect(newPassword.type).toBe('text');
    expect(confirmPassword.type).toBe('text');
  });

  it('blocks submission and shows a mismatch error when passwords do not match', async () => {
    __setMockSearchParams({ token: 'good-token' });
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    render(<ResetPasswordForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('New password'), STRONG_PASSWORD);
    await user.type(screen.getByLabelText('Confirm new password'), 'DoesNotMatch1!');

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeDisabled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('submits and shows a success state when the passwords match and meet the strength rules', async () => {
    __setMockSearchParams({ token: 'good-token' });
    mockFetchOnce(jsonResponse({}));

    render(<ResetPasswordForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('New password'), STRONG_PASSWORD);
    await user.type(screen.getByLabelText('Confirm new password'), STRONG_PASSWORD);
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText(/password reset/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/auth/sign-in');
  });

  it('surfaces an invalid/expired token error returned by the API', async () => {
    __setMockSearchParams({ token: 'expired-token' });
    mockFetchOnce(jsonResponse({ error: { message: 'This reset link is invalid or has expired.' } }, false, 400));

    render(<ResetPasswordForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('New password'), STRONG_PASSWORD);
    await user.type(screen.getByLabelText('Confirm new password'), STRONG_PASSWORD);
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('This reset link is invalid or has expired.');
    // Stays on the form rather than showing the success state.
    expect(screen.getByLabelText('New password')).toBeInTheDocument();
  });
});
