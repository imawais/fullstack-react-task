import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'metropolis-arena-selection';
const MAX_SEATS = 8;

// reading this on first render only — that's why it's a function
// passed to useState rather than a value
function loadSavedSelection(): Set<string> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return new Set();
    const ids = JSON.parse(saved) as string[];
    return new Set(ids);
  } catch {
    // localStorage might be blocked in some browsers
    return new Set();
  }
}

export function useSelection() {
  const [selected, setSelected] = useState<Set<string>>(loadSavedSelection);

  // keep localStorage in sync whenever selection changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...selected]));
    } catch {
      // not a dealbreaker if storage fails
    }
  }, [selected]);

  const toggle = useCallback((seatId: string, isAvailable: boolean) => {
    if (!isAvailable) return;

    setSelected(prev => {
      const next = new Set(prev);

      if (next.has(seatId)) {
        next.delete(seatId);
      } else {
        // silently ignore if already at the cap — the UI should
        // make it obvious the user can't add more
        if (next.size >= MAX_SEATS) return prev;
        next.add(seatId);
      }

      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  return {
    selected,
    toggle,
    clear,
    isSelected: (id: string) => selected.has(id),
    isFull: selected.size >= MAX_SEATS,
    count: selected.size,
  };
}