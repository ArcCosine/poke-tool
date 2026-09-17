import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePartySync } from './usePartySync';

describe('usePartySync hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ parties: [] }),
      } as any)
    );
  });

  it('should not prompt sync when user is not logged in', () => {
    const { result } = renderHook(() =>
      usePartySync({
        user: null,
        localParties: [{ id: 'p1', name: 'Local Party', members: [] }],
        setPartiesDirectly: vi.fn(),
      })
    );

    expect(result.current.isSyncPromptOpen).toBe(false);
  });

  it('should detect when local parties need to be synced to cloud after login', async () => {
    const cloudParties = [
      { id: 'p2', title: 'Cloud Party', party_data: '', is_public: 0 },
    ];

    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ parties: cloudParties }),
      } as any)
    );

    const mockSetParties = vi.fn();
    const localParties = [{ id: 'p1', name: 'Local Party Only', members: [] }];

    const { result } = renderHook(() =>
      usePartySync({
        user: { id: 'usr_1', name: 'Test User', authProvider: 'google' },
        localParties,
        setPartiesDirectly: mockSetParties,
        pokemonData: [],
        itemsData: [],
      })
    );

    await waitFor(() => {
      expect(result.current.hasPendingSync).toBe(true);
      expect(result.current.isSyncPromptOpen).toBe(true);
    });
  });

  it('should perform bulk-sync when user confirms', async () => {
    const cloudParties: any[] = [];

    vi.spyOn(globalThis, 'fetch')
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ parties: cloudParties }),
        } as any)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as any)
      );

    const mockSetParties = vi.fn();
    const localParties = [{ id: 'p1', name: 'Local Party Only', members: [] }];

    const { result } = renderHook(() =>
      usePartySync({
        user: { id: 'usr_1', name: 'Test User', authProvider: 'google' },
        localParties,
        setPartiesDirectly: mockSetParties,
        pokemonData: [],
        itemsData: [],
      })
    );

    await waitFor(() => {
      expect(result.current.isSyncPromptOpen).toBe(true);
    });

    await act(async () => {
      await result.current.confirmSync();
    });

    expect(result.current.isSyncPromptOpen).toBe(false);
  });

  it('should remap party IDs and update userId to current user when bulk-sync returns remappedIds', async () => {
    const cloudParties: any[] = [];

    vi.spyOn(globalThis, 'fetch')
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ parties: cloudParties }),
        } as any)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              remappedIds: { p1: 'p1_new_uuid' },
            }),
        } as any)
      );

    const mockSetParties = vi.fn();
    const localParties = [
      { id: 'p1', name: 'Party From X Account', members: [], userId: 'usr_old_x' },
    ];

    const { result } = renderHook(() =>
      usePartySync({
        user: { id: 'usr_google_new', name: 'Google User', authProvider: 'google' },
        localParties,
        setPartiesDirectly: mockSetParties,
        pokemonData: [],
        itemsData: [],
      })
    );

    await waitFor(() => {
      expect(result.current.isSyncPromptOpen).toBe(true);
    });

    await act(async () => {
      await result.current.confirmSync();
    });

    expect(result.current.isSyncPromptOpen).toBe(false);
    expect(mockSetParties).toHaveBeenCalledTimes(1);

    const updatedParties = mockSetParties.mock.calls[0][0];
    expect(updatedParties).toHaveLength(1);
    expect(updatedParties[0].id).toBe('p1_new_uuid');
    expect(updatedParties[0].userId).toBe('usr_google_new');
  });
});
