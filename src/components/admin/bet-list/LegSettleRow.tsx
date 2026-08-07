'use client';

// One leg's summary plus quick won/lost/void/pending buttons — used inside an
// expanded ManageRow so a leg can be settled without opening the full edit form.
import { BetLeg, BetResult } from '@/lib/types';
import { RESULT_COLORS } from '../adminPanelStyles';

const RESULTS: BetResult[] = ['won', 'lost', 'void', 'pending'];

interface LegSettleRowProps {
  leg: BetLeg;
  onSetResult: (result: BetResult) => void;
}

export default function LegSettleRow({ leg, onSetResult }: LegSettleRowProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      padding: '7px 0', borderTop: '1px solid var(--border-soft)', flexWrap: 'wrap',
    }}>
      <div style={{ minWidth: 0, flex: '1 1 160px' }}>
        <span style={{ fontSize: 12, color: 'var(--text)' }}>{leg.selection}</span>
        <span style={{ fontSize: 10.5, color: 'var(--text-faint)', display: 'block' }}>
          {leg.market}{leg.matchup ? ` · ${leg.matchup}` : ''}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {RESULTS.map((result) => {
          const active = leg.result === result;

          return (
            <button
              key={result}
              onClick={() => onSetResult(result)}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.04em',
                padding: '3px 7px', borderRadius: 5, cursor: 'pointer',
                background: active ? `color-mix(in srgb, ${RESULT_COLORS[result]} 14%, transparent)` : 'transparent',
                color: RESULT_COLORS[result],
                border: `1px solid color-mix(in srgb, ${RESULT_COLORS[result]} ${active ? 45 : 20}%, transparent)`,
              }}
            >
              {result.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
