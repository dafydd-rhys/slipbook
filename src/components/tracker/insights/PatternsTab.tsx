'use client';

// Streaks, drawdown, a staking-pattern (chasing losses) check, and day/time-of-day breakdowns.
import { Bet } from '@/lib/types';
import {
  computeStreaks, computeDrawdown, stakingPatternCheck, dayOfWeekBreakdown, timeOfDayBreakdown,
  computeBoostValue, cashOutAnalysis, legVsBetDivergence, clvAnalysis,
} from '@/lib/stats';
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

// Row of stat tiles: boost value added, cash-out vs. running it, and how
// often winning legs still ended up in a lost acca. Each tile only shows once
// there's enough relevant data to say something meaningful.
function ValueInsightsRow({ bets }: { bets: Bet[] }) {
  const boost = computeBoostValue(bets);
  const cashOut = cashOutAnalysis(bets);
  const divergence = legVsBetDivergence(bets);
  const clv = clvAnalysis(bets);

  if (boost.boostedWonBets === 0 && cashOut.comparable === 0 && divergence.bets === 0 && clv.comparable === 0) {
    return null;
  }

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
      {boost.boostedWonBets > 0 && (
        <StatCard
          label="BOOST VALUE ADDED"
          value={`${boost.extraUnits >= 0 ? '+' : ''}${boost.extraUnits.toFixed(2)}u`}
          sub={`over ${boost.boostedWonBets} boosted win${boost.boostedWonBets !== 1 ? 's' : ''}`}
          color={boost.extraUnits >= 0 ? 'var(--won)' : 'var(--lost)'}
        />
      )}
      {cashOut.comparable > 0 && (
        <StatCard
          label="CASH-OUT VS. RUNNING IT"
          value={`${cashOut.diffUnits >= 0 ? '+' : ''}${cashOut.diffUnits.toFixed(2)}u`}
          sub={cashOut.excluded > 0
            ? `${cashOut.comparable} compared, ${cashOut.excluded} excluded (legs still pending)`
            : `over ${cashOut.comparable} cash-out${cashOut.comparable !== 1 ? 's' : ''}`}
          color={cashOut.diffUnits >= 0 ? 'var(--won)' : 'var(--lost)'}
        />
      )}
      {divergence.bets > 0 && (
        <StatCard
          label="LEG WIN RATE"
          value={`${divergence.legWinRate.toFixed(0)}%`}
          sub={`vs. ${divergence.betWinRate.toFixed(0)}% bet win rate over ${divergence.bets} multi-leg bets`}
        />
      )}
      {clv.comparable > 0 && (
        <StatCard
          label="CLOSING LINE VALUE"
          value={`${clv.avgClvPct >= 0 ? '+' : ''}${clv.avgClvPct.toFixed(1)}%`}
          sub={`beat the close on ${clv.beatClosingRate.toFixed(0)}% of ${clv.comparable} Match Winner legs (vs. best UK closing price)`}
          color={clv.avgClvPct >= 0 ? 'var(--won)' : 'var(--lost)'}
        />
      )}
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
      <ValueInsightsRow bets={bets} />
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
