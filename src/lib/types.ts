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
  | 'baseball'
  | 'other';

export type FilterType =
  | 'last7'
  | 'last30'
  | 'last60'
  | 'last90'
  | 'year'
  | 'all';

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
  cashedOut?: boolean;
  notes?: string;
  bookmaker?: string;
  tags?: string[];
  deletedAt?: string; // soft-delete marker — set instead of removing, purged after a retention window
}

export interface BetsData {
  bets: Bet[];
}

// ── Bankroll ──────────────────────────────────────────────────────────────────
export type BankrollEntryType = 'deposit' | 'withdrawal' | 'adjustment';

export interface BankrollEntry {
  id: string;
  date: string;
  type: BankrollEntryType;
  amount: number; // real currency, always a positive magnitude — `type` determines sign
  note?: string;
}

export interface BankrollData {
  entries: BankrollEntry[];
}

export interface BankrollPoint {
  date: string;
  balance: number;
  label?: string; // set on deposit/withdrawal/adjustment points
}

// ── Bet templates ────────────────────────────────────────────────────────────
export interface BetTemplateLeg {
  selection: string;
  market: string;
  matchup: string;
  sport: SportType;
}

export interface BetTemplate {
  id: string;
  name: string;
  type: BetType;
  bookmaker?: string;
  legs: BetTemplateLeg[];
}

export interface BetTemplatesData {
  templates: BetTemplate[];
}

// ── Analytics ────────────────────────────────────────────────────────────────
export interface BreakdownRow {
  key: string;         // sport code / bet type / day name / odds bucket / etc.
  label: string;
  bets: number;
  staked: number;
  returns: number;
  pnl: number;
  units: number;
  roi: number;
  winRate: number; // 0-100, over settled (non-void, non-pending) bets
}

export interface StreakInfo {
  currentType: 'won' | 'lost' | 'none';
  currentLength: number;
  longestWin: number;
  longestLoss: number;
}

export interface DrawdownInfo {
  maxDrawdownUnits: number;
  maxDrawdownPct: number; // relative to the peak units at the time
  currentDrawdownUnits: number;
  peakUnits: number;
}

export interface BetStats {
  totalBets: number;
  pending: number;
  totalStaked: number;
  totalReturns: number;
  pnl: number;
  roi: number;
  units: number;
  stakedUnits: number;
  avgOdds: number;
}

// ── Goal tracking ────────────────────────────────────────────────────────────
export interface Goal {
  targetUnits: number;  // net units to reach, relative to startDate
  deadline: string;     // ISO date
  startDate: string;    // ISO date — progress is measured from here, not all-time
  note?: string;
  createdAt: string;
}
