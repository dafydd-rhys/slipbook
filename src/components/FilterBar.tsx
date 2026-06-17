'use client';

import { useRef, useState, useEffect } from 'react';
import { Bet, BetStats, FilterType } from '@/lib/types';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'today',        label: 'Today' },
  { key: 'week',         label: 'This Week' },
  { key: 'month',        label: 'This Month' },
  { key: 'year',         label: 'This Year' },
  { key: 'all',          label: 'All Time' },
  { key: 'biggest_win',  label: '💰 Biggest Win' },
  { key: 'biggest_lose', label: '💸 Biggest Lose' },
  { key: 'best_odds_win',label: '🎯 Best Odds' },
];

export function applyFilter(bets: Bet[], filter: FilterType): Bet[] {
  const now = new Date();
  const sod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sow = new Date(sod); sow.setDate(sod.getDate() - ((sod.getDay() + 6) % 7));
  const som = new Date(now.getFullYear(), now.getMonth(), 1);
  const soy = new Date(now.getFullYear(), 0, 1);

  let out = [...bets];
  switch (filter) {
    case 'today':        out = out.filter(b => new Date(b.date) >= sod); out.sort((a,b) => +new Date(b.date) - +new Date(a.date)); break;
    case 'week':         out = out.filter(b => new Date(b.date) >= sow); out.sort((a,b) => +new Date(b.date) - +new Date(a.date)); break;
    case 'month':        out = out.filter(b => new Date(b.date) >= som); out.sort((a,b) => +new Date(b.date) - +new Date(a.date)); break;
    case 'year':         out = out.filter(b => new Date(b.date) >= soy); out.sort((a,b) => +new Date(b.date) - +new Date(a.date)); break;
    case 'all':          out.sort((a,b) => +new Date(b.date) - +new Date(a.date)); break;
    case 'biggest_win':  out = out.filter(b => b.result === 'won' && b.returns != null); out.sort((a,b) => (b.returns ?? 0) - (a.returns ?? 0)); break;
    case 'biggest_lose': out = out.filter(b => b.result === 'lost'); out.sort((a,b) => b.stake - a.stake); break;
    case 'best_odds_win':out = out.filter(b => b.result === 'won'); out.sort((a,b) => b.totalOdds - a.totalOdds); break;
  }
  return out;
}

export function computeStats(bets: Bet[]): BetStats {
  const settled = bets.filter(b => b.result !== 'pending');
  const won      = settled.filter(b => b.result === 'won').length;
  const lost     = settled.filter(b => b.result === 'lost').length;
  const pending  = bets.filter(b => b.result === 'pending').length;
  const totalStaked  = settled.reduce((s, b) => s + b.stake, 0);
  const totalReturns = settled.reduce((s, b) => s + (b.returns ?? 0), 0);
  const pnl      = totalReturns - totalStaked;
  const roi      = totalStaked > 0 ? (pnl / totalStaked) * 100 : 0;
  const winRate  = settled.length > 0 ? (won / settled.length) * 100 : 0;
  const avgStake = settled.length > 0 ? totalStaked / settled.length : 1;
  const units    = avgStake > 0 ? pnl / avgStake : 0;
  return { totalBets: bets.length, won, lost, pending, totalStaked, totalReturns, pnl, roi, winRate, units };
}

interface Props {
  active: FilterType;
  onChange: (f: FilterType) => void;
  stats: BetStats;
}

export default function FilterBar({ active, onChange, stats }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(true);
  const pnlPos   = stats.pnl >= 0;
  const unitsPos = stats.units >= 0;

  function checkArrows() {
    const el = scrollRef.current;
    if (!el) return;
    setCanL(el.scrollLeft > 4);
    setCanR(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkArrows();
    el.addEventListener('scroll', checkArrows, { passive: true });
    const ro = new ResizeObserver(checkArrows);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', checkArrows); ro.disconnect(); };
  }, []);

  function scroll(dir: 'left' | 'right') {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -160 : 160, behavior: 'smooth' });
  }

  const arrow = (dir: 'left' | 'right', can: boolean) => (
    <button
      onClick={() => scroll(dir)}
      aria-label={`Scroll ${dir}`}
      style={{
        flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
        border: `1px solid ${can ? '#2a2a52' : '#141428'}`,
        background: 'transparent',
        color: can ? '#475569' : '#1e1e3e',
        fontSize: 14, cursor: can ? 'pointer' : 'default',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s', pointerEvents: can ? 'auto' : 'none',
        lineHeight: 1,
      }}
    >
      {dir === 'left' ? '‹' : '›'}
    </button>
  );

  const statItems = [
    { label: 'BETS',   value: String(stats.totalBets),                              color: '#94a3b8' },
    { label: 'WON',    value: String(stats.won),                                    color: '#10b981' },
    { label: 'LOST',   value: String(stats.lost),                                   color: '#ef4444' },
    { label: 'WIN %',  value: `${stats.winRate.toFixed(0)}%`,                       color: stats.winRate >= 50 ? '#10b981' : '#ef4444' },
    { label: 'P&L',    value: `${pnlPos ? '+' : ''}£${stats.pnl.toFixed(2)}`,      color: pnlPos   ? '#10b981' : '#ef4444' },
    { label: 'UNITS',  value: `${unitsPos ? '+' : ''}${stats.units.toFixed(2)}u`,   color: unitsPos ? '#10b981' : '#ef4444' },
    { label: 'ROI',    value: `${pnlPos ? '+' : ''}${stats.roi.toFixed(1)}%`,       color: pnlPos   ? '#10b981' : '#ef4444' },
  ];

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px' }}>

      {/* ── Filter pills ── */}
      <div style={{ paddingTop: 16, paddingBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
        {arrow('left', canL)}
        <div ref={scrollRef} className="no-scrollbar" style={{ display: 'flex', gap: 6, overflowX: 'auto', flex: 1 }}>
          {FILTERS.map(f => {
            const isActive = f.key === active;
            return (
              <button
                key={f.key}
                onClick={() => onChange(f.key)}
                style={{
                  flexShrink: 0,
                  background: isActive ? '#7c3aed' : 'transparent',
                  border: `1px solid ${isActive ? '#7c3aed' : '#2a2a52'}`,
                  borderRadius: 20,
                  color: isActive ? '#fff' : '#64748b',
                  fontSize: 12, fontWeight: isActive ? 700 : 400,
                  padding: '5px 14px', cursor: 'pointer',
                  whiteSpace: 'nowrap', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#a78bfa'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#64748b'; }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        {arrow('right', canR)}
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'flex', marginTop: 16, marginBottom: 4, paddingBottom: 16, borderBottom: '1px solid #1a1a38' }}>
        {statItems.map((item, i) => (
          <div
            key={i}
            style={{
              flex: '1 1 0', textAlign: 'center',
              borderRight: i < statItems.length - 1 ? '1px solid #1a1a38' : undefined,
              padding: '0 4px',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: item.color, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              {item.value}
            </div>
            <div style={{ fontSize: 9, color: '#2a2a52', fontWeight: 700, letterSpacing: '0.06em', marginTop: 3 }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
