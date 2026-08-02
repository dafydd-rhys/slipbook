'use client';

// Collapsible stake-sizing helper on the Add Bet form — suggests a stake via
// the Kelly Criterion or a flat percentage of a bankroll figure you enter.
import { useState } from 'react';
import { CURRENCY_SYMBOL } from '@/lib/config';
import { LABEL } from './adminPanelStyles';

// Mirrors the shared admin INPUT style but in monospace with tighter padding, used
// only for the compact number fields inside this collapsible helper panel.
const INPUT: React.CSSProperties = {
  background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
  color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 13, padding: '7px 9px', width: '100%', outline: 'none',
};
const BANKROLL_KEY = 'slipbook_stake_sizer_bankroll';

type Mode = 'kelly' | 'flat';
type KellyFraction = 1 | 0.5 | 0.25;

// Kelly Criterion stake: bankroll × edge/net-odds × the chosen fraction (full/half/quarter Kelly).
function kellyStake(bankroll: number, odds: number, winProbabilityPct: number, fraction: KellyFraction): number {
  const netOdds = odds - 1;

  if (netOdds <= 0) {
    return 0;
  }

  const winProb = winProbabilityPct / 100;
  const loseProb = 1 - winProb;
  const kellyEdge = (netOdds * winProb - loseProb) / netOdds;

  return Math.max(0, kellyEdge * fraction * bankroll);
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

  function updateBankroll(value: string) {
    setBankroll(value);

    if (typeof window !== 'undefined') {
      localStorage.setItem(BANKROLL_KEY, value);
    }
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
        {(['kelly', 'flat'] as const).map((modeOption) => (
          <button key={modeOption} type="button" onClick={() => setMode(modeOption)} style={{
            background: mode === modeOption ? 'var(--accent-soft)' : 'transparent',
            border: `1px solid ${mode === modeOption ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 14, color: mode === modeOption ? 'var(--accent)' : 'var(--text-faint)',
            fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, padding: '4px 10px', cursor: 'pointer',
          }}>
            {modeOption === 'kelly' ? 'Kelly Criterion' : 'Flat % of Bankroll'}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={LABEL}>Bankroll ({CURRENCY_SYMBOL})</label>
        <input value={bankroll} onChange={(event) => updateBankroll(event.target.value)} inputMode="decimal" placeholder="e.g. 500" style={INPUT} />
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
              <input value={probability} onChange={(event) => setProbability(event.target.value)} inputMode="decimal" placeholder="e.g. 55" style={INPUT} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={LABEL}>Kelly Fraction</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {([1, 0.5, 0.25] as const).map((fraction) => (
                <button key={fraction} type="button" onClick={() => setKellyFraction(fraction)} style={{
                  background: kellyFraction === fraction ? 'var(--accent)' : 'transparent',
                  border: `1px solid ${kellyFraction === fraction ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 6, color: kellyFraction === fraction ? 'var(--accent-contrast)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, padding: '4px 9px', cursor: 'pointer',
                }}>
                  {fraction === 1 ? 'Full' : fraction === 0.5 ? 'Half' : 'Quarter'}
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
          <input value={flatPct} onChange={(event) => setFlatPct(event.target.value)} inputMode="decimal" placeholder="e.g. 2" style={INPUT} />
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
