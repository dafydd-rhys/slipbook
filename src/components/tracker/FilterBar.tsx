'use client';

// Date-range filter pills, top-line stats row, and a "share these stats as
// an image" button — sits at the top of the tracker page.
import { useRef, useState } from 'react';
import { BetStats, FilterType, OddsFormat } from '@/lib/types';
import { formatOdds } from '@/lib/odds';
import { SITE_NAME } from '@/lib/config';
import { shareElementAsPng, slugifyForFilename } from '@/lib/shareImage';
import FilterPills, { FILTERS } from './FilterPills';
import StatsRow, { StatItem } from './StatsRow';
import ShareStatsCard from './ShareStatsCard';
import ShareImageButton from '@/components/ShareImageButton';

// Maps the raw BetStats into the labelled/coloured items StatsRow expects.
function buildStatItems(stats: BetStats, fmt: OddsFormat): StatItem[] {
  const pnlPositive = stats.pnl >= 0;
  const unitsPositive = stats.units >= 0;

  return [
    { label: 'PICKS',          value: String(stats.totalBets),                           color: 'var(--text-muted)' },
    { label: 'SETTLED STAKES', value: `${stats.stakedUnits.toFixed(2)}u`,                 color: 'var(--text-muted)' },
    { label: 'NET UNITS',      value: `${unitsPositive ? '+' : ''}${stats.units.toFixed(2)}u`, color: unitsPositive ? 'var(--won)' : 'var(--lost)' },
    { label: 'ROI',            value: `${pnlPositive ? '+' : ''}${stats.roi.toFixed(1)}%`,     color: pnlPositive ? 'var(--won)' : 'var(--lost)' },
    { label: 'AVG ODDS',       value: `@ ${formatOdds(stats.avgOdds, fmt)}`,               color: 'var(--accent)' },
  ];
}

interface Props {
  active: FilterType;
  onChange: (filter: FilterType) => void;
  stats: BetStats;
  fmt: OddsFormat;
}

// Date-range pills plus the stats row and share button beneath them.
export default function FilterBar({ active, onChange, stats, fmt }: Props) {
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const periodLabel = FILTERS.find((filter) => filter.key === active)?.label ?? active;
  const statItems = buildStatItems(stats, fmt);

  async function handleShareStats() {
    if (sharing || !shareCardRef.current) {
      return;
    }

    setSharing(true);

    try {
      await shareElementAsPng(shareCardRef.current, `${slugifyForFilename(SITE_NAME)}-stats-${active}.png`);
    } catch (error) {
      console.error('Failed to export stats image', error);
    } finally {
      setSharing(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px' }}>
      <div style={{ paddingTop: 8, paddingBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
        <FilterPills active={active} onChange={onChange} />
        <ShareImageButton sharing={sharing} onShare={handleShareStats} label="Share these stats as an image" />
      </div>

      <StatsRow items={statItems} />
      <ShareStatsCard cardRef={shareCardRef} periodLabel={periodLabel} items={statItems} />
    </div>
  );
}
