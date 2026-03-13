# User Data API

## Getting started

```bash
pnpm install
pnpm dev        # ts-node-dev with hot reload → http://localhost:3001
pnpm test       # run unit tests
pnpm build      # compile to dist/
pnpm start      # run compiled output
```

The cache is backed by a plain JavaScript `Map`. This works for LRU because `Map` preserves insertion order — deleting a key and re-inserting it moves it to the tail, so the head is always the least recently used entry. All operations are O(1) with no linked list or secondary structure needed. Entries expire after 60 seconds; a background interval sweeps stale ones every 30 seconds so memory doesn't grow between reads. The rate limiter runs two independent windows per IP: 10 requests per minute (sustained abuse) and 5 per 10 seconds (spike abuse). One window isn't enough — with only a per-minute limit someone could fire all 10 requests in the first second and then sit under the limit for the rest of the minute.

The most interesting piece is the thundering-herd guard in `db.ts`. Without it, 50 simultaneous requests for the same user ID would trigger 50 separate 200ms database calls all doing identical work. The fix is an `inFlight` map — the first request for a given ID stores its Promise there, and any subsequent request that arrives while it's still running just attaches to the same Promise. One DB call, everyone resolves together. The async queue underneath uses plain Promise chaining rather than Bull because Bull requires Redis running as a separate process, which felt like an unnecessary dependency for something this small. The trade-off is that the queue is in-memory and non-persistent, which would matter in production.

Two things are missing: the data store is in-memory, so it resets on every restart, and the rate limiter state is per-process, which means it wouldn't work correctly behind a load balancer. In production the first fix would be a real database, and the second would be moving rate limit state to Redis. The test suite covers the cache (LRU eviction, TTL expiry, hit/miss tracking) and the rate limiter (burst window, minute window, per-IP isolation) but doesn't include integration tests against the actual HTTP routes.
