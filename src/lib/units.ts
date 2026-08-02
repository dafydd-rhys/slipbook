// Converts real currency amounts into anonymised "units" for public-facing pages.
import { UNIT_SIZE } from './config';

// Currency amount expressed as a multiple of UNIT_SIZE.
export function toUnits(amount: number): number {
  return amount / UNIT_SIZE;
}

// Currency amount formatted as a unit string, e.g. "1.50u".
export function formatUnits(amount: number): string {
  return `${toUnits(amount).toFixed(2)}u`;
}
