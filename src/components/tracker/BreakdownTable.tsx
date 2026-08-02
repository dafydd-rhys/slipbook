'use client';

// Generic ranked table used for every Insights breakdown (sport, bet type,
// bookmaker, market, odds range, day/time, correlations).
import { BreakdownRow } from '@/lib/types';
import { formatUnits } from '@/lib/units';

interface Props {
  rows: BreakdownRow[];
  showMoney?: boolean; // false for leg-level breakdowns (market) where pnl/units are always 0
}

// Renders a ranked table of breakdown rows, or a placeholder if there's no data yet.
export default function BreakdownTable({ rows, showMoney = true }: Props) {
  if (rows.length === 0) {
    return <p style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0', fontSize: 13 }}>Not enough data yet.</p>;
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: showMoney ? '1fr 50px 60px 60px 60px' : '1fr 50px 70px',
        gap: 8, padding: '9px 14px', background: 'var(--surface-2)',
        fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.05em',
      }}>
        <span>NAME</span>
        <span style={{ textAlign: 'right' }}>N</span>
        {showMoney && <span style={{ textAlign: 'right' }}>UNITS</span>}
        {showMoney && <span style={{ textAlign: 'right' }}>ROI</span>}
        <span style={{ textAlign: 'right' }}>WIN%</span>
      </div>
      {rows.map((row, index) => (
        <div key={row.key} className="stagger-in" style={{
          ['--i' as string]: Math.min(index, 8),
          display: 'grid', gridTemplateColumns: showMoney ? '1fr 50px 60px 60px 60px' : '1fr 50px 70px',
          gap: 8, padding: '9px 14px', background: 'var(--surface)',
          borderTop: index > 0 ? '1px solid var(--border-soft)' : undefined, alignItems: 'center',
        }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.label}</span>
          <span className="tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'right' }}>{row.bets}</span>
          {showMoney && (
            <span className="tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 600, textAlign: 'right', color: row.units >= 0 ? 'var(--won)' : 'var(--lost)' }}>
              {row.units >= 0 ? '+' : ''}{formatUnits(row.pnl).replace('u', '')}
            </span>
          )}
          {showMoney && (
            <span className="tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, textAlign: 'right', color: row.roi >= 0 ? 'var(--won)' : 'var(--lost)' }}>
              {row.roi >= 0 ? '+' : ''}{row.roi.toFixed(0)}%
            </span>
          )}
          <span className="tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, textAlign: 'right', color: 'var(--accent)' }}>
            {row.winRate.toFixed(0)}%
          </span>
        </div>
      ))}
    </div>
  );
}
