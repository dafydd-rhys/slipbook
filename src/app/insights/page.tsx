'use client';

// Insights page: cumulative P&L chart, calendar view, breakdowns by
// sport/type/bookmaker/market/odds, and behavioral pattern checks (streaks,
// drawdown, staking patterns, day/time-of-day performance).
import { useEffect, useRef, useState } from 'react';
import { Bet } from '@/lib/types';
import { SITE_NAME } from '@/lib/config';
import { shareElementAsPng, slugifyForFilename } from '@/lib/shareImage';
import CalendarView from '@/components/tracker/CalendarView';
import GoalProgress from '@/components/charts/GoalProgress';
import OnThisDay from '@/components/tracker/OnThisDay';
import PnlChart from '@/components/charts/PnlChart';
import InsightsTabBar from '@/components/tracker/InsightsTabBar';
import InsightsShareCard from '@/components/tracker/InsightsShareCard';
import AiSummaryBanner, { StoredSummary } from '@/components/tracker/AiSummaryBanner';
import BreakdownsTab from '@/components/tracker/insights/BreakdownsTab';
import PatternsTab from '@/components/tracker/insights/PatternsTab';
import Spinner from '@/components/Spinner';
import ShareImageButton from '@/components/ShareImageButton';

const CONTENT_WIDTH = 720;
const TABS = ['Calendar', 'Breakdowns', 'Patterns'] as const;
type Tab = typeof TABS[number];
const ALL_TIME = 'All Time';

// Every year with at least one bet, newest first, for the year filter pills.
function yearsCoveredBy(bets: Bet[]): string[] {
  const years = new Set(bets.map((bet) => new Date(bet.date).getFullYear()));

  return Array.from(years).sort((a, b) => b - a).map(String);
}

// Card wrapping the cumulative P&L chart with its section heading.
function PnlChartSection({ bets }: { bets: Bet[] }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 12px 8px', marginBottom: 20 }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.06em', padding: '0 4px 12px' }}>
        CUMULATIVE P&amp;L
      </p>
      <PnlChart bets={bets} />
    </div>
  );
}

// Public insights page — see file header.
export default function InsightsPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<StoredSummary | null>(null);
  const [tab, setTab] = useState<Tab>('Calendar');
  const [selectedYear, setSelectedYear] = useState<string>(ALL_TIME);
  const [sharing, setSharing] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  // The graph, breakdowns and patterns respect the year filter; the goal
  // progress bar and "on this day" card have their own inherent time
  // windows and always look at every bet regardless of it.
  const yearFilteredBets = selectedYear === ALL_TIME
    ? bets
    : bets.filter((bet) => String(new Date(bet.date).getFullYear()) === selectedYear);

  async function handleShareInsights() {
    if (sharing || !shareCardRef.current) {
      return;
    }

    setSharing(true);

    try {
      await shareElementAsPng(shareCardRef.current, `${slugifyForFilename(SITE_NAME)}-insights-${selectedYear}.png`);
    } catch (error) {
      console.error('Failed to export insights image', error);
    } finally {
      setSharing(false);
    }
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/bets').then((response) => response.json()),
      fetch('/api/admin/summary').then((response) => response.ok ? response.json() : null).catch(() => null),
    ]).then(([betsData, summaryData]) => {
      setBets(betsData);
      setSummary(summaryData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="rise-in" style={{ maxWidth: CONTENT_WIDTH, margin: '0 auto', padding: '24px 20px 56px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
          Insights
        </h1>
        {bets.length > 0 && (
          <ShareImageButton sharing={sharing} onShare={handleShareInsights} label="Share insights as an image" />
        )}
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-faint)', marginBottom: 18, maxWidth: '60ch' }}>
        Performance broken down by sport, market, bet type, bookmaker, odds range, and behavioral patterns.
      </p>

      <AiSummaryBanner summary={summary} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spinner />
        </div>
      ) : bets.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '40px 0', fontSize: 14 }}>No bets yet.</p>
      ) : (
        <>
          <GoalProgress bets={bets} />
          <OnThisDay bets={bets} />

          <InsightsTabBar options={[ALL_TIME, ...yearsCoveredBy(bets)]} value={selectedYear} onChange={setSelectedYear} />
          <PnlChartSection bets={yearFilteredBets} />

          <InsightsTabBar options={TABS} value={tab} onChange={setTab} />

          {tab === 'Calendar' && <CalendarView bets={bets} />}
          {tab === 'Breakdowns' && <BreakdownsTab bets={yearFilteredBets} />}
          {tab === 'Patterns' && <PatternsTab bets={yearFilteredBets} />}

          <InsightsShareCard cardRef={shareCardRef} filteredBets={yearFilteredBets} allBets={bets} periodLabel={selectedYear} />
        </>
      )}
    </div>
  );
}
