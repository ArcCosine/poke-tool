import { loadMasterData as defaultLoadMasterData } from './db';
import { TYPES } from './pokemon';

export const SPRITES_CACHE_NAME = 'pokemon-sprites-cache';
export const TOTAL_POKEMON_COUNT = 341;

export const COMMON_OFFLINE_ASSETS: readonly string[] = [
  '/assets/pokemon-sprites/0.png',
  ...TYPES.map((type) => `/assets/type-icons/${type}.svg`),
  '/assets/categories/physical.jpg',
  '/assets/categories/special.jpg',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-192x192.png',
  '/pwa-maskable-512x512.png',
  '/ogp.png',
  '/icons.svg',
];

export interface DownloadOfflineOptions {
  includeCommonAssets?: boolean;
}

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
    const cacheNames = await caches.keys();
    const seenUrls = new Set<string>();

    for (const name of cacheNames) {
      if (name.includes('precache') || name === SPRITES_CACHE_NAME) {
        const cache = await caches.open(name);
        const requests = await cache.keys();
        for (const req of requests) {
          if (req.url.includes('/assets/pokemon-sprites/')) {
            seenUrls.add(req.url);
          }
        }
      }
    }

    const cachedCount = seenUrls.size;
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
 * Download and cache all pokemon sprites and common UI assets for offline usage
 */
export async function downloadAllOfflineData(
  pokemonIds?: number[],
  onProgress?: (progress: DownloadProgress) => void,
  loadMasterFn = defaultLoadMasterData,
  options?: DownloadOfflineOptions
): Promise<void> {
  if (typeof caches === 'undefined') {
    throw new Error('CacheStorage is not supported in this environment');
  }

  const shouldIncludeCommon =
    options?.includeCommonAssets ??
    (pokemonIds === undefined || pokemonIds.length === 0);

  let targetUrls: string[] = [];
  if (pokemonIds && pokemonIds.length > 0) {
    targetUrls = pokemonIds.map((id) => `/assets/pokemon-sprites/${id}.png`);
  } else {
    try {
      const master = await loadMasterFn();
      targetUrls = master.pokemon.map(
        (p) => `/assets/pokemon-sprites/${p.id}.png`
      );
    } catch (err) {
      console.warn('Failed to load master data for offline caching:', err);
      targetUrls = [];
    }
  }

  if (shouldIncludeCommon) {
    targetUrls = [...targetUrls, ...COMMON_OFFLINE_ASSETS];
  }

  const cache = await caches.open(SPRITES_CACHE_NAME);
  const total = targetUrls.length;
  let loaded = 0;

  // Process in batches of 6 concurrent requests to prevent network congestion
  const BATCH_SIZE = 6;
  for (let i = 0; i < targetUrls.length; i += BATCH_SIZE) {
    const batch = targetUrls.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (url) => {
        try {
          // Check if already in cache
          const existing = await cache.match(url, {
            ignoreVary: true,
            ignoreSearch: true,
          });
          if (!existing) {
            const res = await fetch(url);
            if (res.ok) {
              await cache.put(url, res.clone());
            }
          }
        } catch (err) {
          console.warn(`Failed to cache asset ${url}:`, err);
        } finally {
          loaded++;
          if (onProgress) {
            onProgress({
              loaded,
              total,
              percent: total > 0 ? Math.round((loaded / total) * 100) : 100,
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
