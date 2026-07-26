'use client';

import { useState } from 'react';
import { Bet } from '@/lib/types';
import { formatUnits } from '@/lib/units';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MIN_YEAR = 2026;

function monthPnl(bets: Bet[], year: number, month: number): number {
  return bets.reduce((sum, b) => {
    if (b.result === 'pending') return sum;
    const d = new Date(b.date);
    if (d.getFullYear() !== year || d.getMonth() !== month) return sum;
    return sum + ((b.returns ?? 0) - b.stake);
  }, 0);
}

interface Props {
  bets: Bet[];
  onBack: () => void;
}

export default function CalendarView({ bets, onBack }: Props) {
  const maxYear = new Date().getFullYear();
  const [year, setYear] = useState(maxYear);
  const canPrev = year > MIN_YEAR;
  const canNext = year < maxYear;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 20px 56px' }}>
      {/* Year nav + back to day view */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button
          onClick={onBack}
          style={{
            background: 'transparent', border: '1px solid #2a2a52', borderRadius: 20,
            color: '#a78bfa', fontSize: 12, fontWeight: 700, padding: '5px 14px', cursor: 'pointer',
          }}
        >
          ← Day View
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => canPrev && setYear(y => y - 1)}
            aria-label="Previous year"
            disabled={!canPrev}
            style={{
              background: 'transparent', border: `1px solid ${canPrev ? '#2a2a52' : '#141428'}`, borderRadius: '50%',
              width: 28, height: 28, color: canPrev ? '#64748b' : '#1e1e3e',
              cursor: canPrev ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ‹
          </button>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', minWidth: 50, textAlign: 'center' }}>
            {year}
          </span>
          <button
            onClick={() => canNext && setYear(y => y + 1)}
            aria-label="Next year"
            disabled={!canNext}
            style={{
              background: 'transparent', border: `1px solid ${canNext ? '#2a2a52' : '#141428'}`, borderRadius: '50%',
              width: 28, height: 28, color: canNext ? '#64748b' : '#1e1e3e',
              cursor: canNext ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ›
          </button>
        </div>
      </div>

      {/* 3 x 4 month grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {MONTHS.map((name, i) => {
          const pnl = monthPnl(bets, year, i);
          const color = pnl > 0 ? '#10b981' : pnl < 0 ? '#ef4444' : '#64748b';
          const bg = pnl > 0 ? 'rgba(16,185,129,0.10)' : pnl < 0 ? 'rgba(239,68,68,0.08)' : 'rgba(100,116,139,0.08)';
          const border = pnl > 0 ? 'rgba(16,185,129,0.35)' : pnl < 0 ? 'rgba(239,68,68,0.3)' : 'rgba(100,116,139,0.25)';
          return (
            <div
              key={name}
              style={{
                background: bg, border: `1px solid ${border}`, borderRadius: 12,
                padding: '14px 10px', textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em', marginBottom: 8 }}>
                {name}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color }}>
                {pnl > 0 ? '+' : ''}{formatUnits(pnl)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
