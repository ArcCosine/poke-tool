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
      {
        id: 'p1',
        name: 'Party From X Account',
        members: [],
        userId: 'usr_old_x',
      },
    ];

    const { result } = renderHook(() =>
      usePartySync({
        user: {
          id: 'usr_google_new',
          name: 'Google User',
          authProvider: 'google',
        },
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

  it('should filter out deleted parties recorded in deleted_party_ids and cleanup lingering cloud party', async () => {
    localStorage.setItem('deleted_party_ids', JSON.stringify(['p_deleted']));

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation((url: any, _init?: any) => {
        if (typeof url === 'string' && url === '/api/parties') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                parties: [
                  { id: 'p_deleted', title: 'Deleted Party', party_data: '' },
                  { id: 'p_keep', title: 'Keep Party', party_data: '' },
                ],
              }),
          } as any);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as any);
      });

    const mockSetParties = vi.fn();
    const localParties = [{ id: 'p_keep', name: 'Keep Party', members: [] }];

    renderHook(() =>
      usePartySync({
        user: { id: 'usr_1', name: 'Test User', authProvider: 'google' },
        localParties,
        setPartiesDirectly: mockSetParties,
        pokemonData: [],
        itemsData: [],
      })
    );

    await waitFor(() => {
      expect(mockSetParties).toHaveBeenCalled();
    });

    const finalParties = mockSetParties.mock.calls[0][0];
    // p_deleted must NOT be resurrected
    expect(finalParties.some((p: any) => p.id === 'p_deleted')).toBe(false);
    expect(finalParties.some((p: any) => p.id === 'p_keep')).toBe(true);

    // DELETE request to /api/parties/p_deleted must have been sent
    expect(fetchSpy).toHaveBeenCalledWith('/api/parties/p_deleted', {
      method: 'DELETE',
    });
  });
});
