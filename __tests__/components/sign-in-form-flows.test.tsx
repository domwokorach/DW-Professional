import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignInForm from '@/components/auth/SignInForm';
import { mockFetchOnce, jsonResponse } from '../../test/mockFetch';
import { __mockRouter, resetNextNavigationMocks } from '../../test/mocks/next-navigation';

afterEach(() => {
  resetNextNavigationMocks();
  window.history.pushState({}, '', '/');
});

describe('SignInForm', () => {
  it('toggles password visibility', async () => {
    render(<SignInForm />);
    const user = userEvent.setup();

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    await user.click(screen.getByRole('button', { name: /show password/i }));
    expect(passwordInput.type).toBe('text');

    await user.click(screen.getByRole('button', { name: /hide password/i }));
    expect(passwordInput.type).toBe('password');
  });

  it('disables the submit button and shows a loading label while submitting', async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    const pending = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    global.fetch = jest.fn(() => pending) as unknown as typeof fetch;

    render(<SignInForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Email'), 'a@b.com');
    await user.type(screen.getByLabelText('Password'), 'CorrectHorse9!Battery');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    const submitButton = await screen.findByRole('button', { name: /signing in/i });
    expect(submitButton).toBeDisabled();

    await act(async () => {
      resolveFetch({
        ok: true,
        json: async () => ({ user: { id: 'u1', name: 'Dominic', email: 'a@b.com', role: 'ADMIN', avatarUrl: null } }),
      });
      await pending;
    });

    await waitFor(() => expect(__mockRouter.push).toHaveBeenCalled());
  });

  it('shows a field-level and general error on a validation failure', async () => {
    mockFetchOnce(
      jsonResponse(
        { error: { message: 'Invalid email or password.', fields: { email: 'Enter a valid email address.' } } },
        false,
        422
      )
    );

    render(<SignInForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'whatever');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(__mockRouter.push).not.toHaveBeenCalled();
  });

  it('redirects to the default admin route on success with no redirect_url param', async () => {
    mockFetchOnce(
      jsonResponse({ user: { id: 'u1', name: 'Dominic', email: 'a@b.com', role: 'ADMIN', avatarUrl: null } })
    );

    render(<SignInForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Email'), 'a@b.com');
    await user.type(screen.getByLabelText('Password'), 'CorrectHorse9!Battery');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(__mockRouter.push).toHaveBeenCalledWith('/admin/chat'));
    expect(__mockRouter.refresh).toHaveBeenCalled();
  });

  it('redirects to the redirect_url query param when present', async () => {
    window.history.pushState({}, '', '/auth/sign-in?redirect_url=%2Fadmin%2Flive-chat');
    mockFetchOnce(
      jsonResponse({ user: { id: 'u1', name: 'Dominic', email: 'a@b.com', role: 'ADMIN', avatarUrl: null } })
    );

    render(<SignInForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Email'), 'a@b.com');
    await user.type(screen.getByLabelText('Password'), 'CorrectHorse9!Battery');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(__mockRouter.push).toHaveBeenCalledWith('/admin/live-chat'));
  });

  it('renders a Forgot password? link pointing at the forgot-password route', () => {
    render(<SignInForm />);
    const link = screen.getByRole('link', { name: /forgot password/i });
    expect(link).toHaveAttribute('href', '/auth/forgot-password');
  });
});
