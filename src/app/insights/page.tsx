'use client';

import { useEffect, useState } from 'react';
import { Bet } from '@/lib/types';
import CalendarView from '@/components/CalendarView';
import BreakdownTable from '@/components/BreakdownTable';
import GoalProgress from '@/components/GoalProgress';
import OnThisDay from '@/components/OnThisDay';
import PnlChart from '@/components/PnlChart';
import {
  sportBreakdown, betTypeBreakdown, bookmakerBreakdown, marketBreakdown, oddsRangeBreakdown,
  dayOfWeekBreakdown, timeOfDayBreakdown, computeStreaks, computeDrawdown, stakingPatternCheck,
  correlationBreakdown, CorrelationDimension,
} from '@/lib/stats';

const CONTENT_WIDTH = 720;

interface StoredSummary { text: string; period: string; generatedAt: string }

const TABS = ['Calendar', 'Breakdowns', 'Patterns'] as const;
type Tab = typeof TABS[number];

const DIMENSIONS = ['Sport', 'Bet Type', 'Bookmaker', 'Market', 'Odds Range'] as const;
type Dimension = typeof DIMENSIONS[number];

const CORRELATION_PAIRS: { label: string; a: CorrelationDimension; b: CorrelationDimension }[] = [
  { label: 'Sport × Bookmaker', a: 'sport', b: 'bookmaker' },
  { label: 'Sport × Tag', a: 'sport', b: 'tag' },
  { label: 'Bookmaker × Tag', a: 'bookmaker', b: 'tag' },
];

function TabBar<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="no-scrollbar" style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 18 }}>
      {options.map(opt => {
        const active = opt === value;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: active ? 700 : 600,
              letterSpacing: '0.03em', padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
              background: active ? 'var(--accent)' : 'transparent',
              border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
              color: active ? 'var(--accent-contrast)' : 'var(--text-muted)',
            }}
          >
            {opt.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ flex: '1 1 140px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '13px 14px' }}>
      <div className="tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: 17, fontWeight: 600, color: color ?? 'var(--text)' }}>{value}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.06em', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function InsightsPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<StoredSummary | null>(null);
  const [tab, setTab] = useState<Tab>('Calendar');
  const [dim, setDim] = useState<Dimension>('Sport');
  const [showCorrelations, setShowCorrelations] = useState(false);
  const [pairIdx, setPairIdx] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch('/api/bets').then(r => r.json()),
      fetch('/api/admin/summary').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([b, s]) => { setBets(b); setSummary(s); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const dimensionRows = () => {
    switch (dim) {
      case 'Sport': return { rows: sportBreakdown(bets), showMoney: true };
      case 'Bet Type': return { rows: betTypeBreakdown(bets), showMoney: true };
      case 'Bookmaker': return { rows: bookmakerBreakdown(bets), showMoney: true };
      case 'Market': return { rows: marketBreakdown(bets), showMoney: false };
      case 'Odds Range': return { rows: oddsRangeBreakdown(bets), showMoney: true };
    }
  };

  const streaks = computeStreaks(bets);
  const drawdown = computeDrawdown(bets);
  const staking = stakingPatternCheck(bets);
  const pair = CORRELATION_PAIRS[pairIdx];
  const correlationRows = correlationBreakdown(bets, pair.a, pair.b);

  return (
    <div className="rise-in" style={{ maxWidth: CONTENT_WIDTH, margin: '0 auto', padding: '24px 20px 56px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
        Insights
      </h1>
      <p style={{ fontSize: 13, color: 'var(--text-faint)', marginBottom: 18, maxWidth: '60ch' }}>
        Performance broken down by sport, market, bet type, bookmaker, odds range, and behavioral patterns.
      </p>

      {summary && (
        <div style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.06em', marginBottom: 6 }}>
            AI SUMMARY — {summary.period.toUpperCase()}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55 }}>{summary.text}</p>
          <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 8 }}>
            Generated {new Date(summary.generatedAt).toLocaleDateString('en-GB')} — regenerate from Admin
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <span aria-hidden style={{
            display: 'inline-block', width: 30, height: 30, borderRadius: '50%',
            border: '3px solid var(--border)', borderTopColor: 'var(--accent)',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      ) : bets.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '40px 0', fontSize: 14 }}>No bets yet.</p>
      ) : (
        <>
          <GoalProgress bets={bets} />
          <OnThisDay bets={bets} />

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 12px 8px', marginBottom: 20 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.06em', padding: '0 4px 12px' }}>
              CUMULATIVE P&amp;L
            </p>
            <PnlChart bets={bets} />
          </div>

          <TabBar options={TABS} value={tab} onChange={setTab} />

          {tab === 'Calendar' && <CalendarView bets={bets} />}

          {tab === 'Breakdowns' && (
            <div className="fade-in">
              <TabBar options={DIMENSIONS} value={dim} onChange={setDim} />
              <BreakdownTable {...dimensionRows()} />

              <button
                onClick={() => setShowCorrelations(s => !s)}
                style={{
                  marginTop: 20, marginBottom: showCorrelations ? 10 : 0,
                  background: 'transparent', border: '1px solid var(--border)', borderRadius: 20,
                  color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                  padding: '6px 14px', cursor: 'pointer',
                }}
              >
                {showCorrelations ? '− Hide correlations' : '+ Show correlations (tag × sport, etc.)'}
              </button>

              {showCorrelations && (
                <div className="fade-in">
                  <TabBar
                    options={CORRELATION_PAIRS.map(p => p.label)}
                    value={pair.label}
                    onChange={label => setPairIdx(CORRELATION_PAIRS.findIndex(p => p.label === label))}
                  />
                  <p style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 8 }}>
                    Combinations with at least 3 bets, sorted by units — spots patterns a single-dimension breakdown can hide.
                  </p>
                  <BreakdownTable rows={correlationRows} />
                </div>
              )}
            </div>
          )}

          {tab === 'Patterns' && (
            <div className="fade-in">
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

              <div style={{ marginBottom: 10 }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 8 }}>BY DAY OF WEEK</p>
                <BreakdownTable rows={dayOfWeekBreakdown(bets)} />
              </div>

              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 8, marginTop: 20 }}>BY TIME OF DAY</p>
                <BreakdownTable rows={timeOfDayBreakdown(bets)} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
