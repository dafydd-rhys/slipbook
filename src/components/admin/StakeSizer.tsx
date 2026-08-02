'use client';

import { useState } from 'react';
import { CURRENCY_SYMBOL } from '@/lib/config';

const INPUT: React.CSSProperties = {
  background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
  color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 13, padding: '7px 9px', width: '100%', outline: 'none',
};
const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.05em',
  display: 'block', marginBottom: 4, textTransform: 'uppercase',
};
const BANKROLL_KEY = 'strz_stake_sizer_bankroll';

type Mode = 'kelly' | 'flat';
type KellyFraction = 1 | 0.5 | 0.25;

function kellyStake(bankroll: number, odds: number, probability: number, fraction: KellyFraction): number {
  const b = odds - 1;
  if (b <= 0) return 0;
  const p = probability / 100;
  const q = 1 - p;
  const f = (b * p - q) / b;
  return Math.max(0, f * fraction * bankroll);
}

export default function StakeSizer({ odds, onApply }: { odds: string; onApply: (stake: string) => void }) {
  const [open, setOpen] = useState(false);
  const [bankroll, setBankroll] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem(BANKROLL_KEY) ?? '' : ''
  );
  const [mode, setMode] = useState<Mode>('kelly');
  const [probability, setProbability] = useState('50');
  const [kellyFraction, setKellyFraction] = useState<KellyFraction>(0.5);
  const [flatPct, setFlatPct] = useState('2');

  function updateBankroll(v: string) {
    setBankroll(v);
    if (typeof window !== 'undefined') localStorage.setItem(BANKROLL_KEY, v);
  }

  const oddsNum = parseFloat(odds) || 0;
  const bankrollNum = parseFloat(bankroll) || 0;
  const suggested = mode === 'kelly'
    ? kellyStake(bankrollNum, oddsNum, parseFloat(probability) || 0, kellyFraction)
    : bankrollNum * (parseFloat(flatPct) || 0) / 100;

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} style={{
        background: 'transparent', border: '1px solid var(--border)', borderRadius: 6,
        color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10.5, padding: '3px 8px', cursor: 'pointer', marginTop: 6,
      }}>
        Stake sizing helper
      </button>
    );
  }

  return (
    <div className="rise-in" style={{ background: 'var(--bg)', border: '1px solid var(--border-soft)', borderRadius: 10, padding: 12, marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.06em' }}>STAKE SIZING HELPER</span>
        <button type="button" onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-faint)', fontSize: 12, cursor: 'pointer', padding: 0 }}>✕</button>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {(['kelly', 'flat'] as const).map(m => (
          <button key={m} type="button" onClick={() => setMode(m)} style={{
            background: mode === m ? 'var(--accent-soft)' : 'transparent',
            border: `1px solid ${mode === m ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 14, color: mode === m ? 'var(--accent)' : 'var(--text-faint)',
            fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, padding: '4px 10px', cursor: 'pointer',
          }}>
            {m === 'kelly' ? 'Kelly Criterion' : 'Flat % of Bankroll'}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={LABEL}>Bankroll ({CURRENCY_SYMBOL})</label>
        <input value={bankroll} onChange={e => updateBankroll(e.target.value)} inputMode="decimal" placeholder="e.g. 500" style={INPUT} />
      </div>

      {mode === 'kelly' ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div>
              <label style={LABEL}>Odds</label>
              <input readOnly value={odds} style={{ ...INPUT, opacity: 0.75 }} />
            </div>
            <div>
              <label style={LABEL}>Your Win Probability (%)</label>
              <input value={probability} onChange={e => setProbability(e.target.value)} inputMode="decimal" placeholder="e.g. 55" style={INPUT} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={LABEL}>Kelly Fraction</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {([1, 0.5, 0.25] as const).map(f => (
                <button key={f} type="button" onClick={() => setKellyFraction(f)} style={{
                  background: kellyFraction === f ? 'var(--accent)' : 'transparent',
                  border: `1px solid ${kellyFraction === f ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 6, color: kellyFraction === f ? 'var(--accent-contrast)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, padding: '4px 9px', cursor: 'pointer',
                }}>
                  {f === 1 ? 'Full' : f === 0.5 ? 'Half' : 'Quarter'}
                </button>
              ))}
            </div>
          </div>
          <p style={{ fontSize: 10.5, color: 'var(--text-faint)', marginBottom: 10 }}>
            Fractional Kelly reduces variance versus full Kelly — most bettors use half or quarter. This assumes your
            probability estimate is accurate; a bad estimate produces a bad stake.
          </p>
        </>
      ) : (
        <div style={{ marginBottom: 10 }}>
          <label style={LABEL}>Percent of Bankroll</label>
          <input value={flatPct} onChange={e => setFlatPct(e.target.value)} inputMode="decimal" placeholder="e.g. 2" style={INPUT} />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border-soft)' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.05em' }}>SUGGESTED STAKE</div>
          <div className="tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: suggested > 0 ? 'var(--accent)' : 'var(--text-faint)' }}>
            {CURRENCY_SYMBOL}{suggested.toFixed(2)}
          </div>
        </div>
        <button
          type="button"
          disabled={suggested <= 0}
          onClick={() => onApply(suggested.toFixed(2))}
          style={{
            background: 'var(--accent)', border: 'none', borderRadius: 8,
            color: 'var(--accent-contrast)', fontSize: 12.5, fontWeight: 700, padding: '8px 14px',
            cursor: suggested > 0 ? 'pointer' : 'not-allowed', opacity: suggested > 0 ? 1 : 0.4,
          }}
        >
          Use This Stake
        </button>
      </div>
      {mode === 'kelly' && oddsNum > 1 && suggested === 0 && (parseFloat(probability) || 0) > 0 && (
        <p style={{ fontSize: 10.5, color: 'var(--lost)', marginTop: 8 }}>
          Negative edge at this probability/odds combination — Kelly says stake nothing.
        </p>
      )}
    </div>
  );
}
