import { Bet, BetStats, BetType, FilterType, SportType, BreakdownRow, StreakInfo, DrawdownInfo } from './types';
import { toUnits } from './units';

// ── Date-range filter + top-line stats (moved here from FilterBar so the same
// logic is usable server-side, e.g. for the AI summary) ─────────────────────
export function applyFilter(bets: Bet[], filter: FilterType): Bet[] {
  const now = new Date();
  const last7  = new Date(now); last7.setDate(now.getDate() - 7);
  const last30 = new Date(now); last30.setDate(now.getDate() - 30);
  const last60 = new Date(now); last60.setDate(now.getDate() - 60);
  const last90 = new Date(now); last90.setDate(now.getDate() - 90);
  const lastYear = new Date(now); lastYear.setDate(now.getDate() - 365);

  let out = [...bets];
  switch (filter) {
    case 'last7':  out = out.filter(b => new Date(b.date) >= last7); break;
    case 'last30': out = out.filter(b => new Date(b.date) >= last30); break;
    case 'last60': out = out.filter(b => new Date(b.date) >= last60); break;
    case 'last90': out = out.filter(b => new Date(b.date) >= last90); break;
    case 'year':   out = out.filter(b => new Date(b.date) >= lastYear); break;
    case 'all':    break;
  }
  out.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  return out;
}

export function computeStats(bets: Bet[]): BetStats {
  const settled = bets.filter(b => b.result !== 'pending');
  const pending  = bets.filter(b => b.result === 'pending').length;
  const totalStaked  = settled.reduce((s, b) => s + b.stake, 0);
  const totalReturns = settled.reduce((s, b) => s + (b.returns ?? 0), 0);
  const pnl      = totalReturns - totalStaked;
  const roi      = totalStaked > 0 ? (pnl / totalStaked) * 100 : 0;
  const units    = toUnits(pnl);
  const stakedUnits = toUnits(totalStaked);
  const avgOdds  = bets.length > 0 ? bets.reduce((s, b) => s + b.totalOdds, 0) / bets.length : 0;
  return { totalBets: bets.length, pending, totalStaked, totalReturns, pnl, roi, units, stakedUnits, avgOdds };
}

// ── Generic breakdown aggregator ────────────────────────────────────────────
function aggregateBets(
  bets: Bet[],
  keyOf: (b: Bet) => string | null,
  labelOf: (key: string) => string
): BreakdownRow[] {
  const groups = new Map<string, Bet[]>();
  for (const b of bets) {
    const key = keyOf(b);
    if (key === null) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(b);
  }

  const rows: BreakdownRow[] = [];
  for (const [key, group] of groups) {
    const settled = group.filter(b => b.result !== 'pending' && b.result !== 'void');
    const staked  = group.reduce((s, b) => s + b.stake, 0);
    const returns = group.reduce((s, b) => s + (b.returns ?? 0), 0);
    const pnl = returns - staked;
    const won = group.filter(b => b.result === 'won').length;
    rows.push({
      key,
      label: labelOf(key),
      bets: group.length,
      staked,
      returns,
      pnl,
      units: toUnits(pnl),
      roi: staked > 0 ? (pnl / staked) * 100 : 0,
      winRate: settled.length > 0 ? (won / settled.length) * 100 : 0,
    });
  }
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
  const sports = new Set(bet.legs.map(l => l.sport ?? 'other'));
  if (sports.size === 1) return [...sports][0];
  return 'mixed';
}

export function sportBreakdown(bets: Bet[]): BreakdownRow[] {
  return aggregateBets(bets, betSportKey, key => key === 'mixed' ? 'Mixed' : SPORT_LABELS[key as SportType] ?? key);
}

const BET_TYPE_LABELS: Record<BetType, string> = {
  single: 'Single', double: 'Double', treble: 'Treble', acca: 'Accumulator',
  bet_builder: 'Bet Builder', each_way: 'Each Way', outright: 'Outright',
  system: 'System', lucky15: 'Lucky 15', lucky31: 'Lucky 31', lucky63: 'Lucky 63',
};

export function betTypeBreakdown(bets: Bet[]): BreakdownRow[] {
  return aggregateBets(bets, b => b.type, key => BET_TYPE_LABELS[key as BetType] ?? key);
}

export function bookmakerBreakdown(bets: Bet[]): BreakdownRow[] {
  return aggregateBets(bets, b => b.bookmaker?.trim() || null, key => key);
}

// Markets live on legs, not bets — a bet builder or acca leg can't be cleanly
// attributed a share of the whole bet's P&L, so this tracks leg-level
// frequency and win rate only (no staked/returns/pnl, which stay 0).
export function marketBreakdown(bets: Bet[], limit = 12): BreakdownRow[] {
  const groups = new Map<string, { total: number; won: number; settled: number }>();
  for (const bet of bets) {
    for (const leg of bet.legs) {
      const key = leg.market.trim() || 'Unknown';
      const g = groups.get(key) ?? { total: 0, won: 0, settled: 0 };
      g.total++;
      if (leg.result === 'won' || leg.result === 'lost') {
        g.settled++;
        if (leg.result === 'won') g.won++;
      }
      groups.set(key, g);
    }
  }
  const rows: BreakdownRow[] = Array.from(groups.entries()).map(([key, g]) => ({
    key, label: key, bets: g.total, staked: 0, returns: 0, pnl: 0, units: 0,
    roi: 0, winRate: g.settled > 0 ? (g.won / g.settled) * 100 : 0,
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
function oddsBucketKey(odds: number): string {
  return ODDS_BUCKETS.find(b => odds <= b.max)?.label ?? ODDS_BUCKETS[ODDS_BUCKETS.length - 1].label;
}
export function oddsRangeBreakdown(bets: Bet[]): BreakdownRow[] {
  const rows = aggregateBets(bets, b => oddsBucketKey(b.totalOdds), key => key);
  return rows.sort((a, b) => ODDS_BUCKETS.findIndex(x => x.label === a.key) - ODDS_BUCKETS.findIndex(x => x.label === b.key));
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export function dayOfWeekBreakdown(bets: Bet[]): BreakdownRow[] {
  const rows = aggregateBets(bets, b => String(new Date(b.date).getDay()), key => DAY_NAMES[Number(key)]);
  return rows.sort((a, b) => Number(a.key) - Number(b.key));
}

const TIME_BUCKETS: { max: number; label: string }[] = [
  { max: 5,  label: 'Night (00:00–05:00)' },
  { max: 12, label: 'Morning (05:00–12:00)' },
  { max: 17, label: 'Afternoon (12:00–17:00)' },
  { max: 21, label: 'Evening (17:00–21:00)' },
  { max: 24, label: 'Late Night (21:00–00:00)' },
];
function timeBucketKey(hour: number): string {
  return TIME_BUCKETS.find(b => hour < b.max)?.label ?? TIME_BUCKETS[TIME_BUCKETS.length - 1].label;
}
export function timeOfDayBreakdown(bets: Bet[]): BreakdownRow[] {
  const rows = aggregateBets(bets, b => timeBucketKey(new Date(b.date).getHours()), key => key);
  return rows.sort((a, b) => TIME_BUCKETS.findIndex(x => x.label === a.key) - TIME_BUCKETS.findIndex(x => x.label === b.key));
}

// ── Correlation breakdown ────────────────────────────────────────────────────
// Cross-tabulates two dimensions (e.g. tag × sport) to surface combinations
// that over/under-perform their single-dimension averages. Tags are
// multi-valued per bet, so a bet with 2 tags contributes to 2 combo rows —
// the same attribution tradeoff the single-dimension tag breakdown makes.
export type CorrelationDimension = 'sport' | 'bookmaker' | 'tag';

function dimensionKeys(bet: Bet, dim: CorrelationDimension): string[] {
  switch (dim) {
    case 'sport': return [betSportKey(bet)];
    case 'bookmaker': return bet.bookmaker?.trim() ? [bet.bookmaker.trim()] : [];
    case 'tag': return bet.tags && bet.tags.length > 0 ? bet.tags : [];
  }
}
function dimensionLabel(dim: CorrelationDimension, key: string): string {
  if (dim === 'sport') return key === 'mixed' ? 'Mixed' : SPORT_LABELS[key as SportType] ?? key;
  return key;
}

// minBets filters out noisy 1-2 bet combos that would otherwise dominate a
// ROI-sorted list with meaningless +/-100% outliers.
export function correlationBreakdown(
  bets: Bet[], dimA: CorrelationDimension, dimB: CorrelationDimension, minBets = 3
): BreakdownRow[] {
  const groups = new Map<string, Bet[]>();
  for (const bet of bets) {
    for (const a of dimensionKeys(bet, dimA)) {
      for (const b of dimensionKeys(bet, dimB)) {
        const key = `${a}|||${b}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(bet);
      }
    }
  }

  const rows: BreakdownRow[] = [];
  for (const [key, group] of groups) {
    if (group.length < minBets) continue;
    const [a, b] = key.split('|||');
    const settled = group.filter(x => x.result !== 'pending' && x.result !== 'void');
    const staked = group.reduce((s, x) => s + x.stake, 0);
    const returns = group.reduce((s, x) => s + (x.returns ?? 0), 0);
    const pnl = returns - staked;
    const won = group.filter(x => x.result === 'won').length;
    rows.push({
      key,
      label: `${dimensionLabel(dimA, a)} × ${dimensionLabel(dimB, b)}`,
      bets: group.length,
      staked,
      returns,
      pnl,
      units: toUnits(pnl),
      roi: staked > 0 ? (pnl / staked) * 100 : 0,
      winRate: settled.length > 0 ? (won / settled.length) * 100 : 0,
    });
  }
  return rows.sort((a, b) => b.units - a.units);
}

// ── Cumulative P&L series (for the Insights chart) ──────────────────────────
export interface PnlPoint { date: string; cumulativeUnits: number; label?: string }
export function cumulativePnlSeries(bets: Bet[]): PnlPoint[] {
  const settled = [...bets]
    .filter(b => b.result !== 'pending')
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));

  let running = 0;
  return settled.map(b => {
    running += toUnits((b.returns ?? 0) - b.stake);
    return { date: b.date, cumulativeUnits: running, label: b.title };
  });
}

// ── "On this day" retrospective ─────────────────────────────────────────────
export interface OnThisDayEntry { year: number; bets: Bet[]; pnlUnits: number }
export function onThisDay(bets: Bet[], today: Date = new Date()): OnThisDayEntry[] {
  const month = today.getMonth();
  const day = today.getDate();
  const currentYear = today.getFullYear();

  const byYear = new Map<number, Bet[]>();
  for (const b of bets) {
    const d = new Date(b.date);
    if (d.getMonth() !== month || d.getDate() !== day) continue;
    if (d.getFullYear() === currentYear) continue; // "on this day" means past years only
    const year = d.getFullYear();
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(b);
  }

  return Array.from(byYear.entries())
    .map(([year, yearBets]) => ({
      year,
      bets: yearBets,
      pnlUnits: toUnits(yearBets.reduce((s, b) => s + ((b.returns ?? 0) - b.stake), 0)),
    }))
    .sort((a, b) => b.year - a.year);
}

// ── Streaks & drawdown ───────────────────────────────────────────────────────
// Both walk settled bets oldest-to-newest so "current streak" / "current
// drawdown" reflect the most recent results.
export function computeStreaks(bets: Bet[]): StreakInfo {
  const settled = [...bets]
    .filter((b): b is Bet & { result: 'won' | 'lost' } => b.result === 'won' || b.result === 'lost')
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));

  let longestWin = 0, longestLoss = 0;
  let runType: 'won' | 'lost' | null = null, runLen = 0;

  for (const b of settled) {
    if (b.result === runType) {
      runLen++;
    } else {
      runType = b.result;
      runLen = 1;
    }
    if (runType === 'won') longestWin = Math.max(longestWin, runLen);
    else longestLoss = Math.max(longestLoss, runLen);
  }

  return {
    currentType: runType ?? 'none',
    currentLength: runLen,
    longestWin,
    longestLoss,
  };
}

export function computeDrawdown(bets: Bet[]): DrawdownInfo {
  const settled = [...bets]
    .filter(b => b.result !== 'pending')
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));

  let running = 0, peak = 0, maxDrawdown = 0, maxDrawdownPeak = 0;
  for (const b of settled) {
    running += toUnits((b.returns ?? 0) - b.stake);
    if (running > peak) peak = running;
    const dd = peak - running;
    if (dd > maxDrawdown) { maxDrawdown = dd; maxDrawdownPeak = peak; }
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
export function stakingPatternCheck(bets: Bet[]): StakingPatternResult {
  const settled = [...bets]
    .filter(b => b.result === 'won' || b.result === 'lost')
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));

  const afterWin: number[] = [];
  const afterLoss: number[] = [];
  for (let i = 1; i < settled.length; i++) {
    const prev = settled[i - 1];
    const stake = settled[i].stake;
    if (prev.result === 'won') afterWin.push(stake);
    else afterLoss.push(stake);
  }

  const avg = (arr: number[]) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
  const avgStakeAfterWin = avg(afterWin);
  const avgStakeAfterLoss = avg(afterLoss);

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
// Deliberately excludes day-of-week/time-of-day (those buckets are computed
// from the caller's local timezone client-side; a server-computed version
// here would silently use the server's timezone instead, and quietly diverge
// from what the UI shows).
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
    `By sport: ${sports.map(s => `${s.label} ${s.units >= 0 ? '+' : ''}${s.units.toFixed(2)}u over ${s.bets} bets`).join('; ') || 'n/a'}`,
    `By bet type: ${types.map(t => `${t.label} ${t.units >= 0 ? '+' : ''}${t.units.toFixed(2)}u over ${t.bets} bets`).join('; ') || 'n/a'}`,
  ];
  return lines.join('\n');
}
