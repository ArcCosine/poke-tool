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
    mockCache.keys.mockResolvedValue(new Array(341).fill({ url: 'http://test.com/img.png' }));

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

  it('should clear offline sprites cache successfully', async () => {
    const result = await clearOfflineCache();
    expect(result).toBe(true);
    expect(caches.delete).toHaveBeenCalledWith(SPRITES_CACHE_NAME);
  });
});
