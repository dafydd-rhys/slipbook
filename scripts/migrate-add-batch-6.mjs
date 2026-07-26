import { Redis } from '@upstash/redis';
import { randomUUID } from 'crypto';

const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
if (!url || !token) {
  console.error('Missing UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN env vars.');
  process.exit(1);
}
const redis = new Redis({ url, token });

function leg(selection, market, matchup, odds, sport) {
  return { id: randomUUID(), selection, market, matchup, odds, result: 'pending', sport };
}

// Treble — odds not shown directly, calculated from legs (1.85*3.30*1.80 = 10.989, matches
// the displayed Returns/Stake ratio of 1098.89/100 = 10.9889 closely).
const legs = [
  leg('Golden State Valkyries -5.5', 'Points Handicap', 'Golden State Valkyries @ Connecticut Sun', 1.85, 'basketball'),
  leg('England -1', 'Match Handicap', 'Norway v England', 3.30, 'football'),
  leg('Karolina Muchova', 'Match Betting', 'Karolina Muchova v Linda Noskova', 1.80, 'tennis'),
];
const totalOdds = legs.reduce((acc, l) => acc * l.odds, 1);

const bet = {
  id: randomUUID(),
  date: '2026-07-11T09:00:00.000Z',
  title: 'Treble',
  type: 'treble',
  totalOdds: Math.round(totalOdds * 100) / 100,
  stake: 100,
  result: 'pending',
  legs,
};

const current = (await redis.get('bets')) ?? [];
current.unshift(bet);
await redis.set('bets', current);
console.log(`Inserted bet ${bet.id} ("${bet.title}", @${bet.totalOdds}, pending). Total bets now: ${current.length}`);
