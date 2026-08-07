'use client';

// The "Manage" tab: every bet grouped by day, newest first, with bulk actions
// once one or more are selected.
import { Bet, BetResult } from '@/lib/types';
import { groupByDay } from '@/lib/dates';
import BulkActionsBar from './BulkActionsBar';
import ManageRow from './ManageRow';

interface BetManageListProps {
  bets: Bet[];
  selectedIds: Set<string>;
  bulkBusy: boolean;
  aiEnabled: boolean | null;
  onToggleSelect: (id: string) => void;
  onBulkSetResult: (result: BetResult) => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  onSuggestResult: (bet: Bet) => void;
  onUpdateLegResult: (bet: Bet, legId: string, result: BetResult) => void;
  onEdit: (bet: Bet) => void;
  onDelete: (id: string) => void;
}

export default function BetManageList({
  bets, selectedIds, bulkBusy, aiEnabled,
  onToggleSelect, onBulkSetResult, onBulkDelete, onClearSelection, onSuggestResult, onUpdateLegResult, onEdit, onDelete,
}: BetManageListProps) {
  if (bets.length === 0) {
    return <p style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '40px 0', fontSize: 14 }}>No bets yet. Add one!</p>;
  }

  const days = groupByDay([...bets].sort((a, b) => +new Date(b.date) - +new Date(a.date)));

  return (
    <div>
      {selectedIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          busy={bulkBusy}
          onSetResult={onBulkSetResult}
          onDelete={onBulkDelete}
          onClear={onClearSelection}
        />
      )}

      {days.map(({ label, bets: dayBets }, dayIndex) => (
        <div key={label} style={{ marginTop: dayIndex > 0 ? 24 : 0 }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--text-faint)',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            paddingBottom: 10, borderBottom: '1px solid var(--border)', marginBottom: 12,
          }}>
            {label}
          </div>
          {dayBets.map((bet) => (
            <ManageRow
              key={bet.id}
              bet={bet}
              selected={selectedIds.has(bet.id)}
              aiEnabled={aiEnabled}
              onToggleSelect={() => onToggleSelect(bet.id)}
              onSuggestResult={() => onSuggestResult(bet)}
              onUpdateLegResult={(legId, result) => onUpdateLegResult(bet, legId, result)}
              onEdit={() => onEdit(bet)}
              onDelete={() => onDelete(bet.id)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
