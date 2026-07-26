'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import BetCard from '@/components/BetCard';
import FilterBar, { applyFilter, computeStats } from '@/components/FilterBar';
import CalendarView from '@/components/CalendarView';
import { Bet, FilterType, OddsFormat } from '@/lib/types';
import { groupByDay } from '@/lib/dates';

const PAGE_SIZE = 10;
const CONTENT_WIDTH = 720;
const FMT_KEY = 'strz_odds_format';

const SELECT_STYLE: React.CSSProperties = {
  background: '#12122a', border: '1px solid #2a2a52', borderRadius: 8,
  color: '#f1f5f9', fontSize: 12, fontWeight: 700, padding: '5px 8px',
  outline: 'none', cursor: 'pointer',
};

const FORMAT_LABELS: Record<OddsFormat, string> = {
  decimal: 'Decimal',
  fraction: 'Fraction',
  us: 'American',
};
const FORMATS: OddsFormat[] = ['decimal', 'fraction', 'us'];

const INFO_SECTIONS = [
  {
    title: 'Odds Formats',
    items: [
      { term: 'Decimal', def: 'Total return per £1 staked including your stake. 2.50 = £2.50 back (£1.50 profit) on a £1 bet.' },
      { term: 'Fraction', def: 'Profit relative to stake. 6/4 means you win £6 for every £4 staked (£10 back on a £4 bet).' },
      { term: 'American', def: '+150 means win £150 on a £100 bet. −150 means you must stake £150 to win £100.' },
    ],
  },
  {
    title: 'Bet Types',
    items: [
      { term: 'Single', def: 'One selection. Wins if your pick is correct.' },
      { term: 'Double / Treble', def: '2 or 3 selections combined. All must win. Odds multiply together.' },
      { term: 'Accumulator (Acca)', def: '4 or more selections combined. All must win. Higher risk, higher reward — one loss voids the whole bet.' },
      { term: 'Bet Builder', def: 'Multiple selections from the same event (e.g. team to win + player to score). Treated as one combined bet.' },
      { term: 'Each Way', def: 'Two bets in one: a win bet and a place bet. The place portion pays if your selection finishes in a top position (usually top 2–4 depending on the event).' },
      { term: 'Outright', def: 'Bet on the overall winner of a tournament, league, or competition before it concludes.' },
      { term: 'System / Lucky 15/31/63', def: 'Combination bets covering all possible doubles, trebles, and accas from your selections. Partial wins still return something.' },
    ],
  },
  {
    title: 'Stats Explained',
    items: [
      { term: 'Picks', def: 'Total number of selections placed in the selected period.' },
      { term: 'Live Picks', def: 'Picks that are still pending — the event hasn\'t concluded yet.' },
      { term: 'Settled Stakes', def: 'Total amount risked across settled picks, shown in units rather than currency.' },
      { term: 'Net Units', def: 'Profit or loss shown in units rather than currency. Flat staking: every selection is advised at 1 unit. We recommend defining 1 unit as 1% of your betting bankroll, so you can scale stakes to your own bankroll size.' },
      { term: 'ROI', def: 'Return on Investment — profit as a percentage of total staked. Positive = profitable overall.' },
      { term: 'Avg Odds', def: 'The average price across your picks in the selected period.' },
    ],
  },
  {
    title: 'Other Concepts',
    items: [
      { term: 'Boosted Odds', def: 'Odds enhanced by the bookmaker above their standard price. Shown with the original odds crossed out beside the boosted price.' },
      { term: 'Pending', def: 'A bet that has been placed but the event has not yet concluded.' },
      { term: 'Void', def: 'A bet that has been cancelled or declared invalid, usually returning your stake.' },
    ],
  },
];

export default function Home() {
  const [allBets, setAllBets] = useState<Bet[]>([]);
  const [filter, setFilter] = useState<FilterType>('last30');
  const [fmt, setFmt] = useState<OddsFormat>('decimal');
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [view, setView] = useState<'day' | 'calendar'>('day');
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/bets')
      .then(r => r.json())
      .then((bets: Bet[]) => { setAllBets(bets); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const storedFmt = localStorage.getItem(FMT_KEY) as OddsFormat | null;
    if (storedFmt) setFmt(storedFmt);
  }, []);

  function handleFmtChange(f: OddsFormat) {
    setFmt(f);
    localStorage.setItem(FMT_KEY, f);
  }

  const handleFilterChange = useCallback((f: FilterType) => {
    setFilter(f);
    setDisplayCount(PAGE_SIZE);
  }, []);

  const filtered = applyFilter(allBets, filter);
  const visible = filtered.slice(0, displayCount);
  const groups = groupByDay(visible);
  const stats = computeStats(filtered);
  const hasMore = displayCount < filtered.length;

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) setDisplayCount(c => c + PAGE_SIZE); },
      { threshold: 0.1 }
    );
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMore, groups.length]);

  return (
    <>
      {/* ── Info modal ── */}
      {showInfo && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(6px)', zIndex: 200,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            padding: '24px 16px', overflowY: 'auto',
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowInfo(false); }}
        >
          <div style={{ width: '100%', maxWidth: 560, paddingBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>Betting Guide</h2>
              <button onClick={() => setShowInfo(false)} style={{
                background: 'transparent', border: '1px solid #2a2a52', borderRadius: 8,
                color: '#475569', fontSize: 13, padding: '4px 10px', cursor: 'pointer',
              }}>✕ Close</button>
            </div>
            {INFO_SECTIONS.map(section => (
              <div key={section.title} style={{
                background: '#16162e', border: '1px solid #1e1e3e',
                borderRadius: 12, padding: 16, marginBottom: 12,
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#6d28d9', letterSpacing: '0.1em', marginBottom: 12 }}>
                  {section.title.toUpperCase()}
                </div>
                {section.items.map((item, i) => (
                  <div key={i} style={{ marginBottom: i < section.items.length - 1 ? 12 : 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>{item.term}</span>
                    <span style={{ fontSize: 13, color: '#64748b' }}> — {item.def}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Odds format toggle + info ── */}
      <div style={{ marginTop: 8, borderBottom: '1px solid #1a1a38' }}>
        <div style={{
          maxWidth: CONTENT_WIDTH, margin: '0 auto', padding: '0 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 36,
        }}>
          {/* Info button */}
          <button
            onClick={() => setShowInfo(true)}
            style={{
              background: 'transparent', border: '1px solid #1e1e3e', borderRadius: 20,
              color: '#334155', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', transition: 'all 0.15s', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#6d28d9'; e.currentTarget.style.color = '#a78bfa'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e3e'; e.currentTarget.style.color = '#334155'; }}
          >
            <svg width="10" height="10" viewBox="0 0 13 13" fill="none">
              <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M6.5 5.5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="6.5" cy="3.75" r="0.65" fill="currentColor"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em' }}>Guide</span>
          </button>

          {/* Odds format dropdown */}
          <select value={fmt} onChange={e => handleFmtChange(e.target.value as OddsFormat)} style={SELECT_STYLE}>
            {FORMATS.map(f => <option key={f} value={f}>{FORMAT_LABELS[f]}</option>)}
          </select>
        </div>
      </div>

      {view === 'calendar' ? (
        <CalendarView bets={allBets} onBack={() => setView('day')} />
      ) : (
        <>
          {/* ── Filters + Stats ── */}
          <FilterBar active={filter} onChange={handleFilterChange} stats={stats} fmt={fmt} />

          {/* ── Live picks badge + Calendar view toggle ── */}
          <div style={{ maxWidth: CONTENT_WIDTH, margin: '0 auto', padding: '10px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {stats.pending > 0 ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 20, color: '#f59e0b', fontSize: 12, fontWeight: 700,
                padding: '5px 14px',
              }}>
                <span className="animate-pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', display: 'block' }} />
                {stats.pending} Live
              </div>
            ) : <span />}

            <button
              onClick={() => setView('calendar')}
              style={{
                background: 'transparent', border: '1px solid #2a2a52', borderRadius: 20,
                color: '#64748b', fontSize: 12, fontWeight: 400, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 14px', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#a78bfa'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; }}
            >
              📅 Calendar View
            </button>
          </div>

          {/* ── Bet list ── */}
          <div style={{ maxWidth: CONTENT_WIDTH, margin: '0 auto', padding: '10px 20px 56px' }}>
            {loading && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#334155' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🎲</div>
                <p style={{ fontSize: 14 }}>Loading slips…</p>
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#334155' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                <p style={{ fontSize: 14 }}>No bets for this filter.</p>
              </div>
            )}

            {groups.map(({ label, bets }, gi) => (
              <div key={label} style={{ marginTop: gi > 0 ? 24 : 0 }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: '#334155',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  paddingBottom: 10, borderBottom: '1px solid #12122a', marginBottom: 12,
                }}>
                  {label}
                </div>
                {bets.map(bet => <BetCard key={bet.id} bet={bet} fmt={fmt} />)}
              </div>
            ))}

            {hasMore && (
              <div ref={sentinelRef} style={{ padding: '20px 0', textAlign: 'center', color: '#334155', fontSize: 13 }}>
                Loading more…
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
