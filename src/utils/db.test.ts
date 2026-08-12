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
      if (url.includes('version.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ version: 123 }),
        });
      }
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

    expect(getCachedSpy).toHaveBeenCalledTimes(3); // master_version, pokemon_master, moves_master
    expect(fetchMock).toHaveBeenCalledTimes(3); // version.json, pokemon_master.json, moves_master.json
    expect(result.pokemon).toEqual(mockPokemon);
    expect(result.moves).toEqual(mockMoves);
    expect(setCachedSpy).toHaveBeenCalledTimes(3); // pokemon_master, moves_master, master_version
  });

  it('should load data from IndexedDB cache when available without fetching other than version', async () => {
    const mockPokemon = [{ id: 3, name: { ja: 'フシギバナ', en: 'Venusaur' } }];
    const mockMoves = [
      { id: 5, name: { ja: 'メガドレイン', en: 'Mega Drain' } },
    ];

    // Mock version.json fetch
    const fetchMock = vi.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ version: 123 }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    // Mock IndexedDB operations to return mock data
    const getCachedSpy = vi
      .spyOn(db, 'getCachedData')
      .mockImplementation((key: string) => {
        if (key === 'master_version') return Promise.resolve(123);
        if (key === 'pokemon_master') return Promise.resolve(mockPokemon);
        if (key === 'moves_master') return Promise.resolve(mockMoves);
        return Promise.resolve(null);
      });

    const result = await db.loadMasterData();

    expect(getCachedSpy).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenCalledTimes(1); // Only version.json should be fetched
    expect(result.pokemon).toEqual(mockPokemon);
    expect(result.moves).toEqual(mockMoves);
  });
});

