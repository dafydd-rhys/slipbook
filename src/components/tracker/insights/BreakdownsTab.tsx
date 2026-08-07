'use client';

// Breakdown-by-dimension table (sport/bet type/bookmaker/market/odds range),
// with an optional two-dimension correlation view underneath.
import { useState } from 'react';
import { Bet } from '@/lib/types';
import {
  sportBreakdown, betTypeBreakdown, bookmakerBreakdown, marketBreakdown, oddsRangeBreakdown,
  correlationBreakdown, CorrelationDimension,
} from '@/lib/stats';
import BreakdownTable from '../BreakdownTable';
import InsightsTabBar from '../InsightsTabBar';

const DIMENSIONS = ['Sport', 'Bet Type', 'Bookmaker', 'Market', 'Odds Range'] as const;
type Dimension = typeof DIMENSIONS[number];

const CORRELATION_PAIRS: { label: string; a: CorrelationDimension; b: CorrelationDimension }[] = [
  { label: 'Sport × Bookmaker', a: 'sport', b: 'bookmaker' },
  { label: 'Sport × Tag', a: 'sport', b: 'tag' },
  { label: 'Bookmaker × Tag', a: 'bookmaker', b: 'tag' },
];

// Picks the right breakdown rows (and whether to show money columns) for a dimension.
function breakdownFor(dimension: Dimension, bets: Bet[]) {
  switch (dimension) {
    case 'Sport': return { rows: sportBreakdown(bets), showMoney: true };
    case 'Bet Type': return { rows: betTypeBreakdown(bets), showMoney: true };
    case 'Bookmaker': return { rows: bookmakerBreakdown(bets), showMoney: true };
    case 'Market': return { rows: marketBreakdown(bets), showMoney: false };
    case 'Odds Range': return { rows: oddsRangeBreakdown(bets), showMoney: true };
  }
}

// Single-dimension breakdown table with a collapsible two-dimension correlation view.
export default function BreakdownsTab({ bets }: { bets: Bet[] }) {
  const [dimension, setDimension] = useState<Dimension>('Sport');
  const [showCorrelations, setShowCorrelations] = useState(false);
  const [pairIndex, setPairIndex] = useState(0);

  const pair = CORRELATION_PAIRS[pairIndex];
  const correlationRows = correlationBreakdown(bets, pair.a, pair.b);

  return (
    <div className="fade-in">
      <InsightsTabBar options={DIMENSIONS} value={dimension} onChange={setDimension} />
      {dimension === 'Sport' && (
        <p style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 8 }}>
          Bet counts include each leg of a multi-sport accumulator individually; P&amp;L is only attributed when every leg shares one sport — mixed-sport slips are grouped under &quot;Mixed&quot;.
        </p>
      )}
      <BreakdownTable {...breakdownFor(dimension, bets)} />

      <button
        onClick={() => setShowCorrelations((current) => !current)}
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
          <InsightsTabBar
            options={CORRELATION_PAIRS.map((correlationPair) => correlationPair.label)}
            value={pair.label}
            onChange={(label) => setPairIndex(CORRELATION_PAIRS.findIndex((correlationPair) => correlationPair.label === label))}
          />
          <p style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 8 }}>
            Combinations with at least 3 bets, sorted by units — spots patterns a single-dimension breakdown can hide.
          </p>
          <BreakdownTable rows={correlationRows} />
        </div>
      )}
    </div>
  );
}
