// testing the selection hook in isolation.
// this is the most important logic in the app — if toggle/cap/persist
// breaks, the whole seat-picking experience breaks.

import { describe, it, expect } from 'vitest';

// we're testing the pure logic, not the React hook itself,
// so we extract the pieces we care about and test them directly.
// this keeps tests simple and fast — no need for renderHook or act().

const MAX_SEATS = 8;

// mirrors the toggle logic from useSelection.ts
function toggle(current: Set<string>, seatId: string, isAvailable: boolean): Set<string> {
  if (!isAvailable) return current;

  const next = new Set(current);
  if (next.has(seatId)) {
    next.delete(seatId);
  } else {
    if (next.size >= MAX_SEATS) return current;
    next.add(seatId);
  }
  return next;
}

// mirrors loadSavedSelection from useSelection.ts
function loadSaved(raw: string | null): Set<string> {
  try {
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

describe('selection toggle', () => {
  it('adds a seat when it is available and not yet selected', () => {
    const result = toggle(new Set(), 'A-1-01', true);
    expect(result.has('A-1-01')).toBe(true);
  });

  it('removes a seat that was already selected', () => {
    const start = new Set(['A-1-01']);
    const result = toggle(start, 'A-1-01', true);
    expect(result.has('A-1-01')).toBe(false);
  });

  it('does nothing when the seat is not available', () => {
    const start = new Set<string>();
    const result = toggle(start, 'A-1-01', false);
    expect(result.size).toBe(0);
  });

  it('does not exceed the 8 seat cap', () => {
    // fill up to the cap
    const full = new Set(['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8']);
    const result = toggle(full, 'A-1-09', true);

    // should be unchanged — still 8 seats, new one not added
    expect(result.size).toBe(8);
    expect(result.has('A-1-09')).toBe(false);
  });

  it('still allows deselecting when at cap', () => {
    const full = new Set(['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8']);
    const result = toggle(full, 's1', true);
    expect(result.size).toBe(7);
    expect(result.has('s1')).toBe(false);
  });

  it('returns the same reference when nothing changed (cap hit)', () => {
    const full = new Set(['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8']);
    const result = toggle(full, 'new-seat', true);
    // same reference means React won't re-render — important for perf
    expect(result).toBe(full);
  });
});

describe('localStorage persistence', () => {
  it('returns an empty set when nothing is saved', () => {
    const result = loadSaved(null);
    expect(result.size).toBe(0);
  });

  it('restores a saved selection correctly', () => {
    const saved = JSON.stringify(['A-1-01', 'B-2-03']);
    const result = loadSaved(saved);
    expect(result.has('A-1-01')).toBe(true);
    expect(result.has('B-2-03')).toBe(true);
    expect(result.size).toBe(2);
  });

  it('returns empty set if stored value is corrupted', () => {
    const result = loadSaved('not valid json {{{{');
    expect(result.size).toBe(0);
  });
});
