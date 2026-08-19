/**
 * Small browser-lifetime cache for expensive route-detail payloads.
 *
 * It is intentionally memory-only: no user data is persisted to disk and a
 * process restart always starts fresh. Screens may render a recent snapshot
 * immediately, but they still run their existing GET on mount so server truth
 * replaces the snapshot in the background. This is a perceived-navigation
 * optimization, not a change to API freshness semantics.
 */

type RouteCacheEntry<T = unknown> = {
  data: T;
  expiresAt: number;
  touchedAt: number;
};

const DEFAULT_TTL_MS = 2 * 60 * 1000;
const MAX_ENTRIES = 40;
const cache = new Map<string, RouteCacheEntry>();

const prune = (): void => {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }

  if (cache.size <= MAX_ENTRIES) return;
  const ordered = Array.from(cache.entries()).sort(
    (a, b) => a[1].touchedAt - b[1].touchedAt,
  );
  for (let i = 0; i < ordered.length - MAX_ENTRIES; i += 1) {
    cache.delete(ordered[i][0]);
  }
};

export const makeRouteDataCacheKey = (
  resource: string,
  identity: string | number,
  userId?: string | number | null,
): string => `${resource}:${userId ?? "guest"}:${String(identity)}`;

export const readRouteDataCache = <T>(key: string | null): T | null => {
  if (!key) return null;
  prune();
  const entry = cache.get(key) as RouteCacheEntry<T> | undefined;
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  entry.touchedAt = Date.now();
  return entry.data;
};

export const writeRouteDataCache = <T>(
  key: string | null,
  data: T,
  ttlMs = DEFAULT_TTL_MS,
): T => {
  if (!key) return data;
  const now = Date.now();
  cache.set(key, {
    data,
    expiresAt: now + Math.max(1_000, ttlMs),
    touchedAt: now,
  });
  prune();
  return data;
};

export const updateRouteDataCache = <T>(
  key: string | null,
  updater: (current: T) => T,
): void => {
  if (!key) return;
  const current = readRouteDataCache<T>(key);
  if (!current) return;
  writeRouteDataCache(key, updater(current));
};

export const deleteRouteDataCache = (key: string | null): void => {
  if (key) cache.delete(key);
};
