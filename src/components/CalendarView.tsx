'use client';

import { useState } from 'react';
import { Bet } from '@/lib/types';
import { formatUnits } from '@/lib/units';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MIN_YEAR = 2026;

// May 2026 and everything before it predates this app's tracking — folded into one
// "all-time" blob carrying prior lifetime profit, rather than empty/missing tiles.
const PRE_TRACKING_YEAR = 2026;
const PRE_TRACKING_END_MONTH = 4; // blob covers Jan(0)..May(4) inclusive
const PRE_TRACKING_PROFIT_GBP = 469;

function monthPnl(bets: Bet[], year: number, month: number): number {
  return bets.reduce((sum, b) => {
    if (b.result === 'pending') return sum;
    const d = new Date(b.date);
    if (d.getFullYear() !== year || d.getMonth() !== month) return sum;
    return sum + ((b.returns ?? 0) - b.stake);
  }, 0);
}

function tileColors(pnl: number) {
  return {
    color: pnl > 0 ? '#10b981' : pnl < 0 ? '#ef4444' : '#64748b',
    bg: pnl > 0 ? 'rgba(16,185,129,0.10)' : pnl < 0 ? 'rgba(239,68,68,0.08)' : 'rgba(100,116,139,0.08)',
    border: pnl > 0 ? 'rgba(16,185,129,0.35)' : pnl < 0 ? 'rgba(239,68,68,0.3)' : 'rgba(100,116,139,0.25)',
  };
}

function Tile({ label, pnl, sublabel, style }: {
  label: string; pnl: number; sublabel?: string; style?: React.CSSProperties;
}) {
  const { color, bg, border } = tileColors(pnl);
  return (
    <div style={{
      background: bg, border: `1px solid ${border}`, borderRadius: 12,
      padding: '14px 10px', textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      ...style,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color, marginTop: 8 }}>
        {pnl > 0 ? '+' : ''}{formatUnits(pnl)}
      </div>
      {sublabel && (
        <div style={{ fontSize: 9, color: '#475569', fontStyle: 'italic', marginTop: 4 }}>
          {sublabel}
        </div>
      )}
    </div>
  );
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
  const isBlobYear = year === PRE_TRACKING_YEAR;

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

      {/* 3 x 4 month grid. In the blob year, Jan–May fold into an L-shaped
          block: one piece spans the full first row, a second piece spans
          just the first 2 columns of the second row. The second piece is
          pulled up by `gap` (via a negative margin, confined to its own
          2 columns) so it merges seamlessly with the row above it — June,
          sitting in the remaining column-3/row-2 cell, is untouched by that
          margin and stays a normal Tile with the usual grid gap on all sides. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {isBlobYear ? (
          <>
            <div style={{
              gridColumn: '1 / 4', gridRow: '1 / 2',
              background: tileColors(PRE_TRACKING_PROFIT_GBP).bg,
              borderTop: `1px solid ${tileColors(PRE_TRACKING_PROFIT_GBP).border}`,
              borderLeft: `1px solid ${tileColors(PRE_TRACKING_PROFIT_GBP).border}`,
              borderRight: `1px solid ${tileColors(PRE_TRACKING_PROFIT_GBP).border}`,
              borderTopLeftRadius: 12, borderTopRightRadius: 12,
              borderBottomLeftRadius: 0, borderBottomRightRadius: 12,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '14px 10px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>
                MAY & BEFORE
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: tileColors(PRE_TRACKING_PROFIT_GBP).color, marginTop: 10 }}>
                +{formatUnits(PRE_TRACKING_PROFIT_GBP)}
              </div>
              <div style={{ fontSize: 11, color: '#475569', fontStyle: 'italic', marginTop: 6 }}>
                All-time
              </div>
            </div>
            <div style={{
              gridColumn: '1 / 3', gridRow: '2 / 3', marginTop: -10,
              background: tileColors(PRE_TRACKING_PROFIT_GBP).bg,
              borderLeft: `1px solid ${tileColors(PRE_TRACKING_PROFIT_GBP).border}`,
              borderRight: `1px solid ${tileColors(PRE_TRACKING_PROFIT_GBP).border}`,
              borderBottom: `1px solid ${tileColors(PRE_TRACKING_PROFIT_GBP).border}`,
              borderTopLeftRadius: 0, borderTopRightRadius: 0,
              borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
            }} />
            <Tile
              label={MONTHS[PRE_TRACKING_END_MONTH + 1]}
              pnl={monthPnl(bets, year, PRE_TRACKING_END_MONTH + 1)}
            />
            {MONTHS.slice(PRE_TRACKING_END_MONTH + 2).map((name, idx) => {
              const i = idx + PRE_TRACKING_END_MONTH + 2;
              return <Tile key={name} label={name} pnl={monthPnl(bets, year, i)} />;
            })}
          </>
        ) : (
          MONTHS.map((name, i) => <Tile key={name} label={name} pnl={monthPnl(bets, year, i)} />)
        )}
      </div>
    </div>
  );
}
