'use client';

// Shown before a brand-new bet is saved, so the slip can be double-checked first.
import { Bet } from '@/lib/types';
import BetCard from '@/components/tracker/BetCard';

interface BetPreviewModalProps {
  bet: Bet;
  saving: boolean;
  onKeepEditing: () => void;
  onConfirm: () => void;
}

export default function BetPreviewModal({ bet, saving, onKeepEditing, onConfirm }: BetPreviewModalProps) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(6px)', zIndex: 200,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '32px 16px', overflowY: 'auto',
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onKeepEditing();
        }
      }}
    >
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Preview Slip</h3>
          <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>Check your bet before adding it.</p>
        </div>
        <BetCard bet={bet} fmt="decimal" shareable={false} />
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button
            onClick={onKeepEditing}
            style={{
              flex: 1, background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 10, color: 'var(--text-muted)', fontSize: 14, fontWeight: 600,
              padding: 12, cursor: 'pointer',
            }}
          >
            ← Keep Editing
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            style={{
              flex: 1, background: 'var(--accent)', border: 'none',
              borderRadius: 10, color: 'var(--accent-contrast)', fontSize: 14, fontWeight: 700,
              padding: 12, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Adding…' : 'Confirm & Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
