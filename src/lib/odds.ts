import { OddsFormat } from './types';

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function decimalToFraction(decimal: number): string {
  if (decimal <= 1) return '0/1';
  // Work with hundredths precision
  const num = Math.round((decimal - 1) * 100);
  const den = 100;
  const g = gcd(num, den);
  const n = num / g;
  const d = den / g;
  // Common mappings for clean display
  if (n === d) return 'EVS';
  return `${n}/${d}`;
}

export function decimalToUS(decimal: number): string {
  if (decimal >= 2) {
    return `+${Math.round((decimal - 1) * 100)}`;
  }
  return `${Math.round(-100 / (decimal - 1))}`;
}

export function formatOdds(decimal: number, format: OddsFormat): string {
  switch (format) {
    case 'fraction': return decimalToFraction(decimal);
    case 'us': return decimalToUS(decimal);
    default: return decimal % 1 === 0 ? decimal.toFixed(1) : String(parseFloat(decimal.toFixed(2)));
  }
}
