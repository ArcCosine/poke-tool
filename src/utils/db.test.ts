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
    const mockItems = [
      { id: 1, name: { ja: 'オボンのみ', en: 'Sitrus Berry' } },
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
        json: () => {
          if (url.includes('pokemon_master'))
            return Promise.resolve(mockPokemon);
          if (url.includes('moves_master')) return Promise.resolve(mockMoves);
          return Promise.resolve(mockItems);
        },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    // Mock IndexedDB operations
    const getCachedSpy = vi.spyOn(db, 'getCachedData').mockResolvedValue(null);
    const setCachedSpy = vi
      .spyOn(db, 'setCachedData')
      .mockResolvedValue(undefined);

    const result = await db.loadMasterData();

    expect(getCachedSpy).toHaveBeenCalledTimes(4); // master_version, pokemon_master, moves_master, items_master
    expect(fetchMock).toHaveBeenCalledTimes(4); // version.json, pokemon_master.json, moves_master.json, items_master.json
    expect(result.pokemon).toEqual(mockPokemon);
    expect(result.moves).toEqual(mockMoves);
    expect(result.items).toEqual(mockItems);
    expect(setCachedSpy).toHaveBeenCalledTimes(4); // pokemon_master, moves_master, items_master, master_version
  });

  it('should load data from IndexedDB cache when available without fetching other than version', async () => {
    const mockPokemon = [{ id: 3, name: { ja: 'フシギバナ', en: 'Venusaur' } }];
    const mockMoves = [
      { id: 5, name: { ja: 'メガドレイン', en: 'Mega Drain' } },
    ];
    const mockItems = [
      { id: 1, name: { ja: 'オボンのみ', en: 'Sitrus Berry' } },
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
        if (key === 'items_master') return Promise.resolve(mockItems);
        return Promise.resolve(null);
      });

    const result = await db.loadMasterData();

    expect(getCachedSpy).toHaveBeenCalledTimes(4);
    expect(fetchMock).toHaveBeenCalledTimes(1); // Only version.json should be fetched
    expect(result.pokemon).toEqual(mockPokemon);
    expect(result.moves).toEqual(mockMoves);
    expect(result.items).toEqual(mockItems);
  });
});
