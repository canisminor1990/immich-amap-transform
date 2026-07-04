type TileCacheEntry = {
  body: ArrayBuffer;
  contentType: string;
  expiresAt: number;
};

const MAX_ENTRIES = 1500;
const TTL_MS = 1000 * 60 * 10; // 10 minutes in-memory hot cache

const cache = new Map<string, TileCacheEntry>();

function evictIfNeeded(): void {
  while (cache.size > MAX_ENTRIES) {
    const firstKey = cache.keys().next().value as string | undefined;
    if (!firstKey) {
      break;
    }
    cache.delete(firstKey);
  }
}

export function getHotTile(key: string): TileCacheEntry | null {
  const item = cache.get(key);
  if (!item) {
    return null;
  }

  if (item.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  // LRU touch
  cache.delete(key);
  cache.set(key, item);
  return item;
}

export function setHotTile(
  key: string,
  body: ArrayBuffer,
  contentType: string,
): void {
  cache.set(key, {
    body,
    contentType,
    expiresAt: Date.now() + TTL_MS,
  });
  evictIfNeeded();
}
