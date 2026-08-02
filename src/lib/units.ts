import { UNIT_SIZE } from './config';

export function toUnits(amountGBP: number): number {
  return amountGBP / UNIT_SIZE;
}

export function formatUnits(amountGBP: number): string {
  return `${toUnits(amountGBP).toFixed(2)}u`;
}
