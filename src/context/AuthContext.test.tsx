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

  it('should handle logout by clearing user state', async () => {
    const mockUser = {
      id: 'usr_test_123',
      name: 'サトシ',
      avatarUrl: 'https://example.com/avatar.png',
      authProvider: 'google',
    };

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
});
