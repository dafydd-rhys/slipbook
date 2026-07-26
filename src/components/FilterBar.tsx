'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Bet, BetStats, FilterType, OddsFormat } from '@/lib/types';
import { formatOdds } from '@/lib/odds';
import { toUnits } from '@/lib/units';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'last7',  label: 'Last 7 Days' },
  { key: 'last30', label: 'Last 30 Days' },
  { key: 'last90', label: 'Last 90 Days' },
  { key: 'year',   label: '1 Year' },
  { key: 'all',    label: 'All Time' },
];

export function applyFilter(bets: Bet[], filter: FilterType): Bet[] {
  const now = new Date();
  const last7  = new Date(now); last7.setDate(now.getDate() - 7);
  const last30 = new Date(now); last30.setDate(now.getDate() - 30);
  const last90 = new Date(now); last90.setDate(now.getDate() - 90);
  const lastYear = new Date(now); lastYear.setDate(now.getDate() - 365);

  let out = [...bets];
  switch (filter) {
    case 'last7':  out = out.filter(b => new Date(b.date) >= last7); break;
    case 'last30': out = out.filter(b => new Date(b.date) >= last30); break;
    case 'last90': out = out.filter(b => new Date(b.date) >= last90); break;
    case 'year':   out = out.filter(b => new Date(b.date) >= lastYear); break;
    case 'all':    break;
  }
  out.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  return out;
}

export function computeStats(bets: Bet[]): BetStats {
  const settled = bets.filter(b => b.result !== 'pending');
  const pending  = bets.filter(b => b.result === 'pending').length;
  const totalStaked  = settled.reduce((s, b) => s + b.stake, 0);
  const totalReturns = settled.reduce((s, b) => s + (b.returns ?? 0), 0);
  const pnl      = totalReturns - totalStaked;
  const roi      = totalStaked > 0 ? (pnl / totalStaked) * 100 : 0;
  const units    = toUnits(pnl);
  const stakedUnits = toUnits(totalStaked);
  const avgOdds  = bets.length > 0 ? bets.reduce((s, b) => s + b.totalOdds, 0) / bets.length : 0;
  return { totalBets: bets.length, pending, totalStaked, totalReturns, pnl, roi, units, stakedUnits, avgOdds };
}

interface Props {
  active: FilterType;
  onChange: (f: FilterType) => void;
  stats: BetStats;
  fmt: OddsFormat;
}

export default function FilterBar({ active, onChange, stats, fmt }: Props) {
  const scrollRef  = useRef<HTMLDivElement>(null);
  const dragging   = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollL = useRef(0);
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

  const onDragStart = useCallback((e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    dragging.current = true;
    dragStartX.current = e.pageX - el.offsetLeft;
    dragScrollL.current = el.scrollLeft;
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';
  }, []);

  const onDragMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    scrollRef.current.scrollLeft = dragScrollL.current - (x - dragStartX.current);
  }, []);

  const onDragEnd = useCallback(() => {
    dragging.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
      scrollRef.current.style.userSelect = '';
    }
  }, []);

  const arrow = (dir: 'left' | 'right', can: boolean) => (
    <button
      onClick={() => scroll(dir)}
      aria-label={`Scroll ${dir}`}
      style={{
        flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
        border: `1px solid ${can ? '#2a2a52' : '#141428'}`,
        background: 'transparent',
        color: can ? '#64748b' : '#1e1e3e',
        cursor: can ? 'pointer' : 'default',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s', pointerEvents: can ? 'auto' : 'none',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        {dir === 'left'
          ? <path d="M9 2.5L5 7L9 11.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          : <path d="M5 2.5L9 7L5 11.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        }
      </svg>
    </button>
  );

  const statItems = [
    { label: 'PICKS',          value: String(stats.totalBets),                           color: '#94a3b8' },
    { label: 'SETTLED STAKES', value: `${stats.stakedUnits.toFixed(2)}u`,                 color: '#94a3b8' },
    { label: 'NET UNITS',      value: `${unitsPos ? '+' : ''}${stats.units.toFixed(2)}u`, color: unitsPos ? '#10b981' : '#ef4444' },
    { label: 'ROI',            value: `${pnlPos ? '+' : ''}${stats.roi.toFixed(1)}%`,     color: pnlPos ? '#10b981' : '#ef4444' },
    { label: 'AVG ODDS',       value: `@ ${formatOdds(stats.avgOdds, fmt)}`,              color: '#a78bfa' },
  ];

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px' }}>

      {/* ── Filter pills ── */}
      <div style={{ paddingTop: 8, paddingBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
        {arrow('left', canL)}
        <div
          ref={scrollRef}
          className="no-scrollbar"
          style={{ display: 'flex', gap: 6, overflowX: 'auto', flex: 1, minWidth: 0, cursor: 'grab' }}
          onMouseDown={onDragStart}
          onMouseMove={onDragMove}
          onMouseUp={onDragEnd}
          onMouseLeave={onDragEnd}
        >
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
      <div className="stats-grid" style={{ marginTop: 16, marginBottom: 4, paddingBottom: 16, borderBottom: '1px solid #1a1a38' }}>
        {statItems.map((item, i) => (
          <div
            key={i}
            className="stats-item"
            style={{ borderRight: i < statItems.length - 1 ? '1px solid #1a1a38' : undefined }}
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
