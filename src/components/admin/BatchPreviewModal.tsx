'use client';

// Shown after importing several betslip screenshots at once — lets you drop
// any that came out wrong before adding the rest in one batch call.
import { Bet } from '@/lib/types';
import BetCard from '@/components/tracker/BetCard';

interface BatchPreviewModalProps {
  bets: Bet[];
  errors: string[];
  saving: boolean;
  onDiscardAll: () => void;
  onRemoveOne: (index: number) => void;
  onAddAll: () => void;
}

export default function BatchPreviewModal({ bets, errors, saving, onDiscardAll, onRemoveOne, onAddAll }: BatchPreviewModalProps) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(6px)', zIndex: 200,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '32px 16px', overflowY: 'auto',
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onDiscardAll();
        }
      }}
    >
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            Preview {bets.length} Slip{bets.length !== 1 ? 's' : ''}
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>Remove any that don&apos;t look right, then add the rest at once.</p>
        </div>

        {errors.length > 0 && (
          <div style={{ background: 'var(--lost-soft)', border: '1px solid color-mix(in srgb, var(--lost) 40%, transparent)', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
            <p style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--lost)', marginBottom: 4 }}>
              {errors.length} screenshot{errors.length !== 1 ? 's' : ''} couldn&apos;t be read:
            </p>
            {errors.map((error, index) => <p key={index} style={{ fontSize: 11, color: 'var(--lost)' }}>{error}</p>)}
          </div>
        )}

        {bets.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', padding: '20px 0' }}>Nothing left to add.</p>
        ) : (
          bets.map((bet, index) => (
            <div key={bet.id} style={{ position: 'relative', marginBottom: 12 }}>
              <BetCard bet={bet} fmt="decimal" shareable={false} />
              <button
                onClick={() => onRemoveOne(index)}
                title="Remove this one"
                style={{
                  position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: '50%',
                  background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--lost)',
                  fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>
          ))
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button
            onClick={onDiscardAll}
            disabled={saving}
            style={{
              flex: 1, background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 10, color: 'var(--text-muted)', fontSize: 14, fontWeight: 600,
              padding: 12, cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            Discard All
          </button>
          <button
            onClick={onAddAll}
            disabled={saving || bets.length === 0}
            style={{
              flex: 1, background: 'var(--accent)', border: 'none',
              borderRadius: 10, color: 'var(--accent-contrast)', fontSize: 14, fontWeight: 700,
              padding: 12, cursor: (saving || bets.length === 0) ? 'not-allowed' : 'pointer',
              opacity: (saving || bets.length === 0) ? 0.6 : 1,
            }}
          >
            {saving ? 'Adding…' : `Add All (${bets.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
