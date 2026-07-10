import { Currency } from './types';

// All amounts are stored in GBP. These are approximate, hardcoded conversion
// rates used for display only — not live/exact exchange rates.
const RATES: Record<Currency, number> = {
  GBP: 1,
  EUR: 1.17,
  USD: 1.27,
};

const SYMBOLS: Record<Currency, string> = {
  GBP: '£',
  EUR: '€',
  USD: '$',
};

export const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'USD', label: 'USD ($)' },
];

export function currencySymbol(currency: Currency): string {
  return SYMBOLS[currency];
}

export function convertFromGBP(amountGBP: number, currency: Currency): number {
  return amountGBP * RATES[currency];
}

export function formatMoney(amountGBP: number, currency: Currency): string {
  return `${SYMBOLS[currency]}${convertFromGBP(amountGBP, currency).toFixed(2)}`;
}
