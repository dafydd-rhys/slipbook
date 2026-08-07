// Pure aggregation/analytics functions over a Bet[] — breakdowns by sport,
// bet type, market, odds range, day/time, streaks, drawdown, staking-pattern
// checks, and the text summary handed to the AI performance-summary endpoint.
// No React, no fetch — usable from both client components and server routes.
import { Bet, BetStats, BetType, FilterType, SportType, BreakdownRow, StreakInfo, DrawdownInfo } from './types';
import { toUnits } from './units';
import { canonicalMarket } from './marketAliases';
import { computeBetResult } from './betForm';

// ── Date-range filter + top-line stats (moved here from FilterBar so the same
// logic is usable server-side, e.g. for the AI summary) ─────────────────────

// Keeps only bets within the given rolling date range, newest first. 'all' returns everything.
export function applyFilter(bets: Bet[], filter: FilterType): Bet[] {
  const now = new Date();
  const last7 = new Date(now);
  last7.setDate(now.getDate() - 7);
  const last30 = new Date(now);
  last30.setDate(now.getDate() - 30);
  const last60 = new Date(now);
  last60.setDate(now.getDate() - 60);
  const last90 = new Date(now);
  last90.setDate(now.getDate() - 90);
  const lastYear = new Date(now);
  lastYear.setDate(now.getDate() - 365);

  let filtered = [...bets];

  switch (filter) {
    case 'last7':  filtered = filtered.filter((bet) => new Date(bet.date) >= last7); break;
    case 'last30': filtered = filtered.filter((bet) => new Date(bet.date) >= last30); break;
    case 'last60': filtered = filtered.filter((bet) => new Date(bet.date) >= last60); break;
    case 'last90': filtered = filtered.filter((bet) => new Date(bet.date) >= last90); break;
    case 'year':   filtered = filtered.filter((bet) => new Date(bet.date) >= lastYear); break;
    case 'all':    break;
  }

  filtered.sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return filtered;
}

// Top-line totals (staked/returns/P&L/ROI/units/average odds) across a set of bets.
export function computeStats(bets: Bet[]): BetStats {
  const settled = bets.filter((bet) => bet.result !== 'pending');
  const pending = bets.filter((bet) => bet.result === 'pending').length;
  const totalStaked = settled.reduce((sum, bet) => sum + bet.stake, 0);
  const totalReturns = settled.reduce((sum, bet) => sum + (bet.returns ?? 0), 0);
  const pnl = totalReturns - totalStaked;
  const roi = totalStaked > 0 ? (pnl / totalStaked) * 100 : 0;
  const units = toUnits(pnl);
  const stakedUnits = toUnits(totalStaked);
  const avgOdds = bets.length > 0 ? bets.reduce((sum, bet) => sum + bet.totalOdds, 0) / bets.length : 0;

  return { totalBets: bets.length, pending, totalStaked, totalReturns, pnl, roi, units, stakedUnits, avgOdds };
}

// ── Generic breakdown aggregator ────────────────────────────────────────────

// Shared by every single-dimension breakdown below and by correlationBreakdown's
// two-dimension groups — the staked/returns/pnl/roi/winRate math is identical,
// only how bets get grouped and labelled differs.
function summarizeGroup(key: string, label: string, group: Bet[]): BreakdownRow {
  const settled = group.filter((bet) => bet.result !== 'pending' && bet.result !== 'void');
  const staked = group.reduce((sum, bet) => sum + bet.stake, 0);
  const returns = group.reduce((sum, bet) => sum + (bet.returns ?? 0), 0);
  const pnl = returns - staked;
  const won = group.filter((bet) => bet.result === 'won').length;

  return {
    key,
    label,
    bets: group.length,
    staked,
    returns,
    pnl,
    units: toUnits(pnl),
    roi: staked > 0 ? (pnl / staked) * 100 : 0,
    winRate: settled.length > 0 ? (won / settled.length) * 100 : 0,
  };
}

// Groups bets by whatever key `keyOf` returns (bets with a null key are
// dropped), then summarizes each group and sorts by bet count.
function aggregateBets(
  bets: Bet[],
  keyOf: (bet: Bet) => string | null,
  labelOf: (key: string) => string
): BreakdownRow[] {
  const groups = new Map<string, Bet[]>();

  for (const bet of bets) {
    const key = keyOf(bet);

    if (key === null) {
      continue;
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key)!.push(bet);
  }

  const rows = Array.from(groups, ([key, group]) => summarizeGroup(key, labelOf(key), group));

  return rows.sort((a, b) => b.bets - a.bets);
}

const SPORT_LABELS: Record<SportType, string> = {
  football: 'Football', tennis: 'Tennis', basketball: 'Basketball', esports: 'Esports',
  cricket: 'Cricket', horse_racing: 'Horse Racing', golf: 'Golf', rugby: 'Rugby',
  boxing: 'Boxing', mma: 'MMA', darts: 'Darts', baseball: 'Baseball', other: 'Other',
};

// A bet's "sport" for breakdown purposes: the shared sport across every leg,
// or "mixed" for an acca spanning multiple sports — attributing a multi-sport
// bet's P&L to one sport would be arbitrary, so it gets its own honest bucket.
function betSportKey(bet: Bet): string {
  const sports = new Set(bet.legs.map((leg) => leg.sport ?? 'other'));

  if (sports.size === 1) {
    return [...sports][0];
  }

  return 'mixed';
}

// Performance broken down by sport. Money (staked/returns/pnl/units) stays
// attributed at the bet level — a multi-sport acca can't have its P&L
// honestly split across sports, so those bets' money lands in "Mixed".
// Bet/win counts, however, are tallied per leg (same idea as
// marketBreakdown), so a football leg inside a mixed acca still counts
// toward football's numbers instead of disappearing into "Mixed" entirely.
export function sportBreakdown(bets: Bet[]): BreakdownRow[] {
  const moneyRows = aggregateBets(bets, betSportKey, (key) => key === 'mixed' ? 'Mixed' : SPORT_LABELS[key as SportType] ?? key);

  const legCounts = new Map<string, { total: number; won: number; settled: number }>();

  for (const bet of bets) {
    for (const leg of bet.legs) {
      const key = leg.sport ?? 'other';
      const legStats = legCounts.get(key) ?? { total: 0, won: 0, settled: 0 };

      legStats.total++;

      if (leg.result === 'won' || leg.result === 'lost') {
        legStats.settled++;

        if (leg.result === 'won') {
          legStats.won++;
        }
      }

      legCounts.set(key, legStats);
    }
  }

  const rows = moneyRows.map((row) => {
    if (row.key === 'mixed') {
      return row; // no honest per-leg count for a bucket defined as "spans sports"
    }

    const legStats = legCounts.get(row.key);

    return legStats
      ? { ...row, bets: legStats.total, winRate: legStats.settled > 0 ? (legStats.won / legStats.settled) * 100 : 0 }
      : row;
  });

  // Sports that only ever appear as legs inside a mixed acca (no pure-sport
  // bets of their own) still deserve a counts-only row.
  const coveredKeys = new Set(moneyRows.map((row) => row.key));

  for (const [key, legStats] of legCounts) {
    if (coveredKeys.has(key)) {
      continue;
    }

    rows.push({
      key, label: SPORT_LABELS[key as SportType] ?? key,
      bets: legStats.total, staked: 0, returns: 0, pnl: 0, units: 0, roi: 0,
      winRate: legStats.settled > 0 ? (legStats.won / legStats.settled) * 100 : 0,
    });
  }

  return rows.sort((a, b) => b.bets - a.bets);
}

const BET_TYPE_LABELS: Record<BetType, string> = {
  single: 'Single', double: 'Double', treble: 'Treble', acca: 'Accumulator',
  bet_builder: 'Bet Builder', each_way: 'Each Way', outright: 'Outright',
  system: 'System', lucky15: 'Lucky 15', lucky31: 'Lucky 31', lucky63: 'Lucky 63',
};

// Performance broken down by bet type (single, acca, each-way, etc.).
export function betTypeBreakdown(bets: Bet[]): BreakdownRow[] {
  return aggregateBets(bets, (bet) => bet.type, (key) => BET_TYPE_LABELS[key as BetType] ?? key);
}

// Performance broken down by bookmaker.
export function bookmakerBreakdown(bets: Bet[]): BreakdownRow[] {
  return aggregateBets(bets, (bet) => bet.bookmaker?.trim() || null, (key) => key);
}

// Markets live on legs, not bets — a bet builder or acca leg can't be cleanly
// attributed a share of the whole bet's P&L, so this tracks leg-level
// frequency and win rate only (no staked/returns/pnl, which stay 0).
export function marketBreakdown(bets: Bet[], limit = 12): BreakdownRow[] {
  const groups = new Map<string, { total: number; won: number; settled: number }>();

  for (const bet of bets) {
    for (const leg of bet.legs) {
      const key = leg.market.trim() ? canonicalMarket(leg.market) : 'Unknown';
      const marketStats = groups.get(key) ?? { total: 0, won: 0, settled: 0 };

      marketStats.total++;

      if (leg.result === 'won' || leg.result === 'lost') {
        marketStats.settled++;

        if (leg.result === 'won') {
          marketStats.won++;
        }
      }

      groups.set(key, marketStats);
    }
  }

  const rows: BreakdownRow[] = Array.from(groups.entries()).map(([key, marketStats]) => ({
    key, label: key, bets: marketStats.total, staked: 0, returns: 0, pnl: 0, units: 0,
    roi: 0, winRate: marketStats.settled > 0 ? (marketStats.won / marketStats.settled) * 100 : 0,
  }));

  return rows.sort((a, b) => b.bets - a.bets).slice(0, limit);
}

const ODDS_BUCKETS: { max: number; label: string }[] = [
  { max: 1.5, label: '1.01 – 1.50' },
  { max: 2,   label: '1.51 – 2.00' },
  { max: 3,   label: '2.01 – 3.00' },
  { max: 5,   label: '3.01 – 5.00' },
  { max: 10,  label: '5.01 – 10.00' },
  { max: Infinity, label: '10.00+' },
];

// The odds bucket a decimal price falls into, e.g. 2.4 -> "2.01 – 3.00".
function oddsBucketKey(odds: number): string {
  return ODDS_BUCKETS.find((bucket) => odds <= bucket.max)?.label ?? ODDS_BUCKETS[ODDS_BUCKETS.length - 1].label;
}

// Performance broken down by odds range.
export function oddsRangeBreakdown(bets: Bet[]): BreakdownRow[] {
  const rows = aggregateBets(bets, (bet) => oddsBucketKey(bet.totalOdds), (key) => key);

  return rows.sort((a, b) => ODDS_BUCKETS.findIndex((bucket) => bucket.label === a.key) - ODDS_BUCKETS.findIndex((bucket) => bucket.label === b.key));
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Performance broken down by day of week the bet was placed.
export function dayOfWeekBreakdown(bets: Bet[]): BreakdownRow[] {
  const rows = aggregateBets(bets, (bet) => String(new Date(bet.date).getDay()), (key) => DAY_NAMES[Number(key)]);

  return rows.sort((a, b) => Number(a.key) - Number(b.key));
}

const TIME_BUCKETS: { max: number; label: string }[] = [
  { max: 5,  label: 'Night (00:00–05:00)' },
  { max: 12, label: 'Morning (05:00–12:00)' },
  { max: 17, label: 'Afternoon (12:00–17:00)' },
  { max: 21, label: 'Evening (17:00–21:00)' },
  { max: 24, label: 'Late Night (21:00–00:00)' },
];

// The time-of-day bucket an hour (0-23) falls into, e.g. 14 -> "Afternoon (12:00–17:00)".
function timeBucketKey(hour: number): string {
  return TIME_BUCKETS.find((bucket) => hour < bucket.max)?.label ?? TIME_BUCKETS[TIME_BUCKETS.length - 1].label;
}

// Performance broken down by time of day the bet was placed.
export function timeOfDayBreakdown(bets: Bet[]): BreakdownRow[] {
  const rows = aggregateBets(bets, (bet) => timeBucketKey(new Date(bet.date).getHours()), (key) => key);

  return rows.sort((a, b) => TIME_BUCKETS.findIndex((bucket) => bucket.label === a.key) - TIME_BUCKETS.findIndex((bucket) => bucket.label === b.key));
}

// ── Correlation breakdown ────────────────────────────────────────────────────
// Cross-tabulates two dimensions (e.g. tag × sport) to surface combinations
// that over/under-perform their single-dimension averages. Tags are
// multi-valued per bet, so a bet with 2 tags contributes to 2 combo rows —
// the same attribution tradeoff the single-dimension tag breakdown makes.
export type CorrelationDimension = 'sport' | 'bookmaker' | 'tag';

// Every value a bet has for the given dimension — usually one, but a bet can
// have zero or several tags.
function dimensionKeys(bet: Bet, dim: CorrelationDimension): string[] {
  switch (dim) {
    case 'sport': return [betSportKey(bet)];
    case 'bookmaker': return bet.bookmaker?.trim() ? [bet.bookmaker.trim()] : [];
    case 'tag': return bet.tags && bet.tags.length > 0 ? bet.tags : [];
  }
}

// Display label for one dimension value.
function dimensionLabel(dim: CorrelationDimension, key: string): string {
  if (dim === 'sport') {
    return key === 'mixed' ? 'Mixed' : SPORT_LABELS[key as SportType] ?? key;
  }

  return key;
}

// Cross-tabulates two dimensions (e.g. sport × bookmaker) into one row per
// combination. minBets filters out noisy 1-2 bet combos that would otherwise
// dominate a ROI-sorted list with meaningless +/-100% outliers.
export function correlationBreakdown(
  bets: Bet[], dimA: CorrelationDimension, dimB: CorrelationDimension, minBets = 3
): BreakdownRow[] {
  const groups = new Map<string, Bet[]>();

  for (const bet of bets) {
    for (const keyA of dimensionKeys(bet, dimA)) {
      for (const keyB of dimensionKeys(bet, dimB)) {
        const key = `${keyA}|||${keyB}`;

        if (!groups.has(key)) {
          groups.set(key, []);
        }

        groups.get(key)!.push(bet);
      }
    }
  }

  const rows: BreakdownRow[] = [];

  for (const [key, group] of groups) {
    if (group.length < minBets) {
      continue;
    }

    const [keyA, keyB] = key.split('|||');
    const label = `${dimensionLabel(dimA, keyA)} × ${dimensionLabel(dimB, keyB)}`;

    rows.push(summarizeGroup(key, label, group));
  }

  return rows.sort((a, b) => b.units - a.units);
}

// ── Cumulative P&L series (for the Insights chart) ──────────────────────────
export interface PnlPoint { date: string; cumulativeUnits: number; label?: string }

// Running total of P&L (in units) across every settled bet, oldest first —
// the data series behind the Insights cumulative P&L chart.
export function cumulativePnlSeries(bets: Bet[]): PnlPoint[] {
  const settled = [...bets]
    .filter((bet) => bet.result !== 'pending')
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));

  let running = 0;

  return settled.map((bet) => {
    running += toUnits((bet.returns ?? 0) - bet.stake);

    return { date: bet.date, cumulativeUnits: running, label: bet.title };
  });
}

// ── "On this day" retrospective ─────────────────────────────────────────────
export interface OnThisDayEntry { year: number; bets: Bet[]; pnlUnits: number }

// Every past year (excluding the current one) that had a bet on today's
// calendar date, newest first, with that year's combined P&L.
export function onThisDay(bets: Bet[], today: Date = new Date()): OnThisDayEntry[] {
  const month = today.getMonth();
  const day = today.getDate();
  const currentYear = today.getFullYear();

  const byYear = new Map<number, Bet[]>();

  for (const bet of bets) {
    const date = new Date(bet.date);

    if (date.getMonth() !== month || date.getDate() !== day) {
      continue;
    }

    if (date.getFullYear() === currentYear) {
      continue; // "on this day" means past years only
    }

    const year = date.getFullYear();

    if (!byYear.has(year)) {
      byYear.set(year, []);
    }

    byYear.get(year)!.push(bet);
  }

  return Array.from(byYear.entries())
    .map(([year, yearBets]) => ({
      year,
      bets: yearBets,
      pnlUnits: toUnits(yearBets.reduce((sum, bet) => sum + ((bet.returns ?? 0) - bet.stake), 0)),
    }))
    .sort((a, b) => b.year - a.year);
}

// ── Streaks & drawdown ───────────────────────────────────────────────────────

// Current and longest win/loss streaks. Walks settled bets oldest-to-newest
// so "current streak" reflects the most recent results.
export function computeStreaks(bets: Bet[]): StreakInfo {
  const settled = [...bets]
    .filter((bet): bet is Bet & { result: 'won' | 'lost' } => bet.result === 'won' || bet.result === 'lost')
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));

  let longestWin = 0;
  let longestLoss = 0;
  let runType: 'won' | 'lost' | null = null;
  let runLength = 0;

  for (const bet of settled) {
    if (bet.result === runType) {
      runLength++;
    } else {
      runType = bet.result;
      runLength = 1;
    }

    if (runType === 'won') {
      longestWin = Math.max(longestWin, runLength);
    } else {
      longestLoss = Math.max(longestLoss, runLength);
    }
  }

  return {
    currentType: runType ?? 'none',
    currentLength: runLength,
    longestWin,
    longestLoss,
  };
}

// Max and current drawdown (in units) from the running P&L peak. Walks
// settled bets oldest-to-newest so "current drawdown" reflects where things stand today.
export function computeDrawdown(bets: Bet[]): DrawdownInfo {
  const settled = [...bets]
    .filter((bet) => bet.result !== 'pending')
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));

  let running = 0;
  let peak = 0;
  let maxDrawdown = 0;
  let maxDrawdownPeak = 0;

  for (const bet of settled) {
    running += toUnits((bet.returns ?? 0) - bet.stake);

    if (running > peak) {
      peak = running;
    }

    const drawdown = peak - running;

    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPeak = peak;
    }
  }

  const currentDrawdown = peak - running;

  return {
    maxDrawdownUnits: maxDrawdown,
    maxDrawdownPct: maxDrawdownPeak > 0 ? (maxDrawdown / maxDrawdownPeak) * 100 : 0,
    currentDrawdownUnits: currentDrawdown,
    peakUnits: peak,
  };
}

// ── Staking pattern check ────────────────────────────────────────────────────
// Simple, honest heuristic: average stake placed right after a loss vs. right
// after a win. A meaningfully higher post-loss average is a "chasing" signal
// worth a nudge — this is not statistical proof of anything, just a flag.
export interface StakingPatternResult {
  avgStakeAfterWin: number;
  avgStakeAfterLoss: number;
  chasingSignal: boolean;
  note: string;
}

// Average of a list of numbers, or 0 for an empty list.
function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

// Compares average stake after a win vs. after a loss, flagging a
// meaningfully higher post-loss average as a possible "chasing losses" pattern.
export function stakingPatternCheck(bets: Bet[]): StakingPatternResult {
  const settled = [...bets]
    .filter((bet) => bet.result === 'won' || bet.result === 'lost')
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));

  const afterWin: number[] = [];
  const afterLoss: number[] = [];

  for (let i = 1; i < settled.length; i++) {
    const previous = settled[i - 1];
    const stake = settled[i].stake;

    if (previous.result === 'won') {
      afterWin.push(stake);
    } else {
      afterLoss.push(stake);
    }
  }

  const avgStakeAfterWin = average(afterWin);
  const avgStakeAfterLoss = average(afterLoss);

  const hasEnoughData = afterWin.length >= 4 && afterLoss.length >= 4;
  const chasingSignal = hasEnoughData && avgStakeAfterLoss > avgStakeAfterWin * 1.25;

  const note = !hasEnoughData
    ? 'Not enough settled bets yet to check for a staking pattern.'
    : chasingSignal
      ? `Your average stake after a loss (${avgStakeAfterLoss.toFixed(2)}) runs noticeably higher than after a win (${avgStakeAfterWin.toFixed(2)}) — worth watching for chasing losses.`
      : 'No meaningful difference between stakes placed after wins vs. after losses.';

  return { avgStakeAfterWin, avgStakeAfterLoss, chasingSignal, note };
}

// ── AI summary input ─────────────────────────────────────────────────────────

// Plain-text stats summary handed to the AI as its only input for the
// performance-summary feature. Deliberately excludes day-of-week/time-of-day
// (those buckets are computed from the caller's local timezone client-side; a
// server-computed version here would silently use the server's timezone
// instead, and quietly diverge from what the UI shows).
export function formatStatsForAI(bets: Bet[], periodLabel: string): string {
  const stats = computeStats(bets);
  const sports = sportBreakdown(bets).slice(0, 5);
  const types = betTypeBreakdown(bets);
  const streaks = computeStreaks(bets);
  const drawdown = computeDrawdown(bets);

  const lines = [
    `Period: ${periodLabel}`,
    `Bets: ${stats.totalBets} (${stats.pending} pending)`,
    `Staked: ${stats.stakedUnits.toFixed(2)}u, Net P&L: ${stats.units >= 0 ? '+' : ''}${stats.units.toFixed(2)}u, ROI: ${stats.roi.toFixed(1)}%`,
    `Average odds: ${stats.avgOdds.toFixed(2)}`,
    `Current streak: ${streaks.currentLength} ${streaks.currentType}${streaks.currentLength !== 1 ? 's' : ''} (longest win streak ${streaks.longestWin}, longest loss streak ${streaks.longestLoss})`,
    `Max drawdown: ${drawdown.maxDrawdownUnits.toFixed(2)}u from peak`,
    `By sport: ${sports.map((sport) => `${sport.label} ${sport.units >= 0 ? '+' : ''}${sport.units.toFixed(2)}u over ${sport.bets} bets`).join('; ') || 'n/a'}`,
    `By bet type: ${types.map((betType) => `${betType.label} ${betType.units >= 0 ? '+' : ''}${betType.units.toFixed(2)}u over ${betType.bets} bets`).join('; ') || 'n/a'}`,
  ];

  return lines.join('\n');
}

// ── Boost value ──────────────────────────────────────────────────────────────
export interface BoostValueResult { boostedWonBets: number; extraUnits: number }

// How many extra units boosted odds added, vs. what base odds would've paid —
// a boost only pays off on a win, so this only looks at settled, boosted, won bets.
export function computeBoostValue(bets: Bet[]): BoostValueResult {
  const boostedWon = bets.filter((bet) => bet.isBoosted && bet.result === 'won' && bet.baseTotalOdds != null);
  const extra = boostedWon.reduce((sum, bet) => sum + bet.stake * (bet.totalOdds - (bet.baseTotalOdds as number)), 0);

  return { boostedWonBets: boostedWon.length, extraUnits: toUnits(extra) };
}

// ── Cash-out analysis ────────────────────────────────────────────────────────
export interface CashOutAnalysisResult {
  comparable: number;
  excluded: number;
  actualUnits: number;
  hypotheticalUnits: number;
  diffUnits: number; // actual - hypothetical; positive means cashing out won you units
}

// Compares actual cash-out returns against what a bet would've paid had it run
// to completion. Only counts cash-outs where every leg's real result is known
// (i.e. the admin went back and filled in what actually happened) — there's no
// honest hypothetical for a leg that's still pending.
export function cashOutAnalysis(bets: Bet[]): CashOutAnalysisResult {
  const cashedOut = bets.filter((bet) => bet.cashedOut);

  let comparable = 0;
  let excluded = 0;
  let actual = 0;
  let hypothetical = 0;

  for (const bet of cashedOut) {
    if (bet.legs.some((leg) => leg.result === 'pending')) {
      excluded++;
      continue;
    }

    comparable++;
    actual += (bet.returns ?? 0) - bet.stake;

    const hypotheticalResult = computeBetResult(bet.legs.map((leg) => leg.result));
    const hypotheticalReturns = hypotheticalResult === 'won' ? bet.stake * bet.totalOdds : 0;

    hypothetical += hypotheticalReturns - bet.stake;
  }

  return {
    comparable, excluded,
    actualUnits: toUnits(actual), hypotheticalUnits: toUnits(hypothetical), diffUnits: toUnits(actual - hypothetical),
  };
}

// ── Closing Line Value ───────────────────────────────────────────────────────
export interface ClvResult { comparable: number; avgClvPct: number; beatClosingRate: number }

// Compares the odds you got against the closing price captured near kickoff
// (see clvCapture.ts) — positive CLV means you beat the closing line, the
// standard "are you finding value" signal independent of whether the bet won.
export function clvAnalysis(bets: Bet[]): ClvResult {
  const legs = bets.flatMap((bet) => bet.legs).filter((leg) => leg.closingOdds != null);

  if (legs.length === 0) {
    return { comparable: 0, avgClvPct: 0, beatClosingRate: 0 };
  }

  const clvPcts = legs.map((leg) => (leg.odds / (leg.closingOdds as number) - 1) * 100);
  const beatClosing = clvPcts.filter((pct) => pct > 0).length;

  return {
    comparable: legs.length,
    avgClvPct: clvPcts.reduce((sum, pct) => sum + pct, 0) / legs.length,
    beatClosingRate: (beatClosing / legs.length) * 100,
  };
}

// ── Leg-vs-bet win divergence ─────────────────────────────────────────────────
export interface LegVsBetDivergenceResult { bets: number; legWinRate: number; betWinRate: number }

// Compares leg-level win rate against bet-level win rate for settled multi-leg
// bets — a big gap illustrates how often individual legs win but the
// accumulator as a whole still loses.
export function legVsBetDivergence(bets: Bet[]): LegVsBetDivergenceResult {
  const multiLeg = bets.filter((bet) => bet.legs.length >= 2 && (bet.result === 'won' || bet.result === 'lost'));
  const settledLegs = multiLeg.flatMap((bet) => bet.legs).filter((leg) => leg.result === 'won' || leg.result === 'lost');
  const legsWon = settledLegs.filter((leg) => leg.result === 'won').length;
  const betsWon = multiLeg.filter((bet) => bet.result === 'won').length;

  return {
    bets: multiLeg.length,
    legWinRate: settledLegs.length > 0 ? (legsWon / settledLegs.length) * 100 : 0,
    betWinRate: multiLeg.length > 0 ? (betsWon / multiLeg.length) * 100 : 0,
  };
}
