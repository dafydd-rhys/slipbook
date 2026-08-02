'use client';

// "On This Day" card — recalls what happened on today's calendar date in past years.
import { Bet } from '@/lib/types';
import { onThisDay } from '@/lib/stats';

export default function OnThisDay({ bets }: { bets: Bet[] }) {
  const entries = onThisDay(bets);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.06em', marginBottom: 10 }}>
        ON THIS DAY
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map((entry) => (
          <div key={entry.year} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              {entry.year} — {entry.bets.length} bet{entry.bets.length !== 1 ? 's' : ''}
              {entry.bets.length === 1 && <span style={{ color: 'var(--text-faint)' }}> ({entry.bets[0].title})</span>}
            </span>
            <span className="tabular" style={{
              fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700,
              color: entry.pnlUnits > 0 ? 'var(--won)' : entry.pnlUnits < 0 ? 'var(--lost)' : 'var(--text-faint)',
            }}>
              {entry.pnlUnits > 0 ? '+' : ''}{entry.pnlUnits.toFixed(2)}u
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
