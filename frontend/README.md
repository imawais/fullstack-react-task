# Venue Seat Picker

## Getting started

```bash
pnpm install
pnpm dev       # http://localhost:5173
pnpm test      # run unit tests
```

The app renders every seat from `public/venue.json` as an SVG circle at its absolute coordinates. I chose SVG over Canvas because each circle becomes a real DOM element — that means `aria-label`, `tabIndex`, and keyboard events (Enter/Space to select, Tab to navigate) all work without building any custom accessibility infrastructure. The trade-off is that at very large seat counts (15,000+) the DOM gets heavy. The practical fix would be viewBox culling — filtering out seats outside the current visible area before rendering — which I've left as a TODO since the spec data is small enough that it isn't a problem yet.

Selection state lives in a `Set<string>` of seat IDs rather than an array. The reason is performance: `Set.has()` is O(1) and gets called once per seat on every render, so with thousands of seats an array `.includes()` would be noticeably slower. The selection is written to `localStorage` via a `useEffect` on every change, so it survives page reloads automatically. Data fetching and flattening (section → row → seat) happens once in `useVenue` at load time, so components always receive a flat list and never need to think about the nested JSON structure.

Two things are incomplete: the Checkout button is wired up visually but doesn't navigate anywhere, and there are no end-to-end tests — the two unit test files cover the selection logic and pricing utilities but not the full user interaction flow. Playwright tests for the click → detail panel → summary flow would be the next thing to add.
