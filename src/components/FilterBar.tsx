'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { BetStats, FilterType, OddsFormat } from '@/lib/types';
import { formatOdds } from '@/lib/odds';
import { SITE_NAME } from '@/lib/config';

export { applyFilter, computeStats } from '@/lib/stats';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'last7',  label: 'Last 7 Days' },
  { key: 'last30', label: 'Last 30 Days' },
  { key: 'last60', label: 'Last 60 Days' },
  { key: 'last90', label: 'Last 90 Days' },
  { key: 'year',   label: '1 Year' },
  { key: 'all',    label: 'All Time' },
];

interface Props {
  active: FilterType;
  onChange: (f: FilterType) => void;
  stats: BetStats;
  fmt: OddsFormat;
}

export default function FilterBar({ active, onChange, stats, fmt }: Props) {
  const scrollRef  = useRef<HTMLDivElement>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const dragging   = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollL = useRef(0);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(true);
  const [sharing, setSharing] = useState(false);
  const pnlPos   = stats.pnl >= 0;
  const unitsPos = stats.units >= 0;
  const periodLabel = FILTERS.find(f => f.key === active)?.label ?? active;

  async function handleShareStats() {
    if (sharing || !shareCardRef.current) return;
    setSharing(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(shareCardRef.current, { pixelRatio: 2 });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${SITE_NAME.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-stats-${active}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Failed to export stats image', err);
    } finally {
      setSharing(false);
    }
  }

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
        border: `1px solid ${can ? 'var(--border)' : 'var(--border-soft)'}`,
        background: 'transparent',
        color: can ? 'var(--text-muted)' : 'var(--border)',
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
    { label: 'PICKS',          value: String(stats.totalBets),                           color: 'var(--text-muted)' },
    { label: 'SETTLED STAKES', value: `${stats.stakedUnits.toFixed(2)}u`,                 color: 'var(--text-muted)' },
    { label: 'NET UNITS',      value: `${unitsPos ? '+' : ''}${stats.units.toFixed(2)}u`, color: unitsPos ? 'var(--won)' : 'var(--lost)' },
    { label: 'ROI',            value: `${pnlPos ? '+' : ''}${stats.roi.toFixed(1)}%`,     color: pnlPos ? 'var(--won)' : 'var(--lost)' },
    { label: 'AVG ODDS',       value: `@ ${formatOdds(stats.avgOdds, fmt)}`,               color: 'var(--accent)' },
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
                  background: isActive ? 'var(--accent)' : 'transparent',
                  border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 20,
                  color: isActive ? 'var(--accent-contrast)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11, fontWeight: isActive ? 700 : 600, letterSpacing: '0.03em',
                  padding: '6px 14px', cursor: 'pointer',
                  whiteSpace: 'nowrap', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        {arrow('right', canR)}
        <button
          onClick={handleShareStats}
          disabled={sharing}
          aria-label="Share these stats as an image"
          title="Share these stats as an image"
          style={{
            flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-muted)', cursor: sharing ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {sharing ? (
            <span aria-hidden style={{
              width: 12, height: 12, borderRadius: '50%',
              border: '2px solid var(--border)', borderTopColor: 'var(--accent)',
              animation: 'spin 0.8s linear infinite', display: 'block',
            }} />
          ) : (
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M8 10.5V2M8 2L5 5M8 2l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 9.5V12.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Stats row ── */}
      <div className="stats-grid" style={{ marginTop: 16, marginBottom: 4, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
        {statItems.map((item, i) => (
          <div
            key={i}
            className="stats-item"
            style={{ borderRight: i < statItems.length - 1 ? '1px solid var(--border)' : undefined }}
          >
            <div className="tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 600, color: item.color, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
              {item.value}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.06em', marginTop: 3 }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* Off-screen card captured by handleShareStats — styled standalone
          since the inline stats row above assumes surrounding page chrome. */}
      <div style={{ position: 'fixed', top: 0, left: -9999, pointerEvents: 'none' }}>
        <div ref={shareCardRef} style={{
          width: 420, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 18,
          padding: '28px 26px', fontFamily: 'var(--font-body)',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
              {SITE_NAME}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.08em' }}>
              {periodLabel.toUpperCase()}
            </span>
          </div>
          <div style={{ height: 1, background: 'var(--border)', margin: '16px 0 20px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            {statItems.map((item, i) => (
              <div key={i}>
                <div className="tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: item.color, letterSpacing: '-0.01em' }}>
                  {item.value}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.06em', marginTop: 4 }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
