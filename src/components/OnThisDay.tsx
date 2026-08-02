'use client';

import { Bet } from '@/lib/types';
import { onThisDay } from '@/lib/stats';

export default function OnThisDay({ bets }: { bets: Bet[] }) {
  const entries = onThisDay(bets);
  if (entries.length === 0) return null;

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.06em', marginBottom: 10 }}>
        ON THIS DAY
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map(e => (
          <div key={e.year} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              {e.year} — {e.bets.length} bet{e.bets.length !== 1 ? 's' : ''}
              {e.bets.length === 1 && <span style={{ color: 'var(--text-faint)' }}> ({e.bets[0].title})</span>}
            </span>
            <span className="tabular" style={{
              fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700,
              color: e.pnlUnits > 0 ? 'var(--won)' : e.pnlUnits < 0 ? 'var(--lost)' : 'var(--text-faint)',
            }}>
              {e.pnlUnits > 0 ? '+' : ''}{e.pnlUnits.toFixed(2)}u
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
