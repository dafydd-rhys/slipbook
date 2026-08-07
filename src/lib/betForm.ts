// Form-shaped state for the admin "Add/Edit Bet" screen, and the pure
// conversions between that form state and a real `Bet`. Kept separate from
// the form component so the odds/result math can be unit-tested and reused
// (e.g. by the screenshot/text import flow) without a React tree.
import { Bet, BetLeg, BetResult, BetSubLeg, BetType, SportOutcome, SportType } from './types';
import { autoTitle, LAST_SPORT_KEY } from './betFormOptions';
import { canonicalMarket } from './marketAliases';

export type LegForm = {
  selection: string; market: string; matchup: string;
  odds: string;          // base odds (always shown)
  oddsTouched: boolean;  // once true, stops mirroring the main "Total Odds" field
  boostedOdds: string;   // effective boosted odds (shown when isBoosted)
  isBoosted: boolean;
  result: BetResult; sport: SportType;
  isBetBuilder: boolean; subLegs: Omit<BetSubLeg, 'id'>[];
  outcomeDecided: boolean; outcome: SportOutcome;
};

export type BetForm = {
  date: string; title: string; type: BetType;
  odds: string;          // base odds (always shown) — "Total Odds" / "Base Odds"
  oddsAutoCalc: boolean;  // when true, odds is derived live from the product of legs' base odds
  boostedOdds: string;   // effective boosted odds (shown when isBoosted) — "Boosted Odds"
  boostedOddsAutoCalc: boolean; // when true, boostedOdds is derived live from legs' boosted-aware odds
  isBoosted: boolean;
  stake: string; result: BetResult; returns: string; notes: string;
  cashedOut: boolean; // when true (and result is 'won'), `returns` is a manually entered cash-out amount
  bookmaker: string;
  tags: string; // comma-separated in the form, split into Bet.tags on save
  legs: LegForm[];
};

// Sport used for the last-added leg, remembered per-device so a new leg
// defaults to whatever sport was picked most recently.
function lastUsedSport(): SportType {
  if (typeof window === 'undefined') {
    return 'football';
  }

  return (localStorage.getItem(LAST_SPORT_KEY) as SportType | null) ?? 'football';
}

// A blank leg, seeded with the last-used sport and (optionally) the form's current odds.
export function emptyLeg(sport?: SportType, odds?: string): LegForm {
  return {
    selection: '', market: 'Match Result', matchup: '', odds: odds ?? '1.50', oddsTouched: false, boostedOdds: '',
    isBoosted: false, result: 'pending', sport: sport ?? lastUsedSport(),
    isBetBuilder: false, subLegs: [], outcomeDecided: false, outcome: {},
  };
}

// A blank form for a new bet, defaulting to today's date-time and a single empty leg.
export function emptyForm(): BetForm {
  const odds = '2.00';

  return {
    date: new Date().toISOString().slice(0, 16),
    title: autoTitle('acca'), type: 'acca',
    odds, oddsAutoCalc: false, boostedOdds: '', boostedOddsAutoCalc: false, isBoosted: false,
    stake: '10', result: 'pending', returns: '', notes: '', cashedOut: false,
    bookmaker: '', tags: '',
    legs: [emptyLeg(undefined, odds)],
  };
}

// Base odds auto-calc — ignores per-leg boosts, ignores void legs.
export function computeBaseOddsFromLegs(legs: LegForm[]): string {
  const total = legs.reduce((product, leg) => {
    if (leg.result === 'void') {
      return product;
    }

    return product * (parseFloat(leg.odds) || 1);
  }, 1);

  return total.toFixed(2);
}

// Boosted odds auto-calc — uses each leg's boosted price if that leg is boosted, ignores void legs.
export function computeBoostedOddsFromLegs(legs: LegForm[]): string {
  const total = legs.reduce((product, leg) => {
    if (leg.result === 'void') {
      return product;
    }

    const legOdds = leg.isBoosted && leg.boostedOdds ? (parseFloat(leg.boostedOdds) || 1) : parseFloat(leg.odds) || 1;

    return product * legOdds;
  }, 1);

  return total.toFixed(2);
}

// Overall bet result from leg results: any lost leg loses the whole bet; otherwise
// any leg still pending keeps the bet pending; all-void legs void the bet; else won.
export function computeBetResult(legResults: BetResult[]): BetResult {
  if (legResults.some((result) => result === 'lost')) {
    return 'lost';
  }

  if (legResults.some((result) => result === 'pending')) {
    return 'pending';
  }

  if (legResults.every((result) => result === 'void')) {
    return 'void';
  }

  return 'won';
}

// Auto-calculated returns for a "Won" bet — stake × effective total odds (boosted if applicable).
export function computeWinReturns(form: BetForm): number {
  const effectiveOdds = form.isBoosted && form.boostedOdds
    ? (parseFloat(form.boostedOdds) || 1) : parseFloat(form.odds) || 1;

  return (parseFloat(form.stake) || 0) * effectiveOdds;
}

// Converts one form leg into a real BetLeg, resolving its effective/base odds
// and assigning fresh ids to it (and its sub-legs, if it's a bet builder).
function buildBetLeg(leg: LegForm, formOdds: string, index: number): BetLeg {
  const legOdds = leg.odds || formOdds;
  const effectiveOdds = leg.isBoosted && leg.boostedOdds
    ? (parseFloat(leg.boostedOdds) || 1) : parseFloat(legOdds) || 1;
  const parsedBaseOdds = leg.isBoosted && legOdds ? parseFloat(legOdds) : NaN;
  const baseOdds = Number.isFinite(parsedBaseOdds) ? parsedBaseOdds : undefined;

  return {
    id: `leg-${Date.now()}-${index}`,
    selection: leg.selection || 'Selection',
    market: leg.market ? canonicalMarket(leg.market) : 'Market',
    matchup: leg.matchup,
    odds: effectiveOdds,
    baseOdds,
    isBoosted: leg.isBoosted,
    result: leg.result,
    sport: leg.sport,
    isBetBuilder: leg.isBetBuilder,
    subLegs: leg.isBetBuilder ? leg.subLegs.map((subLeg, subIndex) => ({ ...subLeg, id: `sl-${Date.now()}-${subIndex}` })) : undefined,
    outcomeDecided: leg.outcomeDecided,
    outcome: leg.outcomeDecided ? leg.outcome : undefined,
  };
}

// Converts the whole form into a real Bet, ready to POST/PUT to the API.
export function buildBet(form: BetForm, id: string = 'preview'): Bet {
  const effectiveTotalOdds = form.isBoosted && form.boostedOdds
    ? (parseFloat(form.boostedOdds) || 1) : parseFloat(form.odds) || 1;
  const parsedBaseTotalOdds = form.isBoosted && form.odds ? parseFloat(form.odds) : NaN;
  const baseTotalOdds = Number.isFinite(parsedBaseTotalOdds) ? parsedBaseTotalOdds : undefined;
  const tags = form.tags.split(',').map((tag) => tag.trim()).filter(Boolean);

  return {
    id,
    date: new Date(form.date).toISOString(),
    title: form.title || 'Untitled',
    type: form.type,
    totalOdds: effectiveTotalOdds,
    baseTotalOdds,
    isBoosted: form.isBoosted,
    stake: parseFloat(form.stake) || 0,
    result: form.result,
    returns: form.result === 'won'
      ? (form.cashedOut ? parseFloat(form.returns) || 0 : computeWinReturns(form))
      : form.result === 'lost' ? 0 : undefined,
    cashedOut: form.result === 'won' && form.cashedOut ? true : undefined,
    notes: form.notes || undefined,
    bookmaker: form.bookmaker.trim() || undefined,
    tags: tags.length ? tags : undefined,
    legs: form.legs.map((leg, index) => buildBetLeg(leg, form.odds, index)),
  };
}
