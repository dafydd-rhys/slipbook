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

const bet = {
  id: randomUUID(),
  date: '2026-07-10T07:30:22.000Z',
  title: '4 Fold Acca',
  type: 'acca',
  totalOdds: 24.05,
  baseTotalOdds: 22.59,
  isBoosted: true,
  stake: 150,
  result: 'pending',
  legs: [
    leg('No', 'Both Teams To Score', 'Spain v Belgium', 2.05, 'football'),
    leg('Golden State Valkyries -4.5', 'Handicap +4.5', 'Golden State Valkyries @ Connecticut Sun', 1.72, 'basketball'),
    leg('Karolina Muchova', 'Match Winner', 'Karolina Muchova v Linda Noskova', 1.78, 'tennis'),
    leg('Draw', 'Match Winner - (Normal Time)', 'Norway v England', 3.60, 'football'),
  ],
};

const current = (await redis.get('bets')) ?? [];
current.unshift(bet);
await redis.set('bets', current);
console.log(`Inserted bet ${bet.id} ("${bet.title}", @${bet.totalOdds}, pending). Total bets now: ${current.length}`);
