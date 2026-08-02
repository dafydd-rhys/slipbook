'use client';

// Progress bar toward the admin-set goal, shown on Insights while a goal is active.
import { useEffect, useState } from 'react';
import { Bet, Goal } from '@/lib/types';
import { toUnits } from '@/lib/units';

export default function GoalProgress({ bets }: { bets: Bet[] }) {
  const [goal, setGoal] = useState<Goal | null>(null);

  useEffect(() => {
    fetch('/api/goal').then((response) => response.ok ? response.json() : null).then(setGoal).catch(() => {});
  }, []);

  if (!goal) {
    return null;
  }

  const start = new Date(goal.startDate);
  const deadline = new Date(goal.deadline);
  const now = new Date();

  const progressUnits = toUnits(
    bets
      .filter((bet) => bet.result !== 'pending' && new Date(bet.date) >= start)
      .reduce((sum, bet) => sum + ((bet.returns ?? 0) - bet.stake), 0)
  );

  const pct = goal.targetUnits !== 0 ? Math.max(0, Math.min(100, (progressUnits / goal.targetUnits) * 100)) : 0;
  const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
  const overdue = now > deadline && pct < 100;
  const achieved = pct >= 100;

  const barColor = achieved ? 'var(--won)' : overdue ? 'var(--lost)' : 'var(--accent)';

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.06em' }}>
          GOAL{goal.note ? ` — ${goal.note}` : ''}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 700, color: overdue ? 'var(--lost)' : 'var(--text-faint)' }}>
          {achieved ? 'ACHIEVED' : overdue ? 'PAST DEADLINE' : `${daysLeft}d LEFT`}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
        <span className="tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
          {progressUnits >= 0 ? '+' : ''}{progressUnits.toFixed(2)}u
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
          of {goal.targetUnits >= 0 ? '+' : ''}{goal.targetUnits.toFixed(2)}u by {deadline.toLocaleDateString('en-GB')}
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: 'var(--border-soft)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 4, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}
