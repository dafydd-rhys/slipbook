'use client';

import { Bet, BetLeg, BetResult, SportType, OddsFormat } from '@/lib/types';
import { formatOdds } from '@/lib/odds';

function sportEmoji(sport?: SportType): string {
  const map: Record<SportType, string> = {
    football: '⚽', tennis: '🎾', basketball: '🏀', esports: '🎮',
    cricket: '🏏', horse_racing: '🏇', golf: '⛳', rugby: '🏉',
    boxing: '🥊', mma: '🥋', other: '🎯',
  };
  return sport ? map[sport] : '🎯';
}

function ResultBadge({ result }: { result: BetResult }) {
  const cfg: Record<BetResult, { bg: string; color: string; label: string }> = {
    won:     { bg: 'rgba(16,185,129,0.12)', color: '#10b981', label: 'WON' },
    lost:    { bg: 'rgba(239,68,68,0.10)',  color: '#ef4444', label: 'LOST' },
    void:    { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', label: 'VOID' },
    pending: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'PENDING' },
  };
  const s = cfg[result];
  return (
    <span style={{
      background: s.bg, color: s.color,
      border: `1px solid ${s.color}35`,
      borderRadius: 5, fontSize: 10, fontWeight: 800,
      letterSpacing: '0.07em', padding: '2px 7px', whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}

function LegDot({ result }: { result: BetResult }) {
  const base: React.CSSProperties = {
    width: 20, height: 20, borderRadius: '50%',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  };
  if (result === 'won') return (
    <span style={{ ...base, background: 'rgba(16,185,129,0.15)', border: '1.5px solid #10b981', fontSize: 10, color: '#10b981' }}>✓</span>
  );
  if (result === 'lost') return (
    <span style={{ ...base, background: 'rgba(239,68,68,0.12)', border: '1.5px solid #ef4444', fontSize: 10, color: '#ef4444' }}>✗</span>
  );
  if (result === 'pending') return (
    <span className="animate-pulse-dot" style={{ ...base, background: 'rgba(245,158,11,0.12)', border: '1.5px solid #f59e0b' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'block' }} />
    </span>
  );
  return (
    <span style={{ ...base, background: 'rgba(100,116,139,0.12)', border: '1.5px solid #475569', fontSize: 10, color: '#475569' }}>–</span>
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
    if (sport === 'tennis') {
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
      background: '#0d0d20',
      borderTop: '1px solid #1a1a38', borderBottom: '1px solid #1a1a38',
    }}>
      <span style={{
        background: '#1a1a38', color: '#475569', borderRadius: 4,
        fontSize: 9, fontWeight: 800, padding: '1px 5px', letterSpacing: '0.06em', flexShrink: 0,
      }}>
        {label.toUpperCase()}
      </span>
      <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{scoreText}</span>
    </div>
  );
}

function OddsDisplay({ odds, baseOdds, isBoosted, fmt }: { odds: number; baseOdds?: number; isBoosted?: boolean; fmt: OddsFormat }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {isBoosted && baseOdds && (
          <span style={{ fontSize: 10, color: '#475569', textDecoration: 'line-through' }}>
            {formatOdds(baseOdds, fmt)}
          </span>
        )}
        <span style={{ fontSize: 13, fontWeight: 700, color: isBoosted ? '#a78bfa' : '#8b5cf6' }}>
          @ {formatOdds(odds, fmt)}
        </span>
        {isBoosted && <span style={{ fontSize: 10 }}>🚀</span>}
      </div>
    </div>
  );
}

function LegRow({ leg, fmt }: { leg: BetLeg; fmt: OddsFormat }) {
  return (
    <>
      <ScoreRow leg={leg} />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px' }}>
        <span style={{
          width: 34, height: 34, borderRadius: '50%',
          background: '#1a1a38', border: '1px solid #2a2a52',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0, marginTop: 1,
        }}>
          {sportEmoji(leg.sport)}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 1 }}>{leg.selection}</div>
          <div style={{ fontSize: 11, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {leg.market}{leg.matchup ? ` — ${leg.matchup}` : ''}
          </div>
          {/* Bet builder sub-legs */}
          {leg.isBetBuilder && leg.subLegs && leg.subLegs.length > 0 && (
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {leg.subLegs.map(sl => (
                <div key={sl.id} style={{ display: 'flex', alignItems: 'center', gap: 5, paddingLeft: 8, borderLeft: '2px solid #2a2a52' }}>
                  <span style={{ fontSize: 10, color: '#64748b', flex: 1 }}>{sl.selection} — {sl.market}</span>
                  <ResultBadge result={sl.result} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <OddsDisplay odds={leg.odds} baseOdds={leg.baseOdds} isBoosted={leg.isBoosted} fmt={fmt} />
          <ResultBadge result={leg.result} />
        </div>
      </div>
    </>
  );
}

interface Props {
  bet: Bet;
  fmt: OddsFormat;
}

export default function BetCard({ bet, fmt }: Props) {
  const pnl = (bet.returns ?? 0) - bet.stake;
  const isPos = pnl > 0;

  const cardBorder =
    bet.result === 'won'  ? '1px solid rgba(16,185,129,0.2)' :
    bet.result === 'lost' ? '1px solid rgba(239,68,68,0.12)' :
                            '1px solid #1a1a38';

  return (
    <div style={{ background: '#16162e', border: cardBorder, borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 14px 10px', borderBottom: '1px solid #1a1a38',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {bet.legs.map(l => <LegDot key={l.id} result={l.result} />)}
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{bet.title}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {bet.isBoosted && bet.baseTotalOdds && (
            <span style={{ fontSize: 11, color: '#475569', textDecoration: 'line-through', whiteSpace: 'nowrap' }}>
              @ {formatOdds(bet.baseTotalOdds, fmt)}
            </span>
          )}
          <span style={{
            background: bet.result === 'won' ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.12)',
            border: `1px solid ${bet.result === 'won' ? '#10b981' : '#6d28d9'}`,
            color: bet.result === 'won' ? '#10b981' : '#a78bfa',
            borderRadius: 8, fontSize: 13, fontWeight: 700, padding: '3px 10px', whiteSpace: 'nowrap',
          }}>
            {bet.isBoosted && <span style={{ marginRight: 3 }}>🚀</span>}
            @ {formatOdds(bet.totalOdds, fmt)}
          </span>
        </div>
      </div>

      {/* Legs */}
      {bet.legs.map((leg, i) => (
        <div key={leg.id} style={{ borderTop: i > 0 ? '1px solid #141428' : undefined }}>
          <LegRow leg={leg} fmt={fmt} />
        </div>
      ))}

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 14px', background: '#0f0f22', borderTop: '1px solid #1a1a38',
      }}>
        <span style={{ fontSize: 11, color: '#475569' }}>
          Stake <strong style={{ color: '#64748b' }}>£{bet.stake.toFixed(2)}</strong>
        </span>
        {bet.result !== 'pending' ? (
          <span style={{ fontSize: 11, fontWeight: 700, color: isPos ? '#10b981' : '#ef4444' }}>
            {isPos ? '+' : ''}£{pnl.toFixed(2)}
            {bet.returns ? (
              <span style={{ color: '#475569', fontWeight: 400 }}> (£{bet.returns.toFixed(2)} ret.)</span>
            ) : null}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>
            Pot. £{(bet.stake * bet.totalOdds).toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}
