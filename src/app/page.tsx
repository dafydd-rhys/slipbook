'use client';

// The public tracker: date-range + advanced filters over every bet, an
// infinite-scrolling day-grouped list, and a "share this view" link. Filter
// state round-trips through the URL so a shared link reproduces the same view.
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FilterBar from '@/components/tracker/FilterBar';
import FilterPanel from '@/components/tracker/FilterPanel';
import OddsFormatToggle from '@/components/tracker/OddsFormatToggle';
import LivePicksBadge from '@/components/tracker/LivePicksBadge';
import BetListSection from '@/components/tracker/BetListSection';
import { Bet, FilterType, OddsFormat } from '@/lib/types';
import { groupByDay } from '@/lib/dates';
import { applyFilter, computeStats } from '@/lib/stats';
import { AdvancedFilters, FilterPreset, applyAdvancedFilters, filtersToSearchParams, searchParamsToFilters, uniqueBookmakers, uniqueTags } from '@/lib/filters';

const PAGE_SIZE = 10;
const CONTENT_WIDTH = 720;
const FMT_KEY = 'slipbook_odds_format';

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
    if (hydratedFromUrl.current) {
      return;
    }

    hydratedFromUrl.current = true;

    const { range, adv: urlAdv } = searchParamsToFilters(searchParams);

    setFilter(range as FilterType);
    setAdv(urlAdv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the URL in sync so the current view is always a copyable link —
  // replace (not push) so filter tweaks don't spam browser history.
  useEffect(() => {
    if (!hydratedFromUrl.current) {
      return;
    }

    const params = filtersToSearchParams(filter, adv);
    const queryString = params.toString();

    router.replace(queryString ? `/?${queryString}` : '/', { scroll: false });
  }, [filter, adv, router]);

  useEffect(() => {
    fetch('/api/bets')
      .then((response) => response.json())
      .then((bets: Bet[]) => {
        setAllBets(bets);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/presets').then((response) => response.json()).then(setPresets).catch(() => {});
    fetch('/api/admin/login').then((response) => response.json()).then((data) => setAuthed(!!data.authed)).catch(() => {});
  }, []);

  function loadPresets() {
    fetch('/api/presets').then((response) => response.json()).then(setPresets).catch(() => {});
  }

  // Applies a saved preset's date range and advanced filters.
  function handleApplyPreset(preset: FilterPreset) {
    setFilter(preset.range as FilterType);
    setAdv(preset.adv);
  }

  // Saves the current filter combination as a named preset.
  async function handleSavePreset(name: string) {
    const res = await fetch('/api/presets', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, range: filter, adv }),
    });

    if (res.ok) {
      loadPresets();
    }
  }

  // Deletes a saved preset.
  async function handleDeletePreset(id: string) {
    const res = await fetch(`/api/presets/${id}`, { method: 'DELETE' });

    if (res.ok) {
      loadPresets();
    }
  }

  // Restores the odds-format preference saved on this device.
  useEffect(() => {
    Promise.resolve().then(() => {
      const storedFmt = localStorage.getItem(FMT_KEY) as OddsFormat | null;

      if (storedFmt) {
        setFmt(storedFmt);
      }
    });
  }, []);

  // Switches the odds display format and remembers the choice for next time.
  function handleFmtChange(format: OddsFormat) {
    setFmt(format);
    localStorage.setItem(FMT_KEY, format);
  }

  // Changing the date-range filter resets the infinite-scroll page size.
  const handleFilterChange = useCallback((newFilter: FilterType) => {
    setFilter(newFilter);
    setDisplayCount(PAGE_SIZE);
  }, []);

  // Copies the current (filtered) page URL to the clipboard.
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

  // Loads the next page of bets once the sentinel at the bottom of the list scrolls into view.
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayCount((count) => count + PAGE_SIZE);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [hasMore, groups.length]);

  return (
    <>
      <OddsFormatToggle fmt={fmt} onChange={handleFmtChange} />
      <FilterBar active={filter} onChange={handleFilterChange} stats={stats} fmt={fmt} />

      <div style={{ maxWidth: CONTENT_WIDTH, margin: '0 auto', padding: '10px 20px 0' }}>
        <FilterPanel
          value={adv} onChange={setAdv} bookmakers={bookmakers} tags={tags} onCopyLink={handleCopyLink} copied={copied}
          presets={presets} authed={authed}
          onApplyPreset={handleApplyPreset} onSavePreset={handleSavePreset} onDeletePreset={handleDeletePreset}
        />
      </div>

      <LivePicksBadge count={stats.pending} />

      <BetListSection
        loading={loading}
        groups={groups}
        isEmpty={filtered.length === 0}
        fmt={fmt}
        hasMore={hasMore}
        sentinelRef={sentinelRef}
      />
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
