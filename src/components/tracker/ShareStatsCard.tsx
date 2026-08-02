'use client';

// Off-screen card captured by the "share stats" button — styled standalone
// since the inline stats row assumes surrounding page chrome it won't have
// once exported as a PNG.
import { Ref } from 'react';
import { SITE_NAME } from '@/lib/config';
import { StatItem } from './StatsRow';

interface ShareStatsCardProps {
  cardRef: Ref<HTMLDivElement>;
  periodLabel: string;
  items: StatItem[];
}

// Renders the stats card that gets captured as a PNG for sharing.
export default function ShareStatsCard({ cardRef, periodLabel, items }: ShareStatsCardProps) {
  return (
    <div style={{ position: 'fixed', top: 0, left: -9999, pointerEvents: 'none' }}>
      <div ref={cardRef} style={{
        width: 420, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 18,
        padding: '28px 26px', fontFamily: 'var(--font-body)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
            {SITE_NAME}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.08em' }}>
            {periodLabel.toUpperCase()}
          </span>
        </div>
        <div style={{ height: 1, background: 'var(--border)', margin: '16px 0 20px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {items.map((item, index) => (
            <div key={index}>
              <div className="tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: item.color, letterSpacing: '-0.01em' }}>
                {item.value}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.06em', marginTop: 4 }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
