'use client';

// Editor for the individual selections that make up a single bet-builder leg.
import { BetResult, BetSubLeg } from '@/lib/types';
import { INPUT, RESULT_COLORS, SELECT } from '../adminPanelStyles';
import { COMMON_MARKETS } from '@/lib/betFormOptions';

export default function SubLegEditor({ subLegs, onChange }: {
  subLegs: Omit<BetSubLeg, 'id'>[]; onChange: (subLegs: Omit<BetSubLeg, 'id'>[]) => void;
}) {
  function update(index: number, field: keyof Omit<BetSubLeg, 'id'>, value: string) {
    const next = [...subLegs];

    next[index] = { ...next[index], [field]: value };
    onChange(next);
  }

  return (
    <div style={{ paddingLeft: 12, borderLeft: '2px solid var(--border)', marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.06em' }}>
          BUILDER SELECTIONS ({subLegs.length})
        </span>
        <button type="button" onClick={() => onChange([...subLegs, { selection: '', market: '', result: 'pending' }])}
          style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 11, padding: '3px 8px', cursor: 'pointer' }}>
          + Add
        </button>
      </div>
      {subLegs.map((subLeg, index) => (
        <div key={index} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input value={subLeg.selection} onChange={(event) => update(index, 'selection', event.target.value)}
              placeholder="Selection" style={{ ...INPUT, flex: 2 }} />
            <input value={subLeg.market} onChange={(event) => update(index, 'market', event.target.value)}
              placeholder="Market" style={{ ...INPUT, flex: 2 }} />
            <select value={subLeg.result} onChange={(event) => update(index, 'result', event.target.value as BetResult)}
              style={{ ...SELECT, flex: 1, color: RESULT_COLORS[subLeg.result] }}>
              <option value="pending">Pending</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="void">Void</option>
            </select>
            <button type="button" onClick={() => onChange(subLegs.filter((_, otherIndex) => otherIndex !== index))}
              style={{ background: 'transparent', border: 'none', color: 'var(--lost)', opacity: 0.6, fontSize: 14, cursor: 'pointer', padding: 0, flexShrink: 0 }}>
              ✕
            </button>
          </div>
          <select
            value=""
            onChange={(event) => {
              if (event.target.value) {
                update(index, 'market', event.target.value);
              }
            }}
            style={{ ...SELECT, marginTop: 4, fontSize: 11, padding: '4px 8px' }}
          >
            <option value="">Quick pick market…</option>
            {COMMON_MARKETS.map((market) => <option key={market} value={market}>{market}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}
