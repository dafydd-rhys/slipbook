'use client';

// Streaks, drawdown, a staking-pattern (chasing losses) check, and day/time-of-day breakdowns.
import { Bet } from '@/lib/types';
import { computeStreaks, computeDrawdown, stakingPatternCheck, dayOfWeekBreakdown, timeOfDayBreakdown } from '@/lib/stats';
import BreakdownTable from '../BreakdownTable';
import StatCard from './StatCard';

// Row of stat tiles: current streak, longest win/loss streaks, and drawdown.
function StreakAndDrawdownRow({ bets }: { bets: Bet[] }) {
  const streaks = computeStreaks(bets);
  const drawdown = computeDrawdown(bets);

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
      <StatCard
        label="CURRENT STREAK"
        value={streaks.currentLength ? `${streaks.currentLength} ${streaks.currentType}${streaks.currentLength !== 1 ? 's' : ''}` : '—'}
        color={streaks.currentType === 'won' ? 'var(--won)' : streaks.currentType === 'lost' ? 'var(--lost)' : undefined}
      />
      <StatCard label="LONGEST WIN STREAK" value={String(streaks.longestWin)} color="var(--won)" />
      <StatCard label="LONGEST LOSS STREAK" value={String(streaks.longestLoss)} color="var(--lost)" />
      <StatCard label="MAX DRAWDOWN" value={`${drawdown.maxDrawdownUnits.toFixed(2)}u`} sub={`${drawdown.maxDrawdownPct.toFixed(0)}% off peak`} color="var(--lost)" />
      <StatCard label="CURRENT DRAWDOWN" value={`${drawdown.currentDrawdownUnits.toFixed(2)}u`} color={drawdown.currentDrawdownUnits > 0 ? 'var(--pending)' : 'var(--won)'} />
    </div>
  );
}

// Highlighted note warning if stake sizes suggest chasing losses.
function StakingPatternNotice({ bets }: { bets: Bet[] }) {
  const staking = stakingPatternCheck(bets);

  return (
    <div style={{
      background: staking.chasingSignal ? 'var(--pending-soft)' : 'var(--surface)',
      border: `1px solid ${staking.chasingSignal ? 'color-mix(in srgb, var(--pending) 45%, transparent)' : 'var(--border)'}`,
      borderRadius: 12, padding: '13px 16px', marginBottom: 20, fontSize: 12.5, color: 'var(--text-muted)',
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 700, color: staking.chasingSignal ? 'var(--pending)' : 'var(--text-faint)', letterSpacing: '0.06em', marginBottom: 6 }}>
        STAKING PATTERN
      </div>
      {staking.note}
    </div>
  );
}

// Streaks/drawdown tiles, a staking-pattern notice, and day/time-of-day breakdowns.
export default function PatternsTab({ bets }: { bets: Bet[] }) {
  return (
    <div className="fade-in">
      <StreakAndDrawdownRow bets={bets} />
      <StakingPatternNotice bets={bets} />

      <div style={{ marginBottom: 10 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 8 }}>BY DAY OF WEEK</p>
        <BreakdownTable rows={dayOfWeekBreakdown(bets)} />
      </div>

      <div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 8, marginTop: 20 }}>BY TIME OF DAY</p>
        <BreakdownTable rows={timeOfDayBreakdown(bets)} />
      </div>
    </div>
  );
}
