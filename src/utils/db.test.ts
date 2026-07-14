import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from './db';

describe('db caching utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch data from network when cache is empty', async () => {
    const mockPokemon = [{ id: 1, name: { ja: 'フシギバナ', en: 'Venusaur' } }];
    const mockMoves = [
      { id: 1, name: { ja: 'ハードプラント', en: 'Frenzy Plant' } },
    ];

    // Mock fetch API
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            url.includes('pokemon_master') ? mockPokemon : mockMoves
          ),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    // Mock IndexedDB operations
    const getCachedSpy = vi.spyOn(db, 'getCachedData').mockResolvedValue(null);
    const setCachedSpy = vi
      .spyOn(db, 'setCachedData')
      .mockResolvedValue(undefined);

    const result = await db.loadMasterData();

    expect(getCachedSpy).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.pokemon).toEqual(mockPokemon);
    expect(result.moves).toEqual(mockMoves);
    expect(setCachedSpy).toHaveBeenCalledTimes(2);
  });

  it('should load data from IndexedDB cache when available without fetching', async () => {
    const mockPokemon = [{ id: 3, name: { ja: 'フシギバナ', en: 'Venusaur' } }];
    const mockMoves = [
      { id: 5, name: { ja: 'メガドレイン', en: 'Mega Drain' } },
    ];

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    // Mock IndexedDB operations to return mock data
    const getCachedSpy = vi
      .spyOn(db, 'getCachedData')
      .mockImplementation((key: string) => {
        if (key === 'pokemon_master') return Promise.resolve(mockPokemon);
        if (key === 'moves_master') return Promise.resolve(mockMoves);
        return Promise.resolve(null);
      });

    const result = await db.loadMasterData();

    expect(getCachedSpy).toHaveBeenCalledTimes(2);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.pokemon).toEqual(mockPokemon);
    expect(result.moves).toEqual(mockMoves);
  });
});
