import type { User } from './types';

// seed data — would be a real db connection in production
let mockUsers: Record<number, User> = {
  1: { id: 1, name: 'John Doe',      email: 'john@example.com'  },
  2: { id: 2, name: 'Jane Smith',    email: 'jane@example.com'  },
  3: { id: 3, name: 'Alice Johnson', email: 'alice@example.com' },
};

// ── simple async queue ──────────────────────────────────────────
// processes tasks one at a time using promise chaining.
// could use Bull here but that requires Redis running as a separate
// process — overkill for this use case.
class SimpleQueue {
  private queue: Array<() => Promise<void>> = [];
  private running = false;

  enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try   { resolve(await task()); }
        catch (err) { reject(err); }
      });
      if (!this.running) this.drain();
    });
  }

  private async drain(): Promise<void> {
    this.running = true;
    while (this.queue.length > 0) {
      const next = this.queue.shift()!;
      await next();
    }
    this.running = false;
  }
}

const queue = new SimpleQueue();

// ── thundering-herd guard ───────────────────────────────────────
// problem: 50 simultaneous requests for user #1 would trigger
// 50 separate 200ms db calls — all doing the same work.
//
// solution: store the in-flight Promise for each user ID.
// the first request creates it; the rest just attach to it.
// one db call, everyone resolves together when it finishes.
const inFlight = new Map<number, Promise<User | null>>();

function simulateDbLookup(id: number): Promise<User | null> {
  return queue.enqueue(async () => {
    await new Promise(r => setTimeout(r, 200)); // fake db latency
    return mockUsers[id] ?? null;
  });
}

export async function fetchUser(id: number): Promise<User | null> {
  const existing = inFlight.get(id);
  if (existing) return existing; // attach to the in-flight request

  const promise = simulateDbLookup(id).finally(() => inFlight.delete(id));
  inFlight.set(id, promise);
  return promise;
}

export function addUser(user: User): void {
  mockUsers[user.id] = user;
}

export function nextId(): number {
  const ids = Object.keys(mockUsers).map(Number);
  return ids.length > 0 ? Math.max(...ids) + 1 : 1;
}
