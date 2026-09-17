import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import { AuthProvider } from '../../context/AuthContext';
import { AuthButton } from './AuthButton';

describe('AuthButton component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ user: null }),
      } as any)
    );
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <AppProvider>
        <AuthProvider>{ui}</AuthProvider>
      </AppProvider>
    );
  };

  it('should render login button when user is not logged in', () => {
    renderWithProviders(<AuthButton />);
    expect(screen.getByText('ログイン')).toBeDefined();
  });

  it('should open login provider modal when login button is clicked', () => {
    renderWithProviders(<AuthButton />);
    fireEvent.click(screen.getByText('ログイン'));

    expect(screen.getByText('Googleでログイン')).toBeDefined();
    expect(screen.getByText('Xでログイン')).toBeDefined();
  });

  it('should render user name and logout button when user is logged in', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url: any) => {
      if (typeof url === 'string' && url.includes('/api/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              user: {
                id: 'usr-1',
                name: 'サトシ',
                avatarUrl: 'https://example.com/avatar.png',
                authProvider: 'google',
              },
            }),
        } as any);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as any);
    });

    renderWithProviders(<AuthButton />);

    await waitFor(() => {
      expect(screen.getByText('サトシ')).toBeDefined();
    });

    // ログアウトボタン（テキスト付き）が表示されること
    const logoutBtn = screen.getByRole('button', { name: /ログアウト/i });
    expect(logoutBtn).toBeDefined();
    expect(logoutBtn.textContent).toContain('ログアウト');
  });

  it('should call logout and show login button when logout button is clicked', async () => {
    let currentUser: any = {
      id: 'usr-1',
      name: 'サトシ',
      avatarUrl: 'https://example.com/avatar.png',
      authProvider: 'google',
    };

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation((url: any) => {
        if (typeof url === 'string' && url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ user: currentUser }),
          } as any);
        }
        if (typeof url === 'string' && url.includes('/api/auth/logout')) {
          currentUser = null;
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          } as any);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as any);
      });

    renderWithProviders(<AuthButton />);

    await waitFor(() => {
      expect(screen.getByText('サトシ')).toBeDefined();
    });

    const logoutBtn = screen.getByRole('button', { name: /ログアウト/i });
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
      });
      expect(screen.getByText('ログイン')).toBeDefined();
    });
  });
});
