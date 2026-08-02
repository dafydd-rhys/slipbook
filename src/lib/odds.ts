// Converts decimal odds (the only format stored) into fractional/American display strings.
import { OddsFormat } from './types';

// Standard greatest-common-divisor helper used to reduce a fraction to lowest terms.
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

// Decimal odds as a UK-style fraction, e.g. 2.5 -> "3/2".
function decimalToFraction(decimal: number): string {
  if (decimal <= 1) {
    return '0/1';
  }

  // Work with hundredths precision
  const num = Math.round((decimal - 1) * 100);
  const den = 100;
  const divisor = gcd(num, den);
  const numerator = num / divisor;
  const denominator = den / divisor;

  // Common mappings for clean display
  if (numerator === denominator) {
    return 'EVS';
  }

  return `${numerator}/${denominator}`;
}

// Decimal odds as American (moneyline) odds, e.g. 2.5 -> "+150", 1.5 -> "-200".
function decimalToUS(decimal: number): string {
  if (decimal >= 2) {
    return `+${Math.round((decimal - 1) * 100)}`;
  }

  return `${Math.round(-100 / (decimal - 1))}`;
}

// Formats decimal odds in whichever display format the caller wants.
export function formatOdds(decimal: number, format: OddsFormat): string {
  switch (format) {
    case 'fraction': return decimalToFraction(decimal);
    case 'us': return decimalToUS(decimal);
    default: return decimal.toFixed(2);
  }
}
