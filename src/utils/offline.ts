export const SPRITES_CACHE_NAME = 'pokemon-sprites-cache';
export const TOTAL_POKEMON_COUNT = 341;

export interface OfflineCacheStatus {
  cachedCount: number;
  totalCount: number;
  isFullyCached: boolean;
  estimatedSizeMB: number;
}

export interface DownloadProgress {
  loaded: number;
  total: number;
  percent: number;
}

/**
 * Get current cache status for pokemon sprite images
 */
export async function getOfflineCacheStatus(
  totalCount = TOTAL_POKEMON_COUNT
): Promise<OfflineCacheStatus> {
  if (typeof caches === 'undefined') {
    return {
      cachedCount: 0,
      totalCount,
      isFullyCached: false,
      estimatedSizeMB: 0,
    };
  }

  try {
    const cache = await caches.open(SPRITES_CACHE_NAME);
    const requests = await cache.keys();
    const cachedCount = requests.length;
    // Average 130KB per pokemon sprite
    const estimatedSizeMB = Math.round((cachedCount * 130) / 1024);

    return {
      cachedCount,
      totalCount,
      isFullyCached: cachedCount >= totalCount && totalCount > 0,
      estimatedSizeMB,
    };
  } catch (err) {
    console.warn('Failed to inspect offline cache status:', err);
    return {
      cachedCount: 0,
      totalCount,
      isFullyCached: false,
      estimatedSizeMB: 0,
    };
  }
}

/**
 * Download and cache all pokemon sprites for offline usage
 */
export async function downloadAllOfflineData(
  pokemonIds: number[] = Array.from(
    { length: TOTAL_POKEMON_COUNT },
    (_, i) => i + 1
  ),
  onProgress?: (progress: DownloadProgress) => void
): Promise<void> {
  if (typeof caches === 'undefined') {
    throw new Error('CacheStorage is not supported in this environment');
  }

  const cache = await caches.open(SPRITES_CACHE_NAME);
  const total = pokemonIds.length;
  let loaded = 0;

  // Process in batches of 6 concurrent requests to prevent network congestion
  const BATCH_SIZE = 6;
  for (let i = 0; i < pokemonIds.length; i += BATCH_SIZE) {
    const batch = pokemonIds.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (id) => {
        const url = `/assets/pokemon-sprites/${id}.png`;
        try {
          // Check if already in cache
          const existing = await cache.match(url);
          if (!existing) {
            const res = await fetch(url);
            if (res.ok) {
              await cache.put(url, res.clone());
            }
          }
        } catch (err) {
          console.warn(`Failed to cache sprite for Pokemon #${id}:`, err);
        } finally {
          loaded++;
          if (onProgress) {
            onProgress({
              loaded,
              total,
              percent: Math.round((loaded / total) * 100),
            });
          }
        }
      })
    );
  }
}

/**
 * Clear offline pokemon sprites cache
 */
export async function clearOfflineCache(): Promise<boolean> {
  if (typeof caches === 'undefined') return false;
  try {
    return await caches.delete(SPRITES_CACHE_NAME);
  } catch (err) {
    console.warn('Failed to clear offline cache:', err);
    return false;
  }
}
