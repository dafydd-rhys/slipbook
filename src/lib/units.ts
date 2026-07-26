export const UNIT_SIZE = 100; // 1 unit = £100 (fixed, stored in GBP) — never shown publicly

export function toUnits(amountGBP: number): number {
  return amountGBP / UNIT_SIZE;
}

export function formatUnits(amountGBP: number): string {
  return `${toUnits(amountGBP).toFixed(2)}u`;
}
