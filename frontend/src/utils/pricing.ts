import type { PriceTierConfig } from '../types/venue';

// price per tier — these would come from the backend in a real app
// keeping them here for now since the spec uses static data
export const PRICE_TIERS: Record<number, PriceTierConfig> = {
  1: { label: 'Lower Bowl A', price: 85,  color: '#3b82f6' },
  2: { label: 'Lower Bowl B', price: 65,  color: '#8b5cf6' },
  3: { label: 'Upper Bowl',   price: 45,  color: '#06b6d4' },
  4: { label: 'VIP Floor',    price: 175, color: '#f59e0b' },
};

export function getTierPrice(tier: number): number {
  return PRICE_TIERS[tier]?.price ?? 0;
}

// wrapping this so we don't repeat the same Intl config everywhere
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('eu-EU', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(amount);
}