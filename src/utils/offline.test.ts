import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearOfflineCache,
  downloadAllOfflineData,
  getOfflineCacheStatus,
  SPRITES_CACHE_NAME,
} from './offline';

describe('offline utilities', () => {
  let mockCache: {
    keys: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    match: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    mockCache = {
      keys: vi.fn().mockResolvedValue([]),
      put: vi.fn().mockResolvedValue(undefined),
      match: vi.fn().mockResolvedValue(undefined),
    };

    const mockCaches = {
      open: vi.fn().mockResolvedValue(mockCache),
      delete: vi.fn().mockResolvedValue(true),
      has: vi.fn().mockResolvedValue(true),
      keys: vi.fn().mockResolvedValue([SPRITES_CACHE_NAME]),
    };

    vi.stubGlobal('caches', mockCaches);
  });

  it('should return initial cache status when cache is empty', async () => {
    const status = await getOfflineCacheStatus(341);
    expect(status.cachedCount).toBe(0);
    expect(status.totalCount).toBe(341);
    expect(status.isFullyCached).toBe(false);
  });

  it('should return fully cached status when all items are in cache', async () => {
    mockCache.keys.mockResolvedValue(
      Array.from({ length: 341 }, (_, i) => ({
        url: `http://test.com/assets/pokemon-sprites/${i + 1}.png`,
      }))
    );

    const status = await getOfflineCacheStatus(341);
    expect(status.cachedCount).toBe(341);
    expect(status.isFullyCached).toBe(true);
  });

  it('should download and cache pokemon images and report progress', async () => {
    const progressUpdates: number[] = [];
    const mockResponse = {
      ok: true,
      clone: () => ({ ...mockResponse }),
    };

    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    vi.stubGlobal('fetch', fetchMock);

    const testPokemonIds = [1, 2, 3];
    await downloadAllOfflineData(testPokemonIds, (progress) => {
      progressUpdates.push(progress.loaded);
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(mockCache.put).toHaveBeenCalledTimes(3);
    expect(progressUpdates).toEqual([1, 2, 3]);
  });

  it('should load master data dynamically when pokemonIds is not provided', async () => {
    const mockResponse = {
      ok: true,
      clone: () => ({ ...mockResponse }),
    };
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    vi.stubGlobal('fetch', fetchMock);

    // Mock loadMasterData
    const mockLoadMasterData = vi.fn().mockResolvedValue({
      pokemon: [{ id: 3 }, { id: 6 }, { id: 10008 }],
      moves: [],
      items: [],
    });

    await downloadAllOfflineData(undefined, undefined, mockLoadMasterData, {
      includeCommonAssets: false,
    });

    expect(mockLoadMasterData).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith('/assets/pokemon-sprites/3.png');
    expect(fetchMock).toHaveBeenCalledWith('/assets/pokemon-sprites/6.png');
    expect(fetchMock).toHaveBeenCalledWith('/assets/pokemon-sprites/10008.png');
    expect(mockCache.put).toHaveBeenCalledTimes(3);
  });

  it('should cache all pokemon sprites, 0.png, type icons, category icons, and pwa icons when downloading all offline data', async () => {
    const mockResponse = {
      ok: true,
      clone: () => ({ ...mockResponse }),
    };
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    vi.stubGlobal('fetch', fetchMock);

    const mockLoadMasterData = vi.fn().mockResolvedValue({
      pokemon: [{ id: 3 }, { id: 10049 }],
      moves: [],
      items: [],
    });

    await downloadAllOfflineData(undefined, undefined, mockLoadMasterData);

    // Verify pokemon sprites
    expect(fetchMock).toHaveBeenCalledWith('/assets/pokemon-sprites/3.png');
    expect(fetchMock).toHaveBeenCalledWith('/assets/pokemon-sprites/10049.png');
    expect(fetchMock).toHaveBeenCalledWith('/assets/pokemon-sprites/0.png');

    // Verify type icons
    expect(fetchMock).toHaveBeenCalledWith('/assets/type-icons/fire.svg');
    expect(fetchMock).toHaveBeenCalledWith('/assets/type-icons/water.svg');

    // Verify category icons
    expect(fetchMock).toHaveBeenCalledWith('/assets/categories/physical.jpg');
    expect(fetchMock).toHaveBeenCalledWith('/assets/categories/special.jpg');

    // Verify PWA icons
    expect(fetchMock).toHaveBeenCalledWith('/favicon.svg');
    expect(fetchMock).toHaveBeenCalledWith('/pwa-192x192.png');
  });

  it('should clear offline sprites cache successfully', async () => {
    const result = await clearOfflineCache();
    expect(result).toBe(true);
    expect(caches.delete).toHaveBeenCalledWith(SPRITES_CACHE_NAME);
  });
});
