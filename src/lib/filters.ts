import { Bet, BetResult, SportType } from './types';

export interface AdvancedFilters {
  search: string;
  sports: SportType[];
  bookmakers: string[];
  results: BetResult[];
  tags: string[];
  oddsMin: string;
  oddsMax: string;
}

export const EMPTY_ADVANCED_FILTERS: AdvancedFilters = {
  search: '', sports: [], bookmakers: [], results: [], tags: [], oddsMin: '', oddsMax: '',
};

// ── Saved filter presets ─────────────────────────────────────────────────────
export interface FilterPreset {
  id: string;
  name: string;
  range: string; // FilterType
  adv: AdvancedFilters;
}
export interface FilterPresetsData {
  presets: FilterPreset[];
}

export function hasActiveAdvancedFilters(f: AdvancedFilters): boolean {
  return !!f.search || f.sports.length > 0 || f.bookmakers.length > 0
    || f.results.length > 0 || f.tags.length > 0 || !!f.oddsMin || !!f.oddsMax;
}

function matchesSearch(bet: Bet, needle: string): boolean {
  const haystack = [
    bet.title, bet.notes ?? '', bet.bookmaker ?? '',
    ...bet.legs.flatMap(l => [l.selection, l.market, l.matchup]),
  ].join(' ').toLowerCase();
  return haystack.includes(needle);
}

export function applyAdvancedFilters(bets: Bet[], f: AdvancedFilters): Bet[] {
  const search = f.search.trim().toLowerCase();
  const min = f.oddsMin ? parseFloat(f.oddsMin) : null;
  const max = f.oddsMax ? parseFloat(f.oddsMax) : null;

  return bets.filter(bet => {
    if (search && !matchesSearch(bet, search)) return false;
    if (f.sports.length > 0 && !bet.legs.some(l => f.sports.includes(l.sport ?? 'other'))) return false;
    if (f.bookmakers.length > 0 && !(bet.bookmaker && f.bookmakers.includes(bet.bookmaker))) return false;
    if (f.results.length > 0 && !f.results.includes(bet.result)) return false;
    if (f.tags.length > 0 && !(bet.tags && bet.tags.some(t => f.tags.includes(t)))) return false;
    if (min != null && bet.totalOdds < min) return false;
    if (max != null && bet.totalOdds > max) return false;
    return true;
  });
}

export function uniqueBookmakers(bets: Bet[]): string[] {
  return Array.from(new Set(bets.map(b => b.bookmaker).filter((b): b is string => !!b))).sort();
}

export function uniqueTags(bets: Bet[]): string[] {
  return Array.from(new Set(bets.flatMap(b => b.tags ?? []))).sort();
}

// ── URL query-string encoding for shareable filtered links ──────────────────
export function filtersToSearchParams(filter: string, adv: AdvancedFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filter !== 'last30') params.set('range', filter);
  if (adv.search) params.set('q', adv.search);
  if (adv.sports.length) params.set('sport', adv.sports.join(','));
  if (adv.bookmakers.length) params.set('bookmaker', adv.bookmakers.join(','));
  if (adv.results.length) params.set('result', adv.results.join(','));
  if (adv.tags.length) params.set('tag', adv.tags.join(','));
  if (adv.oddsMin) params.set('oddsMin', adv.oddsMin);
  if (adv.oddsMax) params.set('oddsMax', adv.oddsMax);
  return params;
}

export function searchParamsToFilters(params: URLSearchParams): { range: string; adv: AdvancedFilters } {
  return {
    range: params.get('range') ?? 'last30',
    adv: {
      search: params.get('q') ?? '',
      sports: (params.get('sport')?.split(',').filter(Boolean) ?? []) as SportType[],
      bookmakers: params.get('bookmaker')?.split(',').filter(Boolean) ?? [],
      results: (params.get('result')?.split(',').filter(Boolean) ?? []) as BetResult[],
      tags: params.get('tag')?.split(',').filter(Boolean) ?? [],
      oddsMin: params.get('oddsMin') ?? '',
      oddsMax: params.get('oddsMax') ?? '',
    },
  };
}
