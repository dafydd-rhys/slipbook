'use client';

import { useState } from 'react';
import { Bet } from '@/lib/types';
import { formatUnits } from '@/lib/units';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function monthPnl(bets: Bet[], year: number, month: number): number {
  return bets.reduce((sum, b) => {
    if (b.result === 'pending') return sum;
    const d = new Date(b.date);
    if (d.getFullYear() !== year || d.getMonth() !== month) return sum;
    return sum + ((b.returns ?? 0) - b.stake);
  }, 0);
}

function tileColor(pnl: number): string {
  return pnl > 0 ? 'var(--won)' : pnl < 0 ? 'var(--lost)' : 'var(--text-faint)';
}

function Arrow({ pnl }: { pnl: number }) {
  if (pnl === 0) return null;
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

function Tile({ label, pnl }: { label: string; pnl: number }) {
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

interface Props {
  bets: Bet[];
  onBack?: () => void;
}

export default function CalendarView({ bets, onBack }: Props) {
  const maxYear = new Date().getFullYear();
  const minYear = bets.length > 0
    ? Math.min(maxYear, ...bets.map(b => new Date(b.date).getFullYear()))
    : maxYear;
  const [year, setYear] = useState(maxYear);
  const canPrev = year > minYear;
  const canNext = year < maxYear;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: onBack ? '20px 20px 56px' : '4px 0 8px' }}>
      {/* Year nav + optional back to day view */}
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
          <button
            onClick={() => canPrev && setYear(y => y - 1)}
            aria-label="Previous year"
            disabled={!canPrev}
            style={{
              background: 'var(--surface)', border: `1px solid ${canPrev ? 'var(--border)' : 'var(--border-soft)'}`, borderRadius: 8,
              width: 28, height: 28, color: canPrev ? 'var(--text-muted)' : 'var(--border)',
              cursor: canPrev ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ‹
          </button>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text)', minWidth: 58, textAlign: 'center' }}>
            {year}
          </span>
          <button
            onClick={() => canNext && setYear(y => y + 1)}
            aria-label="Next year"
            disabled={!canNext}
            style={{
              background: 'var(--surface)', border: `1px solid ${canNext ? 'var(--border)' : 'var(--border-soft)'}`, borderRadius: 8,
              width: 28, height: 28, color: canNext ? 'var(--text-muted)' : 'var(--border)',
              cursor: canNext ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ›
          </button>
        </div>
      </div>

      {/* 3 x 4 month grid, every year rendered the same way. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {MONTHS.map((name, i) => (
          <Tile key={name} label={name} pnl={monthPnl(bets, year, i)} />
        ))}
      </div>
    </div>
  );
}
