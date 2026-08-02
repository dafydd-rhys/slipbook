'use client';

// "Suggest Result" modal — shows the AI's web-searched guess per leg (with a
// confidence level) for a pending bet. Always a suggestion to review, never auto-applied.
import { Bet, BetResult } from '@/lib/types';
import { RESULT_COLORS } from './adminPanelStyles';
import Spinner from '@/components/Spinner';

export type SettleSuggestion = {
  legs: { index: number; result: BetResult; confidence: 'high' | 'medium' | 'low'; note: string }[];
  summary: string;
};

interface SettleSuggestionModalProps {
  bet: Bet;
  result: SettleSuggestion | null;
  error: string;
  busy: boolean;
  onClose: () => void;
  onApply: () => void;
}

export default function SettleSuggestionModal({ bet, result, error, busy, onClose, onApply }: SettleSuggestionModalProps) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(6px)', zIndex: 200,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '32px 16px', overflowY: 'auto',
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onClose();
        }
      }}
    >
      <div style={{ width: '100%', maxWidth: 440, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 18px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
          Suggested Result
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 14 }}>{bet.title}</p>

        {busy && (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <Spinner size={26} style={{ marginBottom: 10 }} />
            <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>Searching the web for results…</p>
          </div>
        )}

        {error && <p style={{ fontSize: 12, color: 'var(--lost)', marginBottom: 12 }}>{error}</p>}

        {result && (
          <>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 12 }}>{result.summary}</p>
            {result.legs.map((suggestion) => {
              const leg = bet.legs[suggestion.index];

              if (!leg) {
                return null;
              }

              return (
                <div key={suggestion.index} style={{ borderTop: '1px solid var(--border-soft)', padding: '9px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{leg.selection}</span>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                      background: `color-mix(in srgb, ${RESULT_COLORS[suggestion.result]} 14%, transparent)`, color: RESULT_COLORS[suggestion.result], flexShrink: 0,
                    }}>
                      {suggestion.result.toUpperCase()} · {suggestion.confidence}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 3 }}>{suggestion.note}</p>
                </div>
              );
            })}
          </>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={{
            flex: 1, background: 'transparent', border: '1px solid var(--border)', borderRadius: 10,
            color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, padding: 11, cursor: 'pointer',
          }}>
            Close
          </button>
          {result && (
            <button onClick={onApply} style={{
              flex: 1, background: 'var(--accent)', border: 'none', borderRadius: 10,
              color: 'var(--accent-contrast)', fontSize: 13, fontWeight: 700, padding: 11, cursor: 'pointer',
            }}>
              Review &amp; Apply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
