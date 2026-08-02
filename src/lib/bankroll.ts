import { Bet, BankrollEntry, BankrollPoint } from './types';

export interface BankrollSummary {
  currentBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  bettingPnl: number; // contribution from settled bets alone, real currency
  points: BankrollPoint[];
}

function entryDelta(e: BankrollEntry): number {
  if (e.type === 'withdrawal') return -e.amount;
  return e.amount; // deposit and adjustment both add (adjustment can carry a negative amount for corrections)
}

// Running balance over time: chronological merge of bankroll entries (deposits/
// withdrawals/adjustments) and settled bet P&L, both in real currency.
export function computeBankrollSeries(bets: Bet[], entries: BankrollEntry[]): BankrollSummary {
  type Event = { date: string; delta: number; label?: string };

  const events: Event[] = [
    ...entries.map((e): Event => ({
      date: e.date,
      delta: entryDelta(e),
      label: `${e.type === 'deposit' ? 'Deposit' : e.type === 'withdrawal' ? 'Withdrawal' : 'Adjustment'}${e.note ? ` — ${e.note}` : ''}`,
    })),
    ...bets
      .filter(b => b.result !== 'pending')
      .map((b): Event => ({ date: b.date, delta: (b.returns ?? 0) - b.stake })),
  ].sort((a, b) => +new Date(a.date) - +new Date(b.date));

  let balance = 0;
  const points: BankrollPoint[] = [{ date: events[0]?.date ?? new Date().toISOString(), balance: 0 }];
  for (const ev of events) {
    balance += ev.delta;
    points.push({ date: ev.date, balance, label: ev.label });
  }

  const totalDeposited = entries.filter(e => e.type === 'deposit').reduce((s, e) => s + e.amount, 0);
  const totalWithdrawn = entries.filter(e => e.type === 'withdrawal').reduce((s, e) => s + e.amount, 0);
  const bettingPnl = bets.filter(b => b.result !== 'pending').reduce((s, b) => s + (b.returns ?? 0) - b.stake, 0);

  return { currentBalance: balance, totalDeposited, totalWithdrawn, bettingPnl, points };
}
