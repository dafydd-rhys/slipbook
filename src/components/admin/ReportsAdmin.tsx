'use client';

// "Reports" tab — goal tracking, the AI performance summary, the basic tax
// report, and the date-range ledger PDF export.
import { Bet } from '@/lib/types';
import GoalAdmin from './GoalAdmin';
import AiSummarySection from './reports/AiSummarySection';
import TaxReportSection from './reports/TaxReportSection';
import LedgerExportSection from './reports/LedgerExportSection';

export default function ReportsAdmin({ bets, aiEnabled }: { bets: Bet[]; aiEnabled: boolean | null }) {
  return (
    <div>
      <GoalAdmin />
      <AiSummarySection aiEnabled={aiEnabled} />
      <TaxReportSection bets={bets} />
      <LedgerExportSection bets={bets} />
    </div>
  );
}
