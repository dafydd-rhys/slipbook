// Groups bets by calendar day for the tracker list and admin manage tab.
import { Bet } from './types';

export interface DayGroup { label: string; bets: Bet[] }

// Human-readable day heading, e.g. "Tuesday, 4 August 2026".
function formatDayLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

// Buckets bets by their formatted day label, preserving first-seen order.
export function groupByDay(bets: Bet[]): DayGroup[] {
  const map = new Map<string, Bet[]>();

  for (const bet of bets) {
    const label = formatDayLabel(bet.date);

    if (!map.has(label)) {
      map.set(label, []);
    }

    map.get(label)!.push(bet);
  }

  return Array.from(map.entries()).map(([label, bets]) => ({ label, bets }));
}
