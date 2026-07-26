import { Redis } from '@upstash/redis';
import { randomUUID } from 'crypto';

const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
if (!url || !token) {
  console.error('Missing UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN env vars.');
  process.exit(1);
}
const redis = new Redis({ url, token });

function leg(selection, market, matchup, odds, result, sport) {
  return { id: randomUUID(), selection, market, matchup, odds, result, sport };
}

// Bet A - genuinely all-pending (2 legs live but undecided, 2 not yet started).
const legsA = [
  leg('Portland Fire +13.5', 'Points Handicap', 'Portland Fire @ Atlanta Dream', 1.85, 'pending', 'basketball'),
  leg('New York Yankees', 'Money Line', 'New York Yankees @ Washington Nationals', 1.50, 'pending', 'baseball'),
  leg('England', '90 Minutes', 'Norway v England', 1.91, 'pending', 'football'),
  leg('Max Holloway', 'Bout Betting', 'Conor McGregor v Max Holloway', 1.44, 'pending', 'mma'),
];
const totalOddsA = legsA.reduce((acc, l) => acc * l.odds, 1);

const betA = {
  id: randomUUID(),
  date: '2026-07-11T08:00:00.000Z',
  title: '4 Fold Acca',
  type: 'acca',
  totalOdds: Math.round(totalOddsA * 100) / 100,
  stake: 100,
  result: 'pending',
  legs: legsA,
};

// Bet B - 2 legs already lost, so the whole acca is dead even though 3 legs haven't kicked off yet.
const betB = {
  id: randomUUID(),
  date: '2026-07-11T03:50:36.000Z',
  title: '5 Fold Acca',
  type: 'acca',
  totalOdds: 14.33,
  baseTotalOdds: 13.51,
  isBoosted: true,
  stake: 100,
  result: 'lost',
  returns: 0,
  legs: [
    leg('Karolina Muchova', 'Match Winner', 'Karolina Muchova v Linda Noskova', 1.60, 'lost', 'tennis'),
    leg('Under 173.5', 'Total Points U/O 173.5', 'New York Liberty @ Minnesota Lynx', 1.85, 'lost', 'basketball'),
    leg('Minnesota Twins', 'Match Winner', 'Los Angeles Angels @ Minnesota Twins', 1.58, 'pending', 'baseball'),
    leg('New York Yankees', 'Match Winner', 'New York Yankees @ Washington Nationals', 1.52, 'pending', 'baseball'),
    leg('England', 'Match Winner - (Normal Time)', 'Norway v England', 1.90, 'pending', 'football'),
  ],
};

const current = (await redis.get('bets')) ?? [];
current.unshift(betA);
current.unshift(betB);
await redis.set('bets', current);
console.log(`Inserted 2 bets. Total bets now: ${current.length}`);
