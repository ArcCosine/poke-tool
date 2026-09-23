import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

describe('AuthContext', () => {
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

  it('should initialize with anonymous clientId and null user', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.clientId).toMatch(/^anon:/);
  });

  it('should persist generated clientId in localStorage', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    const firstClientId = result.current.clientId;

    // Second render should reuse the same clientId
    const { result: secondResult } = renderHook(() => useAuth(), { wrapper });
    expect(secondResult.current.clientId).toBe(firstClientId);
  });

  it('should fetch current user from /api/auth/me on mount', async () => {
    const mockUser = {
      id: 'usr_test_123',
      name: 'サトシ',
      avatarUrl: 'https://example.com/avatar.png',
      authProvider: 'google',
    };

    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ user: mockUser }),
      } as any)
    );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle logout by clearing user state and resetting all party data in localStorage', async () => {
    const mockUser = {
      id: 'usr_test_123',
      name: 'サトシ',
      avatarUrl: 'https://example.com/avatar.png',
      authProvider: 'google',
    };

    localStorage.setItem(
      'saved_parties',
      JSON.stringify([{ id: 'p1', name: 'Party 1' }])
    );
    localStorage.setItem('current_party_id', 'p1');
    localStorage.setItem('deleted_party_ids', JSON.stringify(['p_deleted']));
    localStorage.setItem(
      'saved_party',
      JSON.stringify({ name: 'legacy party' })
    );

    const resetListener = vi.fn();
    window.addEventListener('poke:parties-reset', resetListener);

    vi.spyOn(globalThis, 'fetch')
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: mockUser }),
        } as any)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as any)
      );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('saved_parties')).toBeNull();
    expect(localStorage.getItem('current_party_id')).toBeNull();
    expect(localStorage.getItem('deleted_party_ids')).toBeNull();
    expect(localStorage.getItem('saved_party')).toBeNull();
    expect(resetListener).toHaveBeenCalledTimes(1);

    window.removeEventListener('poke:parties-reset', resetListener);
  });

  it('should redirect to /api/auth/google with current pathname as redirect_to on loginWithGoogle', () => {
    const originalLocation = window.location;
    // Mock window.location
    delete (window as any).location;
    (window as any).location = {
      pathname: '/party-ranking.html',
      search: '?reg=h',
      href: '',
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.loginWithGoogle();
    });

    expect(window.location.href).toBe(
      '/api/auth/google?redirect_to=%2Fparty-ranking.html%3Freg%3Dh'
    );

    (window as any).location = originalLocation;
  });

  it('should skip /api/auth/me check and set user to null if poke_cookie_consent is rejected in localStorage', async () => {
    localStorage.setItem('poke_cookie_consent', 'rejected');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    // /api/auth/me should NOT have been called
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('should clear user state when poke:cookie-rejected event is dispatched', async () => {
    const mockUser = {
      id: 'usr_test_123',
      name: 'サトシ',
      avatarUrl: 'https://example.com/avatar.png',
      authProvider: 'google',
    };

    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ user: mockUser }),
      } as any)
    );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    // Dispatch poke:cookie-rejected event
    await act(async () => {
      window.dispatchEvent(new CustomEvent('poke:cookie-rejected'));
    });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
    });
  });

  it('should open cookie settings and prevent login if poke_cookie_consent is rejected', () => {
    localStorage.setItem('poke_cookie_consent', 'rejected');
    const originalLocation = window.location;
    delete (window as any).location;
    (window as any).location = {
      pathname: '/party-ranking.html',
      search: '',
      href: '',
    };

    const openSettingsSpy = vi.fn();
    window.addEventListener('poke:open-cookie-settings', openSettingsSpy);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.loginWithGoogle();
    });

    // Location href should not have changed to google login URL
    expect(window.location.href).toBe('');
    // Cookie settings event should have been dispatched
    expect(openSettingsSpy).toHaveBeenCalled();

    window.removeEventListener('poke:open-cookie-settings', openSettingsSpy);
    (window as any).location = originalLocation;
  });
});
