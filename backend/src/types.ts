// keeping this minimal — just what we actually use

export interface User {
    id: number;
    name: string;
    email: string;
    createdAt?: string; // only set on newly created users, not the seed data
  }
  
  // internal cache entry — wraps any value with an expiry timestamp
  export interface CacheEntry<T> {
    value: T;
    expiresAt: number;
  }
  
  // what /cache-status returns
  export interface CacheStats {
    size: number;
    hits: number;
    misses: number;
    totalResponseTimeMs: number;
    requestCount: number;
  }
  