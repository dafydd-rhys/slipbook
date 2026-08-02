'use client';

// Cumulative profit/loss (in units) across every settled bet, as a line chart.
import { useMemo } from 'react';
import { Bet } from '@/lib/types';
import { cumulativePnlSeries } from '@/lib/stats';
import LineChart from './LineChart';

// Formats a signed unit value, e.g. 1.5 -> "+1.50u", -2 -> "-2.0u".
function formatSigned(value: number, decimals: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}u`;
}

export default function PnlChart({ bets, height = 200 }: { bets: Bet[]; height?: number }) {
  const points = useMemo(() => cumulativePnlSeries(bets), [bets]);

  return (
    <LineChart
      points={points.map((point) => ({ date: point.date, value: point.cumulativeUnits, label: point.label }))}
      height={height}
      gradientId="pnl-fill"
      emptyMessage="Not enough settled bets yet to chart."
      ariaLabel={(lastValue) => `Cumulative profit and loss over time, currently ${lastValue.toFixed(2)} units`}
      formatValue={(value) => formatSigned(value, 2)}
      formatGridValue={(value) => formatSigned(value, 1)}
    />
  );
}
