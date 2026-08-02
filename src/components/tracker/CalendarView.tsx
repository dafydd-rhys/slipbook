'use client';

// Month-by-month P&L grid for a chosen year, with year navigation clamped to
// the range of years actually covered by `bets`.
import { useState } from 'react';
import { Bet } from '@/lib/types';
import { MONTHS, monthPnl, MonthTile } from './MonthGrid';

// Round prev/next button for stepping between years, disabled past the data's range.
function YearNavButton({ dir, enabled, onClick }: { dir: 'prev' | 'next'; enabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={dir === 'prev' ? 'Previous year' : 'Next year'}
      disabled={!enabled}
      style={{
        background: 'var(--surface)', border: `1px solid ${enabled ? 'var(--border)' : 'var(--border-soft)'}`, borderRadius: 8,
        width: 28, height: 28, color: enabled ? 'var(--text-muted)' : 'var(--border)',
        cursor: enabled ? 'pointer' : 'default',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {dir === 'prev' ? '‹' : '›'}
    </button>
  );
}

interface YearNavProps {
  year: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onBack?: () => void;
}

// Year label with prev/next buttons, plus an optional "back to day view" link.
function YearNav({ year, canPrev, canNext, onPrev, onNext, onBack }: YearNavProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: onBack ? 'space-between' : 'center', marginBottom: 20 }}>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            background: 'transparent', border: '1px solid var(--border)', borderRadius: 20,
            color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.04em', padding: '6px 14px', cursor: 'pointer',
          }}
        >
          ← Day View
        </button>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <YearNavButton dir="prev" enabled={canPrev} onClick={onPrev} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text)', minWidth: 58, textAlign: 'center' }}>
          {year}
        </span>
        <YearNavButton dir="next" enabled={canNext} onClick={onNext} />
      </div>
    </div>
  );
}

interface Props {
  bets: Bet[];
  onBack?: () => void;
}

// Grid of 12 month tiles for the selected year, with year navigation.
// Always starts on the current year regardless of any other filter on the
// page — a betting calendar that opens mid-history is more confusing than useful.
export default function CalendarView({ bets, onBack }: Props) {
  const maxYear = new Date().getFullYear();
  const minYear = bets.length > 0
    ? Math.min(maxYear, ...bets.map((bet) => new Date(bet.date).getFullYear()))
    : maxYear;
  const [year, setYear] = useState(maxYear);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: onBack ? '20px 20px 56px' : '4px 0 8px' }}>
      <YearNav
        year={year}
        canPrev={year > minYear}
        canNext={year < maxYear}
        onPrev={() => setYear((current) => current - 1)}
        onNext={() => setYear((current) => current + 1)}
        onBack={onBack}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {MONTHS.map((name, index) => (
          <MonthTile key={name} label={name} pnl={monthPnl(bets, year, index)} />
        ))}
      </div>
    </div>
  );
}
