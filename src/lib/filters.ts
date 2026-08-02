// Advanced (non-date-range) tracker filters, saved filter presets, and the
// URL query-string encoding that makes a filtered view shareable as a link.
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
  search: '',
  sports: [],
  bookmakers: [],
  results: [],
  tags: [],
  oddsMin: '',
  oddsMax: '',
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

// True if any filter beyond the plain date range is set — used to decide
// whether to show the "Clear" button and the active-filter count badge.
export function hasActiveAdvancedFilters(filters: AdvancedFilters): boolean {
  return (
    !!filters.search ||
    filters.sports.length > 0 ||
    filters.bookmakers.length > 0 ||
    filters.results.length > 0 ||
    filters.tags.length > 0 ||
    !!filters.oddsMin ||
    !!filters.oddsMax
  );
}

// Whether the search text appears anywhere in the bet's title, notes,
// bookmaker, or any leg's selection/market/matchup.
function matchesSearch(bet: Bet, needle: string): boolean {
  const haystack = [
    bet.title,
    bet.notes ?? '',
    bet.bookmaker ?? '',
    ...bet.legs.flatMap((leg) => [leg.selection, leg.market, leg.matchup]),
  ].join(' ').toLowerCase();

  return haystack.includes(needle);
}

// Applies every advanced filter (search, sport, bookmaker, result, tag, odds
// range) on top of whatever date-range filter already ran.
export function applyAdvancedFilters(bets: Bet[], filters: AdvancedFilters): Bet[] {
  const search = filters.search.trim().toLowerCase();
  const min = filters.oddsMin ? parseFloat(filters.oddsMin) : null;
  const max = filters.oddsMax ? parseFloat(filters.oddsMax) : null;

  return bets.filter((bet) => {
    if (search && !matchesSearch(bet, search)) {
      return false;
    }

    if (filters.sports.length > 0 && !bet.legs.some((leg) => filters.sports.includes(leg.sport ?? 'other'))) {
      return false;
    }

    if (filters.bookmakers.length > 0 && !(bet.bookmaker && filters.bookmakers.includes(bet.bookmaker))) {
      return false;
    }

    if (filters.results.length > 0 && !filters.results.includes(bet.result)) {
      return false;
    }

    if (filters.tags.length > 0 && !(bet.tags && bet.tags.some((tag) => filters.tags.includes(tag)))) {
      return false;
    }

    if (min != null && bet.totalOdds < min) {
      return false;
    }

    if (max != null && bet.totalOdds > max) {
      return false;
    }

    return true;
  });
}

// Every distinct bookmaker in use, alphabetical — feeds the bookmaker filter chips.
export function uniqueBookmakers(bets: Bet[]): string[] {
  return Array.from(new Set(bets.map((bet) => bet.bookmaker).filter((bookmaker): bookmaker is string => !!bookmaker))).sort();
}

// Every distinct tag in use, alphabetical — feeds the tag filter chips.
export function uniqueTags(bets: Bet[]): string[] {
  return Array.from(new Set(bets.flatMap((bet) => bet.tags ?? []))).sort();
}

// ── URL query-string encoding for shareable filtered links ──────────────────

// Encodes the date range + advanced filters into query params, omitting
// anything at its default value so a plain "/" link stays a plain "/" link.
export function filtersToSearchParams(filter: string, adv: AdvancedFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filter !== 'last30') {
    params.set('range', filter);
  }

  if (adv.search) {
    params.set('q', adv.search);
  }

  if (adv.sports.length) {
    params.set('sport', adv.sports.join(','));
  }

  if (adv.bookmakers.length) {
    params.set('bookmaker', adv.bookmakers.join(','));
  }

  if (adv.results.length) {
    params.set('result', adv.results.join(','));
  }

  if (adv.tags.length) {
    params.set('tag', adv.tags.join(','));
  }

  if (adv.oddsMin) {
    params.set('oddsMin', adv.oddsMin);
  }

  if (adv.oddsMax) {
    params.set('oddsMax', adv.oddsMax);
  }

  return params;
}

// Reverses filtersToSearchParams — reconstructs the date range + advanced
// filters from a URL's query params, defaulting anything absent.
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
