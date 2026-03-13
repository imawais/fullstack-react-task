// pricing utils are pure functions so they're trivial to test.
// keeping this short — just enough to catch regressions if the
// tier config or formatting logic ever changes.

import { describe, it, expect } from 'vitest';
import { getTierPrice, formatCurrency, PRICE_TIERS } from '../utils/pricing';

describe('getTierPrice', () => {
  it('returns the right price for each tier', () => {
    expect(getTierPrice(1)).toBe(85);
    expect(getTierPrice(2)).toBe(65);
    expect(getTierPrice(3)).toBe(45);
    expect(getTierPrice(4)).toBe(175);
  });

  it('returns 0 for an unknown tier instead of crashing', () => {
    expect(getTierPrice(99)).toBe(0);
  });
});

describe('formatCurrency', () => {
  // we check for the number being present rather than the exact formatted string
  // because Intl.NumberFormat output depends on the Node ICU data available
  // on the machine running the tests — it varies between environments.
  // what we actually care about: it's a currency string containing the right number.

  it('contains the correct amount for common prices', () => {
    expect(formatCurrency(85)).toContain('85');
    expect(formatCurrency(175)).toContain('175');
  });

  it('contains a currency symbol', () => {
    // should have some kind of currency marker — € or EUR depending on ICU data
    const result = formatCurrency(85);
    const hasCurrencyMarker = result.includes('€') || result.includes('EUR');
    expect(hasCurrencyMarker).toBe(true);
  });

  it('formats zero without crashing', () => {
    expect(formatCurrency(0)).toContain('0');
  });

  it('includes all digits for larger amounts', () => {
    expect(formatCurrency(1000)).toContain('1');
    expect(formatCurrency(1000)).toContain('000');
  });
});

describe('PRICE_TIERS config', () => {
  it('has all four tiers defined', () => {
    expect(Object.keys(PRICE_TIERS)).toHaveLength(4);
  });

  it('every tier has a label, price, and color', () => {
    for (const tier of Object.values(PRICE_TIERS)) {
      expect(tier.label).toBeTruthy();
      expect(tier.price).toBeGreaterThan(0);
      expect(tier.color).toMatch(/^#/); // should be a hex color
    }
  });
});