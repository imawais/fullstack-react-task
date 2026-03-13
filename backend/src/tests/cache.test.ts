import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LRUCache } from '../cache';

// testing the cache in isolation — no Express, no db, just the logic.
// this is the most critical part so it gets the most test coverage.

describe('LRUCache', () => {
  let cache: LRUCache<string>;

  beforeEach(() => {
    cache = new LRUCache<string>(3, 60); // capacity 3, 60s TTL
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores and retrieves a value', () => {
    cache.set('user:1', 'john');
    expect(cache.get('user:1')).toBe('john');
  });

  it('returns null for a key that does not exist', () => {
    expect(cache.get('user:999')).toBeNull();
  });

  it('evicts the least recently used entry when full', () => {
    cache.set('a', 'first');
    cache.set('b', 'second');
    cache.set('c', 'third');

    // access 'a' so it becomes the most recently used
    // now 'b' is the least recently used
    cache.get('a');

    // adding 'd' should evict 'b'
    cache.set('d', 'fourth');

    expect(cache.get('b')).toBeNull();   // evicted
    expect(cache.get('a')).toBe('first');
    expect(cache.get('c')).toBe('third');
    expect(cache.get('d')).toBe('fourth');
  });

  it('treats expired entries as misses', () => {
    vi.useFakeTimers();

    const shortCache = new LRUCache<string>(10, 1); // 1 second TTL
    shortCache.set('x', 'value');

    vi.advanceTimersByTime(1500); // past the 1s TTL

    expect(shortCache.get('x')).toBeNull();
    expect(shortCache.getStats().misses).toBe(1);
  });

  it('tracks hits and misses correctly', () => {
    cache.set('a', 'hello');

    cache.get('a'); // hit
    cache.get('a'); // hit
    cache.get('z'); // miss

    const { hits, misses } = cache.getStats();
    expect(hits).toBe(2);
    expect(misses).toBe(1);
  });

  it('clears everything', () => {
    cache.set('a', 'hello');
    cache.set('b', 'world');
    cache.clear();

    expect(cache.get('a')).toBeNull();
    expect(cache.getStats().size).toBe(0);
  });

  it('calculates average response time correctly', () => {
    cache.recordResponseTime(100);
    cache.recordResponseTime(200);
    cache.recordResponseTime(300);

    expect(cache.getStats().avgResponseTimeMs).toBe(200);
  });
});
