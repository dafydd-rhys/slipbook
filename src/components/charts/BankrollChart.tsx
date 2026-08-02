'use client';

// Running bankroll balance (deposits/withdrawals/adjustments + settled bet P&L) as a line chart.
import { BankrollPoint } from '@/lib/types';
import { formatUnits } from '@/lib/units';
import LineChart from './LineChart';

interface Props {
  points: BankrollPoint[];
  height?: number;
}

export default function BankrollChart({ points, height = 220 }: Props) {
  return (
    <LineChart
      points={points.map((point) => ({ date: point.date, value: point.balance, label: point.label }))}
      height={height}
      gradientId="bankroll-fill"
      emptyMessage="Add a deposit or settle a bet to start the chart."
      ariaLabel={(lastValue) => `Bankroll balance over time, currently ${formatUnits(lastValue)}`}
      formatValue={formatUnits}
    />
  );
}
