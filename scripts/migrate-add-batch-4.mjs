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

// Genuinely pending — none of the 4 legs have lost (one is live and undecided, three haven't kicked off).
const legs = [
  leg('France -1', 'Match Handicap', 'France v Morocco', 2.62, 'football'),
  leg('Minnesota Lynx', 'Money Line', 'Minnesota Lynx v Connecticut Sun', 1.70, 'basketball'),
  leg('Linda Noskova', 'Match Betting', 'Marta Kostyuk v Linda Noskova', 2.20, 'tennis'),
  leg('Jannik Sinner', 'Match Betting', 'Jannik Sinner v Novak Djokovic', 1.22, 'tennis'),
];
const totalOdds = legs.reduce((acc, l) => acc * l.odds, 1); // odds not shown directly, calculated from legs

const bet = {
  id: randomUUID(),
  date: '2026-07-09T10:00:00.000Z',
  title: '4 Fold Acca',
  type: 'acca',
  totalOdds: Math.round(totalOdds * 100) / 100,
  stake: 100,
  result: 'pending',
  legs,
};

const current = (await redis.get('bets')) ?? [];
current.unshift(bet);
await redis.set('bets', current);
console.log(`Inserted bet ${bet.id} ("${bet.title}", @${bet.totalOdds}, pending). Total bets now: ${current.length}`);
