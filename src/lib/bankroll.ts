// Computes the bankroll page's running-balance series from deposits/withdrawals/adjustments plus settled-bet P&L.
import { Bet, BankrollEntry, BankrollPoint } from './types';

export interface BankrollSummary {
  currentBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  bettingPnl: number; // contribution from settled bets alone, real currency
  points: BankrollPoint[];
}

// Signed balance change for one bankroll entry — withdrawals subtract,
// deposits and adjustments add (an adjustment can itself be negative for corrections).
function entryDelta(entry: BankrollEntry): number {
  if (entry.type === 'withdrawal') {
    return -entry.amount;
  }

  return entry.amount;
}

// Running balance over time: chronological merge of bankroll entries (deposits/
// withdrawals/adjustments) and settled bet P&L, both in real currency.
export function computeBankrollSeries(bets: Bet[], entries: BankrollEntry[]): BankrollSummary {
  type Event = { date: string; delta: number; label?: string };

  const events: Event[] = [
    ...entries.map((entry): Event => ({
      date: entry.date,
      delta: entryDelta(entry),
      label: `${entry.type === 'deposit' ? 'Deposit' : entry.type === 'withdrawal' ? 'Withdrawal' : 'Adjustment'}${entry.note ? ` — ${entry.note}` : ''}`,
    })),
    ...bets
      .filter((bet) => bet.result !== 'pending')
      .map((bet): Event => ({ date: bet.date, delta: (bet.returns ?? 0) - bet.stake })),
  ].sort((a, b) => +new Date(a.date) - +new Date(b.date));

  let balance = 0;
  const points: BankrollPoint[] = [{ date: events[0]?.date ?? new Date().toISOString(), balance: 0 }];

  for (const event of events) {
    balance += event.delta;
    points.push({ date: event.date, balance, label: event.label });
  }

  const totalDeposited = entries.filter((entry) => entry.type === 'deposit').reduce((sum, entry) => sum + entry.amount, 0);
  const totalWithdrawn = entries.filter((entry) => entry.type === 'withdrawal').reduce((sum, entry) => sum + entry.amount, 0);
  const bettingPnl = bets.filter((bet) => bet.result !== 'pending').reduce((sum, bet) => sum + (bet.returns ?? 0) - bet.stake, 0);

  return { currentBalance: balance, totalDeposited, totalWithdrawn, bettingPnl, points };
}
