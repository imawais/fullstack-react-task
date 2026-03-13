# Fullstack Take-Home

A React seat picker and an Express caching API. Both are independent — you can run them separately.

```
fullstack-react-task/
├── frontend/
└── backend/
```

---

## Frontend

```bash
cd frontend
pnpm install
pnpm dev      # http://localhost:5173
pnpm test
```

Click around the map to select seats — up to 8. The sidebar updates live with a subtotal. Refresh the page and your selection should still be there. To test keyboard support, Tab to any blue seat and press Enter or Space to select it. The heatmap toggle in the top right colours seats by price tier.

---

## Backend

```bash
cd backend
pnpm install
pnpm dev      # http://localhost:3001
pnpm test
```

The interesting thing to verify manually is the caching effect. Hit `GET /users/1` twice in Postman — the first response will say `cached: false` with a response time around 200ms, the second will say `cached: true` with something under 5ms. `GET /cache-status` shows the running hit/miss counts after that.

Other endpoints worth checking:

- `GET /users/999` — 404, user doesn't exist
- `GET /users/abc` — 400, invalid ID
- `POST /users` with `{ "name": "Awais", "email": "awais@example.com" }` — creates a user and caches it immediately, so the next GET is already a hit
- `DELETE /cache` — flushes everything, next GET goes back to the db
- Fire 6 requests to any endpoint within 10 seconds — the 6th gets a 429 with a retryAfter field

---

## Tests

```bash
cd frontend && pnpm test   # selection logic, pricing utils
cd backend  && pnpm test   # LRU cache, rate limiter
```
