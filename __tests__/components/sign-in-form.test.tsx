import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignInForm from '@/components/auth/SignInForm';
import { mockFetchOnce, jsonResponse } from '../../test/mockFetch';
import { __mockRouter, resetNextNavigationMocks } from '../../test/mocks/next-navigation';

afterEach(() => resetNextNavigationMocks());

describe('SignInForm smoke test', () => {
  it('renders email/password fields and submits successfully', async () => {
    mockFetchOnce(
      jsonResponse({ user: { id: 'u1', name: 'Dominic', email: 'a@b.com', role: 'ADMIN', avatarUrl: null } })
    );

    render(<SignInForm />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Email'), 'dominic-wokorach@outlook.com');
    await user.type(screen.getByLabelText('Password'), 'CorrectHorse9!Battery');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(__mockRouter.push).toHaveBeenCalled());
  });
});
