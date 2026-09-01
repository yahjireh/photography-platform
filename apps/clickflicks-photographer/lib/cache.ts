/**
 * ClickFlicks High-Performance SWR Cache (Photographer App)
 * Provides instant zero-latency UI loads with background revalidation (WhatsApp/Instagram style)
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

export const cacheGet = <T>(key: string): T | null => {
  // 1. Try memory cache first (instant 0ms)
  const mem = memoryCache.get(key);
  if (mem) {
    return mem.data as T;
  }

  // 2. Try storage cache
  try {
    const raw = localStorage.getItem(`cf_photographer_cache_${key}`) || sessionStorage.getItem(`cf_photographer_cache_${key}`);
    if (raw) {
      const parsed: CacheEntry<T> = JSON.parse(raw);
      memoryCache.set(key, parsed);
      return parsed.data;
    }
  } catch (_) {}

  return null;
};

export const cacheSet = <T>(key: string, data: T, ttlMs: number = 1000 * 60 * 30): void => {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ttl: ttlMs
  };

  memoryCache.set(key, entry);

  try {
    localStorage.setItem(`cf_photographer_cache_${key}`, JSON.stringify(entry));
  } catch (_) {
    try {
      sessionStorage.setItem(`cf_photographer_cache_${key}`, JSON.stringify(entry));
    } catch (_) {}
  }
};

export const cacheInvalidate = (key: string): void => {
  memoryCache.delete(key);
  try {
    localStorage.removeItem(`cf_photographer_cache_${key}`);
    sessionStorage.removeItem(`cf_photographer_cache_${key}`);
  } catch (_) {}
};

/**
 * Execute SWR fetch:
 * If cached data exists, returns it immediately, then fetches fresh data in background.
 */
export async function swrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  onBackgroundUpdate?: (data: T) => void
): Promise<T> {
  const cached = cacheGet<T>(key);

  // Background fetch
  const backgroundPromise = fetcher()
    .then((fresh) => {
      if (fresh !== undefined && fresh !== null) {
        cacheSet(key, fresh);
        if (onBackgroundUpdate) {
          onBackgroundUpdate(fresh);
        }
      }
      return fresh;
    })
    .catch((err) => {
      console.warn(`[SWR Background Revalidate Error for ${key}]:`, err.message);
      if (cached) return cached;
      throw err;
    });

  // If we have cached data, return it immediately without blocking!
  if (cached !== null && cached !== undefined) {
    return cached;
  }

  // Otherwise wait for network
  return await backgroundPromise;
}
