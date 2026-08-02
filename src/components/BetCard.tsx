'use client';

import { useRef, useState } from 'react';
import { Bet, BetLeg, BetResult, SportType, OddsFormat } from '@/lib/types';
import { formatOdds } from '@/lib/odds';
import { formatUnits } from '@/lib/units';

function ShareButton({ targetRef, bet }: { targetRef: React.RefObject<HTMLDivElement | null>; bet: Bet }) {
  const [busy, setBusy] = useState(false);

  async function handleShare() {
    if (!targetRef.current || busy) return;
    setBusy(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(targetRef.current, { pixelRatio: 2 });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${bet.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-slip.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Failed to export bet image', err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={busy}
      aria-label="Download this bet as an image"
      title="Download as image"
      style={{
        width: 24, height: 24, borderRadius: 6, flexShrink: 0,
        background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-faint)',
        cursor: busy ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-faint)'; }}
    >
      <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
        <path d="M8 1.5v8.5M8 10 5 7M8 10l3-3M2.5 12v1.5A1 1 0 0 0 3.5 14.5h9a1 1 0 0 0 1-1V12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

const SPORT_CODES: Record<SportType, string> = {
  football: 'FB', tennis: 'TN', basketball: 'BK', esports: 'ES',
  cricket: 'CR', horse_racing: 'HR', golf: 'GL', rugby: 'RG',
  boxing: 'BX', mma: 'MM', darts: 'DA', baseball: 'BB', other: 'OT',
};

function SportBadge({ sport }: { sport?: SportType }) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.01em',
      width: 32, height: 32, borderRadius: 8, flexShrink: 0, marginTop: 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)',
    }}>
      {sport ? SPORT_CODES[sport] : 'OT'}
    </span>
  );
}

function ResultChip({ result }: { result: BetResult }) {
  const cfg: Record<BetResult, { color: string; soft: string; label: string }> = {
    won:     { color: 'var(--won)', soft: 'var(--won-soft)', label: 'WON' },
    lost:    { color: 'var(--lost)', soft: 'var(--lost-soft)', label: 'LOST' },
    void:    { color: 'var(--void)', soft: 'var(--void-soft)', label: 'VOID' },
    pending: { color: 'var(--pending)', soft: 'var(--pending-soft)', label: 'PENDING' },
  };
  const s = cfg[result];
  return (
    <span style={{
      background: s.soft, color: s.color,
      border: `1px solid color-mix(in srgb, ${s.color} 45%, transparent)`,
      borderRadius: 5, fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
      letterSpacing: '0.06em', padding: '2px 7px', whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}

function LegDot({ result }: { result: BetResult }) {
  const base: React.CSSProperties = {
    width: 16, height: 16, borderRadius: 4,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, fontSize: 9, fontWeight: 700,
  };
  if (result === 'won') return (
    <span style={{ ...base, background: 'var(--won-soft)', border: '1.5px solid var(--won)', color: 'var(--won)' }}>✓</span>
  );
  if (result === 'lost') return (
    <span style={{ ...base, background: 'var(--lost-soft)', border: '1.5px solid var(--lost)', color: 'var(--lost)' }}>✗</span>
  );
  if (result === 'pending') return (
    <span className="animate-pulse-dot" style={{ ...base, background: 'var(--pending-soft)', border: '1.5px solid var(--pending)' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--pending)', display: 'block' }} />
    </span>
  );
  return (
    <span style={{ ...base, background: 'var(--void-soft)', border: '1.5px solid var(--void)', color: 'var(--void)' }}>–</span>
  );
}

function ScoreRow({ leg }: { leg: BetLeg }) {
  // Try new outcome data first, fall back to legacy flat fields
  const outcome = leg.outcome;
  const sport = leg.sport;

  if (!leg.outcomeDecided && !leg.score) return null;

  // Build display string
  let label = '';
  let scoreText = '';

  if (outcome) {
    if (outcome.useText && outcome.resultText) {
      label = 'RESULT';
      scoreText = outcome.resultText;
    } else if (sport === 'tennis' || sport === 'darts') {
      label = 'SETS';
      scoreText = outcome.sets ?? '';
    } else if (sport === 'horse_racing') {
      label = 'RESULT';
      scoreText = outcome.finishPosition ?? '';
    } else if (sport === 'golf') {
      label = 'SCORE';
      scoreText = outcome.scoreToPar ?? '';
    } else if (outcome.homeScore != null && outcome.awayScore != null) {
      label = outcome.matchStatus ?? 'FT';
      scoreText = `${outcome.homeScore} - ${outcome.awayScore}`;
      if (outcome.matchStatus === 'Pens' && outcome.penaltyHomeScore != null && outcome.penaltyAwayScore != null) {
        scoreText += ` (${outcome.penaltyHomeScore}-${outcome.penaltyAwayScore} pens)`;
      }
    } else if (outcome.resultText) {
      label = 'RESULT';
      scoreText = outcome.resultText;
    }
  } else if (leg.score && leg.homeTeam && leg.awayTeam) {
    // legacy
    label = 'FT';
    scoreText = `${leg.homeTeam} ${leg.score} ${leg.awayTeam}`;
  } else if (leg.score) {
    label = 'FT';
    scoreText = leg.score;
  }

  if (!scoreText) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '5px 14px',
      background: 'var(--bg)',
      borderTop: '1px solid var(--border-soft)', borderBottom: '1px solid var(--border-soft)',
    }}>
      <span style={{
        background: 'var(--surface-2)', color: 'var(--text-faint)', borderRadius: 4,
        fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, padding: '1px 5px', letterSpacing: '0.06em', flexShrink: 0,
      }}>
        {label.toUpperCase()}
      </span>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{scoreText}</span>
    </div>
  );
}

function OddsDisplay({ odds, baseOdds, isBoosted, fmt }: { odds: number; baseOdds?: number; isBoosted?: boolean; fmt: OddsFormat }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      {isBoosted && baseOdds && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)', textDecoration: 'line-through' }}>
          {formatOdds(baseOdds, fmt)}
        </span>
      )}
      <span className="tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: isBoosted ? 'var(--accent-strong)' : 'var(--accent)' }}>
        @ {formatOdds(odds, fmt)}
      </span>
    </div>
  );
}

function LegRow({ leg, fmt }: { leg: BetLeg; fmt: OddsFormat }) {
  return (
    <>
      <ScoreRow leg={leg} />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '10px 14px' }}>
        <SportBadge sport={leg.sport} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 1 }}>{leg.selection}</div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {leg.market}{leg.matchup ? ` — ${leg.matchup}` : ''}
          </div>
          {/* Bet builder sub-legs */}
          {leg.isBetBuilder && leg.subLegs && leg.subLegs.length > 0 && (
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {leg.subLegs.map(sl => (
                <div key={sl.id} style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 9, borderLeft: '2px solid var(--border)' }}>
                  <span style={{ fontSize: 10.5, color: 'var(--text-muted)', flex: 1 }}>{sl.selection} — {sl.market}</span>
                  <ResultChip result={sl.result} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
          <OddsDisplay odds={leg.odds} baseOdds={leg.baseOdds} isBoosted={leg.isBoosted} fmt={fmt} />
          <ResultChip result={leg.result} />
        </div>
      </div>
    </>
  );
}

interface Props {
  bet: Bet;
  fmt: OddsFormat;
  shareable?: boolean;
}

export default function BetCard({ bet, fmt, shareable = true }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const pnl = (bet.returns ?? 0) - bet.stake;
  const isPos = pnl > 0;

  const cardBorder =
    bet.result === 'won'  ? '1px solid color-mix(in srgb, var(--won) 30%, var(--border))' :
    bet.result === 'lost' ? '1px solid color-mix(in srgb, var(--lost) 22%, var(--border))' :
                            '1px solid var(--border)';

  return (
    <div ref={cardRef} style={{ background: 'var(--surface)', border: cardBorder, borderRadius: 14, overflow: 'hidden', marginBottom: 12, boxShadow: 'var(--shadow)' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 14px 10px', borderBottom: '1px solid var(--border-soft)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {bet.legs.map(l => <LegDot key={l.id} result={l.result} />)}
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bet.title}</div>
            {(bet.bookmaker || (bet.tags && bet.tags.length > 0)) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2, flexWrap: 'wrap' }}>
                {bet.bookmaker && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-faint)' }}>{bet.bookmaker}</span>
                )}
                {bet.tags?.map(tag => (
                  <span key={tag} style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)',
                    background: 'var(--accent-soft)', borderRadius: 4, padding: '1px 5px',
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
          {shareable && <ShareButton targetRef={cardRef} bet={bet} />}
          {bet.isBoosted && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
              color: 'var(--accent-contrast)', background: 'var(--accent)', borderRadius: 5, padding: '2px 6px',
            }}>
              BOOST
            </span>
          )}
          {bet.isBoosted && bet.baseTotalOdds && (
            <span className="tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-faint)', textDecoration: 'line-through', whiteSpace: 'nowrap' }}>
              @ {formatOdds(bet.baseTotalOdds, fmt)}
            </span>
          )}
          <span className="tabular" style={{
            background: 'var(--accent-soft)',
            border: '1px solid var(--accent)',
            color: 'var(--accent)',
            fontFamily: 'var(--font-mono)',
            borderRadius: 8, fontSize: 13.5, fontWeight: 600, padding: '4px 10px', whiteSpace: 'nowrap',
          }}>
            @ {formatOdds(bet.totalOdds, fmt)}
          </span>
        </div>
      </div>

      {/* Legs */}
      {bet.legs.map((leg, i) => (
        <div key={leg.id} style={{ borderTop: i > 0 ? '1px solid var(--border-soft)' : undefined }}>
          <LegRow leg={leg} fmt={fmt} />
        </div>
      ))}

      <div className="perforation" />

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px 12px', background: 'var(--surface-2)',
      }}>
        <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>
          Stake <strong className="tabular" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatUnits(bet.stake)}</strong>
        </span>
        {bet.result !== 'pending' ? (
          <span className="tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 600, color: isPos ? 'var(--won)' : 'var(--lost)' }}>
            {isPos ? '+' : ''}{formatUnits(pnl)}
            {bet.returns ? (
              <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>
                {' '}({formatUnits(bet.returns)} ret.{bet.cashedOut ? ' — cashed out' : ''})
              </span>
            ) : null}
          </span>
        ) : (
          <span className="tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--pending)', fontWeight: 500 }}>
            Pot. {formatUnits(bet.stake * bet.totalOdds)}
          </span>
        )}
      </div>
    </div>
  );
}
