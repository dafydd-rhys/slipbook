// Server-only. Thin client for TheOddsAPI (https://the-odds-api.com), used to
// capture closing-line prices for Closing Line Value (CLV) tracking. Free
// tier is 500 requests/month, and one request returns every upcoming event
// for a sport in one shot — so the budget lever is which (and how many)
// sport keys get queried, not per-event caching. See clvCapture.ts.
import { SportType } from './types';

// A small curated list of the most common league/tour keys per sport — full
// coverage of every competition would burn requests fast for marginal gain.
// Sports with no reasonable free-tier coverage map to an empty list; legs in
// those sports simply never get a closingOdds value.
export const SPORT_KEY_MAP: Partial<Record<SportType, string[]>> = {
  football: ['soccer_epl', 'soccer_uefa_champs_league', 'soccer_spain_la_liga', 'soccer_italy_serie_a', 'soccer_germany_bundesliga'],
  basketball: ['basketball_nba'],
  tennis: ['tennis_atp', 'tennis_wta'],
  baseball: ['baseball_mlb'],
  mma: ['mma_mixed_martial_arts'],
  boxing: ['boxing_boxing'],
};

interface OddsApiOutcome { name: string; price: number }
interface OddsApiMarket { key: string; outcomes: OddsApiOutcome[] }
interface OddsApiBookmaker { key: string; title: string; markets: OddsApiMarket[] }

export interface OddsApiEvent {
  id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsApiBookmaker[];
}

// One request per sport key — every upcoming event for that sport/region/market, in a single call.
export async function fetchSportOdds(sportKey: string, apiKey: string): Promise<OddsApiEvent[]> {
  const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=uk&markets=h2h&oddsFormat=decimal`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`TheOddsAPI request failed for ${sportKey}: ${res.status}`);
  }

  return res.json() as Promise<OddsApiEvent[]>;
}

// Normalizes a team/selection name for loose matching: lowercase, trimmed, punctuation stripped.
function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
}

// True if the given team name plausibly refers to one side of this event —
// substring containment either way, since bet matchups are freeform text
// ("Arsenal vs Chelsea") that won't always exactly match the API's team names.
function teamMatches(name: string, apiTeam: string): boolean {
  const normalizedName = normalize(name);
  const normalizedApiTeam = normalize(apiTeam);

  return normalizedName.length > 0 && (normalizedApiTeam.includes(normalizedName) || normalizedName.includes(normalizedApiTeam));
}

// Finds the event a bet's freeform matchup string refers to, splitting on the
// common separators bettors use ("vs", "v", "@", "-"). Best-effort — a
// matchup that doesn't resemble any returned event's teams simply isn't matched.
export function findMatchingEvent(matchup: string, events: OddsApiEvent[]): OddsApiEvent | null {
  const sides = matchup.split(/\s+(?:vs\.?|v\.?|@|-)\s+/i).map((side) => side.trim()).filter(Boolean);

  if (sides.length !== 2) {
    return null;
  }

  const [sideA, sideB] = sides;

  return events.find((event) =>
    (teamMatches(sideA, event.home_team) && teamMatches(sideB, event.away_team)) ||
    (teamMatches(sideA, event.away_team) && teamMatches(sideB, event.home_team))
  ) ?? null;
}

// The selection a bet leg backed, matched against this event's home/away team names.
function selectionSide(selection: string, event: OddsApiEvent): 'home' | 'away' | null {
  if (teamMatches(selection, event.home_team)) {
    return 'home';
  }

  if (teamMatches(selection, event.away_team)) {
    return 'away';
  }

  return null;
}

// Best (highest) decimal h2h price for the leg's selection across every
// returned UK bookmaker — the standard "best closing price available"
// definition, and simpler/more robust than matching one specific bookmaker's
// name against the API's bookmaker keys.
export function bestOddsForSelection(selection: string, event: OddsApiEvent): number | null {
  const side = selectionSide(selection, event);

  if (!side) {
    return null;
  }

  const teamName = side === 'home' ? event.home_team : event.away_team;
  const prices = event.bookmakers
    .flatMap((bookmaker) => bookmaker.markets)
    .filter((market) => market.key === 'h2h')
    .flatMap((market) => market.outcomes)
    .filter((outcome) => outcome.name === teamName)
    .map((outcome) => outcome.price);

  return prices.length > 0 ? Math.max(...prices) : null;
}
