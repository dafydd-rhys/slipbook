import { Bet } from './types';

export function formatDayLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function groupByDay(bets: Bet[]) {
  const map = new Map<string, Bet[]>();
  for (const bet of bets) {
    const label = formatDayLabel(bet.date);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(bet);
  }
  return Array.from(map.entries()).map(([label, bets]) => ({ label, bets }));
}
