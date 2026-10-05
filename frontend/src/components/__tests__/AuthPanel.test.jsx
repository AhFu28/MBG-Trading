/**
 * Tests for the sign-in escape hatch.
 *
 * WHY THIS EXISTS:
 * The owner shipped a rebuilt login screen and could not get in — the account
 * database was not configured, so email/password was impossible and nothing on
 * screen said so. He had to ask "what are the email and password?".
 *
 * These tests pin the behaviour that prevents that: when accounts are not
 * switched on, the panel must SAY so and must LEAD with the one path that
 * actually works (the owner system password).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthPanel from '../../components/AuthPanel.jsx';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('when accounts are not configured', () => {
  it('says plainly that registration is not switched on', () => {
    render(<AuthPanel accountsReady={false} />);
    expect(screen.getByText(/pendaftaran akun belum diaktifkan/i)).toBeTruthy();
  });

  it('opens directly on the owner password form, not the email form', () => {
    render(<AuthPanel accountsReady={false} />);
    // The owner heading, not "Masuk ke Akun Anda".
    expect(screen.getByText(/akses pemilik/i)).toBeTruthy();
    expect(screen.queryByText(/masuk ke akun anda/i)).toBeNull();
  });

  it('does not ask for an email at all', () => {
    // An email field here is the trap: there is no account to look up.
    render(<AuthPanel accountsReady={false} />);
    expect(screen.queryByLabelText(/^email$/i)).toBeNull();
  });

  it('explains that this is the system password, not a customer email', () => {
    render(<AuthPanel accountsReady={false} />);
    // Appears both in the warning banner and the owner hint — both are correct.
    expect(screen.getAllByText(/kata sandi sistem/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/bukan email pelanggan/i)).toBeTruthy();
  });

  it('still renders a password field', () => {
    render(<AuthPanel accountsReady={false} />);
    expect(screen.getByLabelText(/kata sandi/i)).toBeTruthy();
  });
});

describe('when accounts are ready', () => {
  it('opens on the normal login form', () => {
    render(<AuthPanel accountsReady />);
    expect(screen.getByText(/masuk ke akun anda/i)).toBeTruthy();
  });

  it('does not show the not-configured warning', () => {
    render(<AuthPanel accountsReady />);
    expect(screen.queryByText(/pendaftaran akun belum diaktifkan/i)).toBeNull();
  });

  it('offers the owner path as a link for the operator', () => {
    render(<AuthPanel accountsReady />);
    expect(screen.getByText(/akses pemilik/i)).toBeTruthy();
  });

  it('can switch to signup', () => {
    render(<AuthPanel accountsReady />);
    fireEvent.click(screen.getByText(/^daftar$/i));
    expect(screen.getByText(/buat akun gratis/i)).toBeTruthy();
  });
});

describe('owner sign-in', () => {
  it('posts to the legacy cockpit password endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ authenticated: true, tier: 'PRO' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const onAuthenticated = vi.fn();
    render(<AuthPanel accountsReady={false} onAuthenticated={onAuthenticated} />);

    fireEvent.change(screen.getByLabelText(/kata sandi/i), { target: { value: 'MBG' } });
    fireEvent.click(screen.getByRole('button', { name: /masuk/i }));

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith('/api/auth', expect.anything());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.password).toBe('MBG');
  });

  it('shows a readable error when the password is wrong', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid credentials' }),
    }));

    render(<AuthPanel accountsReady={false} />);
    fireEvent.change(screen.getByLabelText(/kata sandi/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /masuk/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
  });

  it('does not call the network with an empty password', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<AuthPanel accountsReady={false} />);
    fireEvent.click(screen.getByRole('button', { name: /masuk/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
