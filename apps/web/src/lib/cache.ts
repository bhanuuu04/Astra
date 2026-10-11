/**
 * In-Memory & LocalStorage High-Speed Multi-Tier Cache
 * Provides sub-millisecond retrieval for brand DNA, tenant metadata, and authenticated sessions.
 */

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttlMs: number;
};

class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttlMs: ttlSeconds * 1000,
    };
    this.store.set(key, entry);

    // Also persist to localStorage for client-side survivability if in browser
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`astra_cache_${key}`, JSON.stringify(entry));
      } catch {}
    }
  }

  get<T>(key: string): T | null {
    // 1. Check in-memory store
    const mem = this.store.get(key);
    if (mem) {
      if (Date.now() - mem.timestamp < mem.ttlMs) {
        return mem.data as T;
      }
      this.store.delete(key);
    }

    // 2. Check localStorage
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`astra_cache_${key}`);
        if (raw) {
          const entry: CacheEntry<T> = JSON.parse(raw);
          if (Date.now() - entry.timestamp < entry.ttlMs) {
            this.store.set(key, entry); // populate in-memory
            return entry.data;
          }
          localStorage.removeItem(`astra_cache_${key}`);
        }
      } catch {}
    }

    return null;
  }

  invalidate(key: string): void {
    this.store.delete(key);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`astra_cache_${key}`);
      } catch {}
    }
  }

  clear(): void {
    this.store.clear();
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('astra_cache_')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch {}
    }
  }
}

export const appCache = new MemoryCache();

export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 30
): Promise<T> {
  const cached = appCache.get<T>(key);
  if (cached !== null && cached !== undefined) {
    return cached;
  }
  const fresh = await fetcher();
  if (fresh !== null && fresh !== undefined) {
    appCache.set(key, fresh, ttlSeconds);
  }
  return fresh;
}
