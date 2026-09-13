import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import { mockFetchOnce, jsonResponse } from '../../test/mockFetch';

describe('ForgotPasswordForm', () => {
  it('renders the email input', () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('shows the generic success message after a 200 response, whether or not the account exists', async () => {
    mockFetchOnce(jsonResponse({}));

    render(<ForgotPasswordForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Email'), 'someone@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByText(/check your email/i)).toBeInTheDocument();
    expect(screen.getByText(/someone@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/if an account exists for/i)).toBeInTheDocument();
  });

  it('shows a network error state without crashing when the request fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down')) as unknown as typeof fetch;

    render(<ForgotPasswordForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Email'), 'someone@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/network error/i);
    // Still on the form, not the "check your email" state.
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('shows the API error message on a non-ok response', async () => {
    mockFetchOnce(jsonResponse({ error: { message: 'Too many requests. Try again later.' } }, false, 429));

    render(<ForgotPasswordForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Email'), 'someone@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Too many requests. Try again later.');
  });
});
