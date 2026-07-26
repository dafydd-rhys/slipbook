import { Redis } from '@upstash/redis';
import { randomUUID } from 'crypto';

const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
if (!url || !token) {
  console.error('Missing UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN env vars.');
  process.exit(1);
}
const redis = new Redis({ url, token });

function leg(selection, market, matchup, odds, result, sport, opts = {}) {
  return { id: randomUUID(), selection, market, matchup, odds, result, sport, ...opts };
}

// These bets had one or more legs still pending/live when screenshotted, but since at least one
// leg had already lost, the whole accumulator is dead regardless of the remaining legs' outcome —
// so result is forced to 'lost' rather than left as 'pending'.
function deadAcca(title, date, stake, legs, opts = {}) {
  const totalOdds = opts.totalOdds ?? legs.reduce((acc, l) => acc * (l.baseOdds ?? l.odds), 1);
  return {
    id: randomUUID(),
    date,
    title,
    type: 'acca',
    totalOdds: opts.baseTotalOdds ? opts.totalOdds : totalOdds,
    baseTotalOdds: opts.baseTotalOdds,
    isBoosted: opts.isBoosted,
    stake,
    result: 'lost',
    returns: 0,
    legs,
  };
}

const bets = [
  // 6 legs; France leg hadn't kicked off yet, but 4 other legs already lost.
  deadAcca('6 Fold Acca', '2026-07-07T08:00:00.000Z', 100, [
    leg('Naomi Osaka', 'Match Winner', 'Naomi Osaka v Karolina Muchova', 1.68, 'lost', 'tennis'),
    leg('Novak Djokovic', 'Match Winner', 'Felix Auger Aliassime v Novak Djokovic', 1.58, 'won', 'tennis'),
    leg('Colombia', 'To Win the Tie', 'Switzerland v Colombia', 1.62, 'lost', 'football'),
    leg('New York Liberty', 'Match Winner (incl. OT)', 'Dallas Wings @ New York Liberty', 1.52, 'lost', 'basketball'),
    leg('Flavio Cobolli', 'Match Winner', 'Flavio Cobolli v Arthur Fery', 1.35, 'lost', 'tennis'),
    leg('France', 'Match Winner - (Normal Time)', 'France v Morocco', 1.58, 'pending', 'football'),
  ]),

  // Fully resolved, all 4 legs lost - straightforward loss (no pending legs), just previously missed.
  deadAcca('4 Fold Acca', '2026-07-07T06:04:31.000Z', 100, [
    leg('Egypt', 'Match Winner - (Normal Time)', 'Argentina v Egypt', 3.30, 'lost', 'football'),
    leg('Colombia', 'To Win the Tie', 'Switzerland v Colombia', 1.58, 'lost', 'football'),
    leg('New York Liberty', 'Match Winner (incl. OT)', 'Dallas Wings @ New York Liberty', 1.53, 'lost', 'basketball'),
    leg('Flavio Cobolli', 'Match Winner', 'Flavio Cobolli v Arthur Fery', 1.32, 'lost', 'tennis'),
  ]),

  deadAcca('5 Fold Acca', '2026-07-08T12:56:50.000Z', 90, [
    leg('New York Liberty -3.5', 'Handicap -3.5', 'Dallas Wings @ New York Liberty', 1.78, 'lost', 'basketball'),
    leg('Flavio Cobolli', 'Match Winner', 'Flavio Cobolli v Arthur Fery', 1.35, 'lost', 'tennis'),
    leg('Taylor Fritz', 'Match Winner', 'Taylor Fritz v Alexander Zverev', 1.88, 'lost', 'tennis'),
    leg('France', 'Match Winner - (Normal Time)', 'France v Morocco', 1.58, 'pending', 'football'),
    leg('Jannik Sinner', 'Match Winner', 'Jannik Sinner v Novak Djokovic', 1.22, 'pending', 'tennis'),
  ]),

  deadAcca('5 Fold Acca', '2026-07-08T01:36:20.000Z', 150, [
    leg('Marta Kostyuk', 'Match Winner', 'Marta Kostyuk v Jasmine Paolini', 1.37, 'won', 'tennis', { isBoosted: true }),
    leg('Flavio Cobolli', 'Match Winner', 'Flavio Cobolli v Arthur Fery', 1.33, 'lost', 'tennis'),
    leg('Golden State Valkyries', 'Match Winner (incl. OT)', 'Golden State Valkyries @ Toronto Tempo', 1.33, 'pending', 'basketball'),
    leg('Karolina Muchova', 'Match Winner', 'Karolina Muchova v Coco Gauff', 1.90, 'pending', 'tennis'),
    leg('France -1', 'Handicap -1', 'France v Morocco', 2.60, 'pending', 'football'),
  ], { isBoosted: true, baseTotalOdds: 11.97, totalOdds: 12.61 }),
];

const current = (await redis.get('bets')) ?? [];
for (const bet of bets) current.unshift(bet);
await redis.set('bets', current);
console.log(`Inserted ${bets.length} bets. Total bets now: ${current.length}`);
