'use client';

// Sticky toolbar that appears above the Manage list once one or more bets are checked.
import { BetResult } from '@/lib/types';
import { RESULT_COLORS } from '../adminPanelStyles';

const BULK_RESULTS: BetResult[] = ['won', 'lost', 'void', 'pending'];

interface BulkActionsBarProps {
  selectedCount: number;
  busy: boolean;
  onSetResult: (result: BetResult) => void;
  onDelete: () => void;
  onClear: () => void;
}

export default function BulkActionsBar({ selectedCount, busy, onSetResult, onDelete, onClear }: BulkActionsBarProps) {
  return (
    <div style={{
      position: 'sticky', top: 8, zIndex: 50, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: 12, padding: '9px 12px', marginBottom: 14,
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 700, color: 'var(--accent)', marginRight: 4 }}>
        {selectedCount} SELECTED
      </span>
      {BULK_RESULTS.map((result) => (
        <button key={result} type="button" disabled={busy} onClick={() => onSetResult(result)} style={{
          background: 'transparent', border: `1px solid color-mix(in srgb, ${RESULT_COLORS[result]} 45%, transparent)`,
          borderRadius: 6, color: RESULT_COLORS[result], fontSize: 11, fontWeight: 600, padding: '4px 10px',
          cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.5 : 1,
        }}>
          Mark {result}
        </button>
      ))}
      <button type="button" disabled={busy} onClick={onDelete} style={{
        background: 'transparent', border: '1px solid color-mix(in srgb, var(--lost) 45%, transparent)',
        borderRadius: 6, color: 'var(--lost)', fontSize: 11, fontWeight: 600, padding: '4px 10px',
        cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.5 : 1,
      }}>
        Delete
      </button>
      <button type="button" onClick={onClear} style={{
        marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-faint)', fontSize: 11, cursor: 'pointer',
      }}>
        Clear
      </button>
    </div>
  );
}
