// Canonical spellings for common market synonyms. Different bookmakers/sports
// use different names for the same market (e.g. "Moneyline" vs "Match
// Winner"), which was splitting one market into several rows in
// marketBreakdown and skewing win-rate data. Only exact known synonyms are
// remapped — anything else passes through untouched.
//
// "Match Winner" (2-way, no draw) and "Match Result" (3-way, includes the
// draw) are kept as separate buckets on purpose: they are different markets,
// not spelling variants of each other.
const MARKET_ALIASES: Record<string, string> = {
  moneyline: 'Match Winner',
  'money line': 'Match Winner',
  '2-way winner': 'Match Winner',
  'two-way winner': 'Match Winner',
  'to win match': 'Match Winner',
  'to win': 'Match Winner',
  winner: 'Match Winner',

  '1x2': 'Match Result',
  'full time result': 'Match Result',
  'ft result': 'Match Result',
  'match odds': 'Match Result',
  'match winner (3-way)': 'Match Result',

  btts: 'Both Teams to Score',
  'both teams to score - yes': 'Both Teams to Score',

  'over 2.5 goals': 'Over 2.5 Goals',
  'over/under 2.5 goals': 'Over 2.5 Goals',
  'total goals over 2.5': 'Over 2.5 Goals',
  'under 2.5 goals': 'Under 2.5 Goals',
  'total goals under 2.5': 'Under 2.5 Goals',

  dnb: 'Draw No Bet',
  'draw no bet': 'Draw No Bet',

  handicap: 'Handicap',
  'asian handicap': 'Handicap',
  'point spread': 'Handicap',
  spread: 'Handicap',

  'correct score': 'Correct Score',

  'anytime scorer': 'Anytime Goalscorer',
  'anytime goalscorer': 'Anytime Goalscorer',
  'first goalscorer': 'First Goalscorer',
  'first scorer': 'First Goalscorer',

  outright: 'Outright Winner',
  'outright winner': 'Outright Winner',
  'tournament winner': 'Outright Winner',

  'set betting': 'Set Betting',
};

// Maps a freeform market string to its canonical spelling when it matches a
// known synonym; unrecognized strings are returned trimmed but unchanged.
export function canonicalMarket(market: string): string {
  const trimmed = market.trim();

  return MARKET_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}
