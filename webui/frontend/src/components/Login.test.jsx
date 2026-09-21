import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Login from './Login';

describe('Login Component', () => {
  const setTokenMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders login form with title, inputs, and button', () => {
    render(<Login setToken={setTokenMock} />);

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByText('Login to manage your Minecraft Server.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('admin')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /access dashboard/i })).toBeInTheDocument();
  });

  it('allows user to type username and password', async () => {
    const user = userEvent.setup();
    render(<Login setToken={setTokenMock} />);

    const usernameInput = screen.getByPlaceholderText('admin');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'Hehehe@123');

    expect(usernameInput).toHaveValue('admin');
    expect(passwordInput).toHaveValue('Hehehe@123');
  });

  it('calls setToken with token on successful login submission', async () => {
    const user = userEvent.setup();
    const fakeToken = 'sample-jwt-token';

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: fakeToken }),
    });

    render(<Login setToken={setTokenMock} />);

    await user.type(screen.getByPlaceholderText('admin'), 'admin');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Hehehe@123');
    await user.click(screen.getByRole('button', { name: /access dashboard/i }));

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Hehehe@123' }),
    });

    await waitFor(() => {
      expect(setTokenMock).toHaveBeenCalledWith(fakeToken);
    });
  });

  it('displays error message when login fails with non-ok response', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Invalid credentials';

    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: errorMessage }),
    });

    render(<Login setToken={setTokenMock} />);

    await user.type(screen.getByPlaceholderText('admin'), 'admin');
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /access dashboard/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(setTokenMock).not.toHaveBeenCalled();
  });

  it('displays connection error message when fetch throws an error', async () => {
    const user = userEvent.setup();

    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<Login setToken={setTokenMock} />);

    await user.type(screen.getByPlaceholderText('admin'), 'admin');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password');
    await user.click(screen.getByRole('button', { name: /access dashboard/i }));

    await waitFor(() => {
      expect(screen.getByText('Failed to connect to backend.')).toBeInTheDocument();
    });

    expect(setTokenMock).not.toHaveBeenCalled();
  });
});
