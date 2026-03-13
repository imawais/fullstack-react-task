import type { CacheEntry, CacheStats } from './types';

// LRU cache using a plain Map.
//
// The trick: Map preserves insertion order. So if we delete a key
// and re-insert it on every get/set, it naturally moves to the tail
// (most recently used). The head is always the LRU candidate.
// All operations are O(1) — no linked list needed.
export class LRUCache<T> {
  private readonly capacity: number;
  private readonly ttlMs: number;
  private readonly store = new Map<string, CacheEntry<T>>();

  private stats: CacheStats = {
    size: 0,
    hits: 0,
    misses: 0,
    totalResponseTimeMs: 0,
    requestCount: 0,
  };

  constructor(capacity: number, ttlSeconds: number) {
    this.capacity = capacity;
    this.ttlMs = ttlSeconds * 1000;

    // sweep expired entries every 30s so stale data doesn't
    // sit in memory indefinitely between reads
    const sweep = setInterval(() => this.removeExpired(), 30_000);
    sweep.unref(); // don't keep the process alive just for this
  }

  get(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // check expiry before returning
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.stats.size = this.store.size;
      this.stats.misses++;
      return null;
    }

    // delete + re-insert = move to tail = mark as recently used
    this.store.delete(key);
    this.store.set(key, entry);

    this.stats.hits++;
    return entry.value;
  }

  set(key: string, value: T): void {
    if (this.store.has(key)) {
      this.store.delete(key); // remove so re-insert goes to tail
    } else if (this.store.size >= this.capacity) {
      // evict least recently used — that's always the first key
      const lruKey = this.store.keys().next().value;
      if (lruKey !== undefined) this.store.delete(lruKey);
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });

    this.stats.size = this.store.size;
  }

  clear(): void {
    this.store.clear();
    this.stats.size = 0;
  }

  recordResponseTime(ms: number): void {
    this.stats.totalResponseTimeMs += ms;
    this.stats.requestCount++;
  }

  getStats() {
    const avg =
      this.stats.requestCount > 0
        ? Math.round(this.stats.totalResponseTimeMs / this.stats.requestCount)
        : 0;

    return { ...this.stats, avgResponseTimeMs: avg };
  }

  private removeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
    this.stats.size = this.store.size;
  }
}
