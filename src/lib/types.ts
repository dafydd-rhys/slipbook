export type BetResult = 'won' | 'lost' | 'void' | 'pending';
export type OddsFormat = 'decimal' | 'fraction' | 'us';

export type BetType =
  | 'single'
  | 'double'
  | 'treble'
  | 'acca'
  | 'bet_builder'
  | 'each_way'
  | 'outright'
  | 'system'
  | 'lucky15'
  | 'lucky31'
  | 'lucky63';

export type SportType =
  | 'football'
  | 'tennis'
  | 'basketball'
  | 'esports'
  | 'cricket'
  | 'horse_racing'
  | 'golf'
  | 'rugby'
  | 'boxing'
  | 'mma'
  | 'darts'
  | 'other';

export type FilterType =
  | 'today'
  | 'week'
  | 'month'
  | 'year'
  | 'all'
  | 'biggest_win'
  | 'biggest_lose'
  | 'best_odds_win';

export interface BetSubLeg {
  id: string;
  selection: string;
  market: string;
  result: BetResult;
}

export interface SportOutcome {
  // Team sports (football, basketball, esports, rugby)
  homeScore?: number;
  awayScore?: number;
  matchStatus?: string; // FT, AET, Pens, OT, 2OT
  // Penalty shootout (when matchStatus === 'Pens')
  penaltyHomeScore?: number;
  penaltyAwayScore?: number;
  // Tennis / Darts
  sets?: string; // e.g. "6-4, 7-5, 3-6, 6-2"
  // Horse racing
  finishPosition?: string; // "1st", "2nd" etc.
  // Golf
  scoreToPar?: string; // "-12", "+3" etc.
  // Free-text for cricket / other, or when useText is toggled on
  resultText?: string;
  useText?: boolean;
}

export interface BetLeg {
  id: string;
  selection: string;
  market: string;
  matchup: string;
  odds: number;           // effective odds (boosted value if boosted)
  baseOdds?: number;      // original pre-boost odds
  result: BetResult;
  sport?: SportType;
  isBoosted?: boolean;
  isBetBuilder?: boolean;
  subLegs?: BetSubLeg[];  // nested selections inside a bet builder leg
  outcomeDecided?: boolean;
  outcome?: SportOutcome;
  // legacy flat fields (kept for backward compat)
  score?: string;
  homeTeam?: string;
  awayTeam?: string;
}

export interface Bet {
  id: string;
  date: string;
  title: string;
  type: BetType;
  legs: BetLeg[];
  totalOdds: number;       // effective total (boosted if applicable)
  baseTotalOdds?: number;  // pre-boost total odds
  isBoosted?: boolean;
  stake: number;
  result: BetResult;
  returns?: number;
  notes?: string;
}

export interface BetsData {
  bets: Bet[];
}

export interface BetStats {
  totalBets: number;
  won: number;
  lost: number;
  pending: number;
  totalStaked: number;
  totalReturns: number;
  pnl: number;
  roi: number;
  winRate: number;
  units: number;
}
