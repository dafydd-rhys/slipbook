'use client';

// Single row in the Manage tab: checkbox, summary line, result badge, and row actions.
import { Bet } from '@/lib/types';
import { CURRENCY_SYMBOL } from '@/lib/config';
import { RESULT_COLORS } from '../adminPanelStyles';
import { SETTLE_SUGGEST_COST_ESTIMATE } from '@/lib/aiCostEstimates';

interface ManageRowProps {
  bet: Bet;
  selected: boolean;
  aiEnabled: boolean | null;
  onToggleSelect: () => void;
  onSuggestResult: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ManageRow({ bet, selected, aiEnabled, onToggleSelect, onSuggestResult, onEdit, onDelete }: ManageRowProps) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 12, padding: '11px 14px', marginBottom: 10,
      display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap',
    }}>
      <div style={{ paddingTop: 2, flexShrink: 0 }}>
        <input type="checkbox" checked={selected} onChange={onToggleSelect} style={{ width: 15, height: 15, cursor: 'pointer' }} />
      </div>

      <div style={{ flex: '1 1 180px', minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{bet.title}</span>
        {bet.bookmaker && <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 6 }}>· {bet.bookmaker}</span>}
        <span className="tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-faint)', display: 'block', marginTop: 2 }}>
          {new Date(bet.date).toLocaleDateString('en-GB')} · {bet.legs.length} leg{bet.legs.length !== 1 ? 's' : ''} · @{bet.totalOdds} · {CURRENCY_SYMBOL}{bet.stake}
        </span>
      </div>

      <div style={{ flexShrink: 0, paddingTop: 1 }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 700, padding: '3px 8px', borderRadius: 5,
          background: `color-mix(in srgb, ${RESULT_COLORS[bet.result]} 14%, transparent)`,
          color: RESULT_COLORS[bet.result],
          border: `1px solid color-mix(in srgb, ${RESULT_COLORS[bet.result]} 45%, transparent)`,
        }}>
          {bet.result.toUpperCase()}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0, width: '100%', justifyContent: 'flex-end' }}>
        {bet.result === 'pending' && (
          <button
            onClick={onSuggestResult}
            disabled={aiEnabled === false}
            title={aiEnabled === false ? "AI features aren't configured — see the Knowledge Base" : `~${SETTLE_SUGGEST_COST_ESTIMATE} in AI usage`}
            style={{
              background: 'transparent', border: '1px solid color-mix(in srgb, var(--pending) 40%, transparent)', borderRadius: 6,
              color: 'var(--pending)', fontSize: 11, padding: '4px 10px',
              cursor: aiEnabled === false ? 'not-allowed' : 'pointer', opacity: aiEnabled === false ? 0.4 : 1,
            }}>
            Suggest Result
          </button>
        )}
        <button onClick={onEdit} style={{
          background: 'transparent', border: '1px solid var(--border)', borderRadius: 6,
          color: 'var(--accent)', fontSize: 11, padding: '4px 10px', cursor: 'pointer',
        }}>Edit</button>
        <button onClick={onDelete} style={{
          background: 'transparent', border: '1px solid color-mix(in srgb, var(--lost) 30%, transparent)', borderRadius: 6,
          color: 'var(--lost)', fontSize: 11, padding: '4px 10px', cursor: 'pointer',
        }}>Delete</button>
      </div>
    </div>
  );
}
