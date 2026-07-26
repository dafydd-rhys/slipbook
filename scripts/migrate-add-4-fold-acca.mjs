import { Redis } from '@upstash/redis';
import { randomUUID } from 'crypto';

const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
if (!url || !token) {
  console.error('Missing UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN env vars.');
  process.exit(1);
}
const redis = new Redis({ url, token });

const bet = {
  id: randomUUID(),
  date: '2026-06-23T01:01:07.000Z',
  title: '4 Fold Acca',
  type: 'acca',
  totalOdds: 8.47,
  baseTotalOdds: 8.36,
  isBoosted: true,
  stake: 100,
  result: 'lost',
  returns: 0,
  legs: [
    {
      id: randomUUID(),
      selection: 'Norway',
      market: 'Match Winner - (Normal Time)',
      matchup: 'Norway v Senegal',
      odds: 2.46,
      isBoosted: true,
      result: 'won',
      sport: 'football',
      outcomeDecided: true,
      outcome: { homeScore: 3, awayScore: 2, matchStatus: 'FT' },
    },
    {
      id: randomUUID(),
      selection: 'Dallas Wings -9.5',
      market: 'Handicap +9.5',
      matchup: 'Dallas Wings @ Seattle Storm',
      odds: 1.90,
      result: 'lost',
      sport: 'basketball',
      outcomeDecided: true,
      outcome: { homeScore: 112, awayScore: 110, matchStatus: 'FT' },
    },
    {
      id: randomUUID(),
      selection: 'Algeria',
      market: 'Match Winner - (Normal Time)',
      matchup: 'Jordan v Algeria',
      odds: 1.49,
      isBoosted: true,
      result: 'won',
      sport: 'football',
      outcomeDecided: true,
      outcome: { homeScore: 1, awayScore: 2, matchStatus: 'FT' },
    },
    {
      id: randomUUID(),
      selection: 'England',
      market: 'Match Winner - (Normal Time)',
      matchup: 'England v Ghana',
      odds: 1.20,
      result: 'lost',
      sport: 'football',
      outcomeDecided: true,
      outcome: { homeScore: 0, awayScore: 0, matchStatus: 'FT' },
    },
  ],
};

const current = (await redis.get('bets')) ?? [];
current.unshift(bet);
await redis.set('bets', current);
console.log(`Inserted bet ${bet.id} ("${bet.title}"). Total bets now: ${current.length}`);
