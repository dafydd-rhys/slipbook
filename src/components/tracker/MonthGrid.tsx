// Shared building blocks for a month-by-month P&L grid — used by the full
// CalendarView (with year navigation) and the static Insights share card.
import { Bet } from '@/lib/types';
import { formatUnits } from '@/lib/units';

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Sums settled P&L for bets placed in a given year/month.
export function monthPnl(bets: Bet[], year: number, month: number): number {
  return bets.reduce((sum, bet) => {
    if (bet.result === 'pending') {
      return sum;
    }

    const betDate = new Date(bet.date);

    if (betDate.getFullYear() !== year || betDate.getMonth() !== month) {
      return sum;
    }

    return sum + ((bet.returns ?? 0) - bet.stake);
  }, 0);
}

// Picks a tile's text colour based on whether the month was profitable.
function tileColor(pnl: number): string {
  return pnl > 0 ? 'var(--won)' : pnl < 0 ? 'var(--lost)' : 'var(--text-faint)';
}

// Small up/down triangle indicating a profitable or losing month.
function Arrow({ pnl }: { pnl: number }) {
  if (pnl === 0) {
    return null;
  }

  const up = pnl > 0;

  return (
    <span style={{
      width: 0, height: 0, display: 'inline-block', flexShrink: 0,
      borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
      borderBottom: up ? '6px solid var(--won)' : 'none',
      borderTop: up ? 'none' : '6px solid var(--lost)',
    }} />
  );
}

// One month tile showing its name and P&L.
export function MonthTile({ label, pnl }: { label: string; pnl: number }) {
  const color = tileColor(pnl);

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 11,
      padding: '15px 10px', textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', letterSpacing: '0.08em' }}>
        {label.toUpperCase()}
      </div>
      <div className="tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 600, color, marginTop: 9, display: 'flex', alignItems: 'center', gap: 4 }}>
        <Arrow pnl={pnl} />
        {pnl > 0 ? '+' : ''}{formatUnits(pnl)}
      </div>
    </div>
  );
}
