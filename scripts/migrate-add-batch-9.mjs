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

function acca(title, type, date, stake, legs, opts = {}) {
  const totalOdds = opts.totalOdds ?? legs.reduce((acc, l) => {
    if (l.result === 'void') return acc;
    return acc * (l.isBoosted && l.boostedOdds ? l.boostedOdds : l.odds);
  }, 1);
  const anyLost = legs.some(l => l.result === 'lost');
  const anyPending = legs.some(l => l.result === 'pending');
  const result = opts.result ?? (anyLost ? 'lost' : anyPending ? 'pending' : 'won');
  return {
    id: randomUUID(),
    date,
    title,
    type,
    totalOdds: Math.round(totalOdds * 100) / 100,
    baseTotalOdds: opts.baseTotalOdds,
    isBoosted: opts.isBoosted,
    stake,
    result,
    returns: opts.returns !== undefined ? opts.returns : (result === 'lost' ? 0 : undefined),
    legs,
  };
}

const bets = [
  // 1. Treble @8.55 - lost
  acca('Treble', 'treble', '2026-07-26T07:59:24.000Z', 188, [
    leg('Handicap Gerwyn Price +7.5', 'Handicap -7.5', 'Luke Littler v Gerwyn Price', 1.82, 'lost', 'darts'),
    leg('Los Angeles Angels', 'Match Winner', 'Los Angeles Angels @ San Francisco Giants', 1.88, 'won', 'baseball'),
    leg('New York Yankees', 'Match Winner', 'New York Yankees @ Philadelphia Phillies', 2.50, 'lost', 'baseball'),
  ]),

  // 2. Treble @6.01 (base 5.51) - lost
  acca('Treble', 'treble', '2026-07-27T07:34:23.000Z', 100, [
    leg('Seattle Mariners', 'Match Winner', 'Seattle Mariners @ Texas Rangers', 1.78, 'lost', 'baseball'),
    leg('Washington Nationals', 'Match Winner', 'Toronto Blue Jays @ Washington Nationals', 1.80, 'lost', 'baseball'),
    leg('Ashlyn Krueger', 'Match Winner', 'Ashlyn Krueger v Katie Boulter', 1.72, 'won', 'tennis', { isBoosted: true }),
  ], { isBoosted: true, baseTotalOdds: 5.51, totalOdds: 6.01 }),

  // 3. 5 Fold Acca @14.42 (not boosted) - lost
  acca('5 Fold Acca', 'acca', '2026-07-27T10:25:40.000Z', 50, [
    leg('Washington Nationals', 'Match Winner', 'Toronto Blue Jays @ Washington Nationals', 1.80, 'lost', 'baseball'),
    leg('Atlanta Braves', 'Match Winner', 'Atlanta Braves @ New York Mets', 1.90, 'lost', 'baseball'),
    leg('Ashlyn Krueger', 'Match Winner', 'Ashlyn Krueger v Katie Boulter', 1.60, 'won', 'tennis'),
    leg('New York Yankees', 'Match Winner', 'New York Yankees @ Chicago White Sox', 1.70, 'won', 'baseball'),
    leg('Boston Red Sox', 'Match Winner', 'Boston Red Sox @ Athletics', 1.55, 'won', 'baseball'),
  ]),

  // 4. 5 Fold Acca @147.62 (not boosted) - date not shown, estimated. Stake £10.
  acca('5 Fold Acca', 'acca', '2026-07-28T09:00:00.000Z', 10, [
    leg('Andreas Harrysson', 'Match Result', 'Richie Burnett v Andreas Harrysson', 1.44, 'lost', 'darts'),
    leg('Western Sydney Wanderers', 'Match Winner - (Normal Time)', 'Western Sydney Wanderers v Chelsea', 19.00, 'lost', 'football'),
    leg('Robert Thornton', 'Match Result', 'Robert Thornton v Richie Burnett', 1.75, 'lost', 'darts'),
    leg('Xinyu Wang', 'Match Winner', 'Julieta Pareja v Xinyu Wang', 1.64, 'won', 'tennis'),
    leg('Under 9.5', 'Pick Your Own Total', 'Boston Red Sox @ Athletics', 1.88, 'won', 'baseball'),
  ]),

  // 5. 4 Fold Acca @7.90 (base 7.80) - lost
  acca('4 Fold Acca', 'acca', '2026-07-28T09:30:11.000Z', 140, [
    leg('Andreas Harrysson', 'Match Result', 'Richie Burnett v Andreas Harrysson', 1.45, 'lost', 'darts'),
    leg('Robert Thornton', 'Match Result', 'Robert Thornton v Richie Burnett', 1.75, 'lost', 'darts'),
    leg('Xinyu Wang', 'Match Winner', 'Julieta Pareja v Xinyu Wang', 1.61, 'won', 'tennis', { isBoosted: true }),
    leg('Under 9.5', 'Pick Your Own Total', 'Boston Red Sox @ Athletics', 1.91, 'won', 'baseball', { isBoosted: true }),
  ], { isBoosted: true, baseTotalOdds: 7.80, totalOdds: 7.90 }),

  // 6. 4 Fold Acca @9.27 - all WON
  acca('4 Fold Acca', 'acca', '2026-07-29T05:48:09.000Z', 100, [
    leg('Alex De Minaur', 'Match Winner', 'Alex De Minaur v Stefanos Tsitsipas', 1.76, 'won', 'tennis', { isBoosted: true }),
    leg('Dallas Wings +2.5', 'Handicap +2.5', 'Atlanta Dream @ Dallas Wings', 1.71, 'won', 'basketball', { isBoosted: true }),
    leg('Under 10.5', 'Pick Your Own Total', 'Boston Red Sox @ Athletics', 1.89, 'won', 'baseball', { isBoosted: true }),
    leg('Las Vegas Aces', 'Match Winner (incl. OT)', 'New York Liberty @ Las Vegas Aces', 1.63, 'won', 'basketball', { isBoosted: true }),
  ], { isBoosted: true, totalOdds: 9.27, returns: 927.00 }),

  // 7. Single (darts) - won
  {
    id: randomUUID(), date: '2026-07-31T02:49:05.000Z', title: 'Single', type: 'single',
    totalOdds: 1.82, stake: 127, result: 'won', returns: 231.14,
    legs: [leg('Keegan Brown', 'Match Result', 'Scott Campbell v Keegan Brown', 1.82, 'won', 'darts')],
  },

  // 8. Single (darts) - won, staked using the winnings from bet 7
  {
    id: randomUUID(), date: '2026-07-31T03:50:59.000Z', title: 'Single', type: 'single',
    totalOdds: 1.68, stake: 231.14, result: 'won', returns: 388.32,
    legs: [leg('Steve West', 'Match Result', 'Steve West v Scott Campbell', 1.68, 'won', 'darts')],
  },

  // 9. Single - lost (Bet365-style entry)
  {
    id: randomUUID(), date: '2026-07-28T10:34:00.000Z', title: 'Single', type: 'single',
    totalOdds: 2.30, stake: 100, result: 'lost', returns: 0,
    legs: [leg('Scott Mitchell', 'Match Betting Live', 'Scott Mitchell v Steve West', 2.30, 'lost', 'darts')],
  },

  // 10. Single - lost
  {
    id: randomUUID(), date: '2026-07-28T10:50:00.000Z', title: 'Single', type: 'single',
    totalOdds: 1.80, stake: 100, result: 'lost', returns: 0,
    legs: [leg('Robert Thornton', 'Match Betting', 'Robert Thornton v Richie Burnett', 1.80, 'lost', 'darts')],
  },

  // 11. 5 Fold Acca (Fivefold) - lost
  acca('5 Fold Acca', 'acca', '2026-07-28T17:49:00.000Z', 100, [
    leg('Miami Marlins', 'Money Line', 'Philadelphia Phillies @ Miami Marlins', 1.91, 'won', 'baseball'),
    leg('Cincinnati Reds', 'Money Line', 'Cleveland Guardians @ Cincinnati Reds', 1.57, 'lost', 'baseball'),
    leg('Detroit Tigers', 'Money Line', 'Baltimore Orioles @ Detroit Tigers', 1.67, 'won', 'baseball'),
    leg('New York Liberty', 'Money Line', 'New York Liberty @ Los Angeles Sparks', 1.50, 'won', 'basketball'),
    leg('Arthur Fils', 'Match Betting', 'Arthur Fils v Rafael Jodar', 1.57, 'lost', 'tennis'),
  ]),

  // 12. Single - lost
  {
    id: randomUUID(), date: '2026-07-28T20:57:00.000Z', title: 'Single', type: 'single',
    totalOdds: 2.00, stake: 100, result: 'lost', returns: 0,
    legs: [leg('Cincinnati Reds', 'Money Line Live', 'Cleveland Guardians @ Cincinnati Reds', 2.00, 'lost', 'baseball')],
  },

  // 13. Treble - WON
  acca('Treble', 'treble', '2026-07-29T00:07:00.000Z', 100, [
    leg('Texas Rangers', 'Money Line Live', 'Texas Rangers @ Tampa Bay Rays', 2.00, 'won', 'baseball'),
    leg('Miami Marlins', 'Money Line Live', 'Philadelphia Phillies @ Miami Marlins', 1.36, 'won', 'baseball'),
    leg('New York Liberty', 'Money Line', 'New York Liberty @ Los Angeles Sparks', 1.50, 'won', 'basketball'),
  ], { returns: 409.09 }),

  // 14. ONGOING - Single, pending (fixture Fri 16:25 not yet played). Stake continues the "let it ride" chain.
  {
    id: randomUUID(), date: '2026-07-31T04:24:26.000Z', title: 'Single', type: 'single',
    totalOdds: 2.20, stake: 38.32, result: 'pending',
    legs: [leg('Richie Burnett', 'Match Result', 'Richie Burnett v Richie Howson', 2.20, 'pending', 'darts')],
  },
];

const current = (await redis.get('bets')) ?? [];
for (const bet of bets) current.unshift(bet);
await redis.set('bets', current);
console.log(`Inserted ${bets.length} bets. Total bets now: ${current.length}`);
