// Server-only. The scheduled job that captures Closing Line Value snapshots —
// see oddsApi.ts for the TheOddsAPI client and docs/README for the free-tier
// request budget this is designed around. No-ops entirely if THE_ODDS_API_KEY
// isn't set, so it's a safe default in every deployment.
import { Bet, BetLeg } from './types';
import { readBets, updateBet, readOddsApiUsage, incrementOddsApiUsage } from './storage';
import { canonicalMarket } from './marketAliases';
import { SPORT_KEY_MAP, fetchSportOdds, findMatchingEvent, bestOddsForSelection, OddsApiEvent } from './oddsApi';

const MONTHLY_LIMIT = 500;
const SAFETY_MARGIN = 20; // stop before the free tier is fully exhausted, leaving headroom for the rest of the month
const RECAPTURE_EVENT_WINDOW_HOURS = 6; // how far past an event's start we'll still treat its price as "closing" and keep updating it

export interface ClvCaptureResult {
  ran: boolean;
  requestsUsed: number;
  legsUpdated: number;
  reason?: string;
}

// A leg is worth capturing a closing price for if it's a Match Winner/Result
// bet (the only market TheOddsAPI's free tier covers cheaply), still pending,
// and its bet's event hasn't clearly finished yet.
function isEligibleLeg(bet: Bet, leg: BetLeg): boolean {
  if (leg.result !== 'pending' || !leg.sport) {
    return false;
  }

  const market = canonicalMarket(leg.market);

  if (market !== 'Match Winner' && market !== 'Match Result') {
    return false;
  }

  const eventTime = new Date(bet.date).getTime();

  return eventTime > Date.now() - RECAPTURE_EVENT_WINDOW_HOURS * 60 * 60 * 1000;
}

export async function runClvCapture(): Promise<ClvCaptureResult> {
  if (!process.env.THE_ODDS_API_KEY) {
    return { ran: false, requestsUsed: 0, legsUpdated: 0, reason: 'THE_ODDS_API_KEY not set' };
  }

  const apiKey = process.env.THE_ODDS_API_KEY;
  const { bets } = await readBets();

  // Sports worth querying this tick — only ones with at least one eligible leg.
  const sportsInPlay = new Set<string>();

  for (const bet of bets) {
    for (const leg of bet.legs) {
      if (isEligibleLeg(bet, leg) && leg.sport && SPORT_KEY_MAP[leg.sport]?.length) {
        sportsInPlay.add(leg.sport);
      }
    }
  }

  if (sportsInPlay.size === 0) {
    return { ran: true, requestsUsed: 0, legsUpdated: 0, reason: 'no eligible pending Match Winner/Result legs' };
  }

  const usage = await readOddsApiUsage();
  let requestsUsed = 0;
  const eventsBySportKey = new Map<string, OddsApiEvent[]>();

  sportKeyLoop: for (const sport of sportsInPlay) {
    for (const sportKey of SPORT_KEY_MAP[sport as keyof typeof SPORT_KEY_MAP] ?? []) {
      if (usage.count + requestsUsed >= MONTHLY_LIMIT - SAFETY_MARGIN) {
        break sportKeyLoop;
      }

      try {
        const events = await fetchSportOdds(sportKey, apiKey);

        eventsBySportKey.set(sportKey, events);
        requestsUsed++;
      } catch {
        // A single sport-key failure (rate limit, transient network issue) shouldn't abort the whole tick.
      }
    }
  }

  if (requestsUsed > 0) {
    await incrementOddsApiUsage(requestsUsed);
  }

  const allEvents = Array.from(eventsBySportKey.values()).flat();
  let legsUpdated = 0;

  for (const bet of bets) {
    let betChanged = false;

    const legs = bet.legs.map((leg) => {
      if (!isEligibleLeg(bet, leg) || !leg.sport || !SPORT_KEY_MAP[leg.sport]?.length) {
        return leg;
      }

      const event = findMatchingEvent(leg.matchup, allEvents);
      const price = event ? bestOddsForSelection(leg.selection, event) : null;

      if (price == null) {
        return leg;
      }

      betChanged = true;
      legsUpdated++;

      return { ...leg, closingOdds: price, closingOddsCapturedAt: new Date().toISOString() };
    });

    if (betChanged) {
      await updateBet(bet.id, { legs });
    }
  }

  return { ran: true, requestsUsed, legsUpdated };
}
