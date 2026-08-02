'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BetCard from '@/components/BetCard';
import FilterBar, { applyFilter, computeStats } from '@/components/FilterBar';
import FilterPanel from '@/components/FilterPanel';
import { Bet, FilterType, OddsFormat } from '@/lib/types';
import { groupByDay } from '@/lib/dates';
import { AdvancedFilters, FilterPreset, applyAdvancedFilters, filtersToSearchParams, searchParamsToFilters, uniqueBookmakers, uniqueTags } from '@/lib/filters';

const PAGE_SIZE = 10;
const CONTENT_WIDTH = 720;
const FMT_KEY = 'strz_odds_format';

const SELECT_STYLE: React.CSSProperties = {
  background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8,
  color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 600, padding: '5px 8px',
  outline: 'none', cursor: 'pointer',
};

const FORMAT_LABELS: Record<OddsFormat, string> = {
  decimal: 'Decimal',
  fraction: 'Fraction',
  us: 'American',
};
const FORMATS: OddsFormat[] = ['decimal', 'fraction', 'us'];

function TrackerInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [allBets, setAllBets] = useState<Bet[]>([]);
  const [filter, setFilter] = useState<FilterType>('last30');
  const [adv, setAdv] = useState<AdvancedFilters>({ search: '', sports: [], bookmakers: [], results: [], tags: [], oddsMin: '', oddsMax: '' });
  const [fmt, setFmt] = useState<OddsFormat>('decimal');
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [authed, setAuthed] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hydratedFromUrl = useRef(false);

  // Hydrate filter state from the URL once, on first render.
  useEffect(() => {
    if (hydratedFromUrl.current) return;
    hydratedFromUrl.current = true;
    const { range, adv: urlAdv } = searchParamsToFilters(searchParams);
    setFilter(range as FilterType);
    setAdv(urlAdv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the URL in sync so the current view is always a copyable link —
  // replace (not push) so filter tweaks don't spam browser history.
  useEffect(() => {
    if (!hydratedFromUrl.current) return;
    const params = filtersToSearchParams(filter, adv);
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : '/', { scroll: false });
  }, [filter, adv, router]);

  useEffect(() => {
    fetch('/api/bets')
      .then(r => r.json())
      .then((bets: Bet[]) => { setAllBets(bets); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/presets').then(r => r.json()).then(setPresets).catch(() => {});
    fetch('/api/admin/login').then(r => r.json()).then(d => setAuthed(!!d.authed)).catch(() => {});
  }, []);

  function loadPresets() {
    fetch('/api/presets').then(r => r.json()).then(setPresets).catch(() => {});
  }

  function handleApplyPreset(preset: FilterPreset) {
    setFilter(preset.range as FilterType);
    setAdv(preset.adv);
  }

  async function handleSavePreset(name: string) {
    const res = await fetch('/api/presets', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, range: filter, adv }),
    });
    if (res.ok) loadPresets();
  }

  async function handleDeletePreset(id: string) {
    const res = await fetch(`/api/presets/${id}`, { method: 'DELETE' });
    if (res.ok) loadPresets();
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      const storedFmt = localStorage.getItem(FMT_KEY) as OddsFormat | null;
      if (storedFmt) setFmt(storedFmt);
    });
  }, []);

  function handleFmtChange(f: OddsFormat) {
    setFmt(f);
    localStorage.setItem(FMT_KEY, f);
  }

  const handleFilterChange = useCallback((f: FilterType) => {
    setFilter(f);
    setDisplayCount(PAGE_SIZE);
  }, []);

  function handleCopyLink() {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  const dateFiltered = applyFilter(allBets, filter);
  const filtered = applyAdvancedFilters(dateFiltered, adv);
  const visible = filtered.slice(0, displayCount);
  const groups = groupByDay(visible);
  const stats = computeStats(filtered);
  const hasMore = displayCount < filtered.length;
  const bookmakers = uniqueBookmakers(allBets);
  const tags = uniqueTags(allBets);

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
      <div style={{ marginTop: 8, borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{
          maxWidth: CONTENT_WIDTH, margin: '0 auto', padding: '0 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          height: 36,
        }}>
          <select value={fmt} onChange={e => handleFmtChange(e.target.value as OddsFormat)} style={SELECT_STYLE}>
            {FORMATS.map(f => <option key={f} value={f}>{FORMAT_LABELS[f]}</option>)}
          </select>
        </div>
      </div>

      {/* ── Filters + Stats ── */}
      <FilterBar active={filter} onChange={handleFilterChange} stats={stats} fmt={fmt} />

      {/* ── Search / advanced filters / share ── */}
      <div style={{ maxWidth: CONTENT_WIDTH, margin: '0 auto', padding: '10px 20px 0' }}>
        <FilterPanel
          value={adv} onChange={setAdv} bookmakers={bookmakers} tags={tags} onCopyLink={handleCopyLink} copied={copied}
          presets={presets} authed={authed}
          onApplyPreset={handleApplyPreset} onSavePreset={handleSavePreset} onDeletePreset={handleDeletePreset}
        />
      </div>

      {/* ── Live picks badge ── */}
      <div style={{ maxWidth: CONTENT_WIDTH, margin: '0 auto', padding: '10px 20px 0' }}>
        {stats.pending > 0 && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'var(--pending-soft)', border: '1px solid color-mix(in srgb, var(--pending) 45%, transparent)',
            borderRadius: 20, color: 'var(--pending)', fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 700,
            padding: '5px 14px',
          }}>
            <span className="animate-pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--pending)', display: 'block' }} />
            {stats.pending} LIVE
          </div>
        )}
      </div>

      {/* ── Bet list ── */}
      <div style={{ maxWidth: CONTENT_WIDTH, margin: '0 auto', padding: '10px 20px 56px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <span
              aria-hidden
              style={{
                display: 'inline-block', width: 30, height: 30, borderRadius: '50%',
                border: '3px solid var(--border)', borderTopColor: 'var(--accent)',
                animation: 'spin 0.8s linear infinite', marginBottom: 14,
              }}
            />
            <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>Loading slips…</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>No bets match these filters.</p>
          </div>
        )}

        {groups.map(({ label, bets }, gi) => (
          <div key={label} style={{ marginTop: gi > 0 ? 24 : 0 }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--text-faint)',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              paddingBottom: 10, borderBottom: '1px solid var(--border)', marginBottom: 12,
            }}>
              {label}
            </div>
            {bets.map((bet, i) => (
              <div key={bet.id} className="stagger-in" style={{ ['--i' as string]: Math.min(i, 6) }}>
                <BetCard bet={bet} fmt={fmt} />
              </div>
            ))}
          </div>
        ))}

        {hasMore && (
          <div ref={sentinelRef} style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
            Loading more…
          </div>
        )}
      </div>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <TrackerInner />
    </Suspense>
  );
}
