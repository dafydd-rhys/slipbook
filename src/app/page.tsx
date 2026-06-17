'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import BetCard from '@/components/BetCard';
import FilterBar, { applyFilter, computeStats } from '@/components/FilterBar';
import { Bet, FilterType, OddsFormat } from '@/lib/types';

const PAGE_SIZE = 10;
const CONTENT_WIDTH = 720;

function formatDayLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function groupByDay(bets: Bet[]) {
  const map = new Map<string, Bet[]>();
  for (const bet of bets) {
    const label = formatDayLabel(bet.date);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(bet);
  }
  return Array.from(map.entries()).map(([label, bets]) => ({ label, bets }));
}

const FORMAT_LABELS: Record<OddsFormat, string> = {
  decimal: 'Decimal',
  fraction: 'Fraction',
  us: 'American',
};
const FORMATS: OddsFormat[] = ['decimal', 'fraction', 'us'];

export default function Home() {
  const [allBets, setAllBets] = useState<Bet[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [fmt, setFmt] = useState<OddsFormat>('decimal');
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/bets')
      .then(r => r.json())
      .then((bets: Bet[]) => { setAllBets(bets); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

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
      {/* ── Odds format toggle ── */}
      <div style={{ marginTop: 12, borderBottom: '1px solid #1a1a38' }}>
        <div style={{
          maxWidth: CONTENT_WIDTH, margin: '0 auto', padding: '0 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          height: 40,
        }}>
          <div style={{ display: 'flex', gap: 2, background: '#12122a', borderRadius: 9, padding: 3 }}>
            {FORMATS.map(f => (
              <button
                key={f}
                onClick={() => setFmt(f)}
                style={{
                  background: fmt === f ? '#7c3aed' : 'transparent',
                  border: 'none',
                  borderRadius: 6,
                  color: fmt === f ? '#fff' : '#475569',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {FORMAT_LABELS[f]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filters + Stats ── */}
      <FilterBar active={filter} onChange={handleFilterChange} stats={stats} />

      {/* ── Bet list ── */}
      <div style={{ maxWidth: CONTENT_WIDTH, margin: '0 auto', padding: '20px 20px 56px' }}>
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
  );
}
