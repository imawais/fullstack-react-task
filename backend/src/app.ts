import express from 'express';
import cors from 'cors';
import { LRUCache } from './cache';
import { RateLimiter } from './rateLimiter';
import { fetchUser, addUser, nextId } from './db';
import type { User } from './types';

const app = express();

app.use(cors());
app.use(express.json());

const cache   = new LRUCache<User>(500, 60); // 500 entries, 60s TTL
const limiter = new RateLimiter(10, 5);

app.use(limiter.middleware());

// GET /users/:id
app.get('/users/:id', async (req, res) => {
  const start = Date.now();
  const id    = parseInt(req.params.id, 10);

  if (isNaN(id) || id <= 0) {
    res.status(400).json({ error: 'User ID must be a positive integer.' });
    return;
  }

  const cacheKey = String(id);
  const cached   = cache.get(cacheKey);

  // cache hit — return immediately, skip the db entirely
  if (cached) {
    const ms = Date.now() - start;
    cache.recordResponseTime(ms);
    res.json({ data: cached, cached: true, responseTimeMs: ms });
    return;
  }

  // cache miss — fetchUser handles the thundering-herd deduplication
  try {
    const user = await fetchUser(id);
    const ms   = Date.now() - start;
    cache.recordResponseTime(ms);

    if (!user) {
      res.status(404).json({ error: `No user found with ID ${id}.` });
      return;
    }

    cache.set(cacheKey, user);
    res.json({ data: user, cached: false, responseTimeMs: ms });
  } catch {
    res.status(500).json({ error: 'Something went wrong, please try again.' });
  }
});

// POST /users
app.post('/users', (req, res) => {
  const { name, email } = req.body as { name?: unknown; email?: unknown };

  if (typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: '"name" is required and cannot be empty.' });
    return;
  }

  if (typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ error: '"email" must be a valid email address.' });
    return;
  }

  const user: User = {
    id: nextId(),
    name: name.trim(),
    email: email.trim(),
    createdAt: new Date().toISOString(),
  };

  addUser(user);
  cache.set(String(user.id), user); // cache immediately so the first GET is fast

  res.status(201).json({ data: user });
});

// DELETE /cache
app.delete('/cache', (_req, res) => {
  cache.clear();
  res.json({ message: 'Cache cleared.' });
});

// GET /cache-status
app.get('/cache-status', (_req, res) => {
  res.json(cache.getStats());
});

// GET /health
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: Math.round(process.uptime()) });
});

// catch-all 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

export default app;
