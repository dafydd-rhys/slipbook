// Year-by-year stake/returns/P&L totals for the admin tax report — settled bets only.
import { Bet } from './types';

export interface YearRow { year: number; bets: number; staked: number; returns: number; pnl: number; }

// Aggregates settled bets into one row per calendar year, newest first.
export function taxByYear(bets: Bet[]): YearRow[] {
  const map = new Map<number, YearRow>();

  for (const bet of bets) {
    if (bet.result === 'pending') {
      continue;
    }

    const year = new Date(bet.date).getFullYear();
    const row = map.get(year) ?? { year, bets: 0, staked: 0, returns: 0, pnl: 0 };
    const returns = bet.returns ?? 0;

    row.bets += 1;
    row.staked += bet.stake;
    row.returns += returns;
    row.pnl += returns - bet.stake;
    map.set(year, row);
  }

  return Array.from(map.values()).sort((a, b) => b.year - a.year);
}
