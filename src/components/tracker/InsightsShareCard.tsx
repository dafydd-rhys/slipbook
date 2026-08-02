'use client';

// Off-screen card captured by the Insights "share" button — the cumulative
// P&L graph, this year's calendar grid, and the sport breakdown, composed
// into one image since those three normally live in separate tabs.
import { Ref } from 'react';
import { Bet } from '@/lib/types';
import { SITE_NAME } from '@/lib/config';
import { sportBreakdown } from '@/lib/stats';
import PnlChart from '@/components/charts/PnlChart';
import BreakdownTable from './BreakdownTable';
import { MONTHS, monthPnl, MonthTile } from './MonthGrid';

const CARD_LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 10,
};

interface InsightsShareCardProps {
  cardRef: Ref<HTMLDivElement>;
  filteredBets: Bet[]; // respects the page's year filter — feeds the graph and sport breakdown
  allBets: Bet[]; // unfiltered — the calendar grid always shows the current year, like the Calendar tab
  periodLabel: string;
}

export default function InsightsShareCard({ cardRef, filteredBets, allBets, periodLabel }: InsightsShareCardProps) {
  const thisYear = new Date().getFullYear();

  return (
    <div style={{ position: 'fixed', top: 0, left: -9999, pointerEvents: 'none' }}>
      <div ref={cardRef} style={{
        width: 520, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 18,
        padding: '28px 26px', fontFamily: 'var(--font-body)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
            {SITE_NAME}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.08em' }}>
            {periodLabel.toUpperCase()}
          </span>
        </div>

        <p style={CARD_LABEL}>CUMULATIVE P&amp;L</p>
        <div style={{ marginBottom: 22 }}>
          <PnlChart bets={filteredBets} height={160} />
        </div>

        <p style={CARD_LABEL}>{thisYear} BY MONTH</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 22 }}>
          {MONTHS.map((name, index) => (
            <MonthTile key={name} label={name.slice(0, 3)} pnl={monthPnl(allBets, thisYear, index)} />
          ))}
        </div>

        <p style={CARD_LABEL}>BY SPORT</p>
        <BreakdownTable rows={sportBreakdown(filteredBets)} />
      </div>
    </div>
  );
}
