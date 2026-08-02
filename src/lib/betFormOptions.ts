// Static dropdown/preset data for the admin "Add Bet" form.
import { BetType, SportType } from './types';

export const BET_TYPES: { value: BetType; label: string }[] = [
  { value: 'acca',        label: 'Accumulator' },
  { value: 'single',      label: 'Single' },
  { value: 'double',      label: 'Double' },
  { value: 'treble',      label: 'Treble' },
  { value: 'bet_builder', label: 'Bet Builder' },
  { value: 'each_way',    label: 'Each Way' },
  { value: 'outright',    label: 'Outright' },
  { value: 'system',      label: 'System Bet' },
  { value: 'lucky15',     label: 'Lucky 15' },
  { value: 'lucky31',     label: 'Lucky 31' },
  { value: 'lucky63',     label: 'Lucky 63' },
];

// Default bet title from its type, e.g. 'acca' -> "Accumulator".
export function autoTitle(type: BetType): string {
  return BET_TYPES.find((option) => option.value === type)?.label ?? 'Bet';
}

export const SPORTS: { value: SportType; code: string; label: string }[] = [
  { value: 'football',     code: 'FB', label: 'Football' },
  { value: 'tennis',       code: 'TN', label: 'Tennis' },
  { value: 'basketball',   code: 'BK', label: 'Basketball' },
  { value: 'esports',      code: 'ES', label: 'Esports / CS' },
  { value: 'cricket',      code: 'CR', label: 'Cricket' },
  { value: 'horse_racing', code: 'HR', label: 'Horse Racing' },
  { value: 'golf',         code: 'GL', label: 'Golf' },
  { value: 'rugby',        code: 'RG', label: 'Rugby' },
  { value: 'boxing',       code: 'BX', label: 'Boxing' },
  { value: 'mma',          code: 'MM', label: 'MMA' },
  { value: 'darts',        code: 'DA', label: 'Darts' },
  { value: 'baseball',     code: 'BB', label: 'Baseball' },
  { value: 'other',        code: 'OT', label: 'Other' },
];

export const COMMON_MARKETS = [
  'Match Result', 'Both Teams to Score', 'Over 2.5 Goals', 'Under 2.5 Goals',
  'Correct Score', 'Anytime Goalscorer', 'First Goalscorer', 'Double Chance',
  'Draw No Bet', 'Handicap', 'Outright Winner', 'Set Betting', 'To Win Match',
];

export const STAKE_PRESETS = ['10', '50', '100', '200'];

// Sport picked for the last-added leg, remembered so a new leg defaults to it.
export const LAST_SPORT_KEY = 'slipbook_last_sport';
