import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, isValidSession } from '@/lib/adminAuth';
import { generateSummary } from '@/lib/slipParser';
import { readBets, readSummary, writeSummary } from '@/lib/db';
import { applyFilter, formatStatsForAI } from '@/lib/stats';
import { FilterType } from '@/lib/types';

const PERIOD_LABELS: Record<string, string> = {
  last7: 'the last 7 days',
  last30: 'the last 30 days',
  last60: 'the last 60 days',
  last90: 'the last 90 days',
  year: 'the last year',
  all: 'all time',
};

// Public: the tracker displays whatever summary was last generated.
export async function GET() {
  const summary = await readSummary();
  return NextResponse.json(summary);
}

// Admin: regenerate the summary on demand (deliberate action, not auto-run,
// to keep this a bounded number of API calls rather than one per page view).
export async function POST(req: NextRequest) {
  if (!isValidSession(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not set — AI summaries are unavailable.' },
      { status: 500 }
    );
  }
  const { period } = await req.json().catch(() => ({})) as { period?: FilterType };
  const filterKey = period ?? 'last30';
  const periodLabel = PERIOD_LABELS[filterKey] ?? PERIOD_LABELS.last30;

  const { bets } = await readBets();
  const filtered = applyFilter(bets, filterKey);
  if (filtered.length === 0) {
    return NextResponse.json({ error: 'No bets in that period to summarize' }, { status: 400 });
  }

  try {
    const text = await generateSummary(formatStatsForAI(filtered, periodLabel), periodLabel);
    const summary = { text, period: periodLabel, generatedAt: new Date().toISOString() };
    await writeSummary(summary);
    return NextResponse.json(summary);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to generate summary' }, { status: 500 });
  }
}
