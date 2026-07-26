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
  const totalOdds = opts.totalOdds ?? legs.reduce((acc, l) => acc * (l.baseOdds ?? l.odds), 1);
  const anyLost = legs.some(l => l.result === 'lost');
  const anyPending = legs.some(l => l.result === 'pending');
  const result = opts.result ?? (anyPending ? 'pending' : anyLost ? 'lost' : 'won');
  return {
    id: randomUUID(),
    date,
    title,
    type,
    totalOdds: opts.baseTotalOdds ? opts.totalOdds : totalOdds,
    baseTotalOdds: opts.baseTotalOdds,
    isBoosted: opts.isBoosted,
    stake,
    result,
    returns: opts.returns !== undefined ? opts.returns : (result === 'won' ? undefined : result === 'lost' ? 0 : undefined),
    notes: opts.notes,
    legs,
  };
}

const bets = [
  // #1 - stake/date not shown in screenshot, estimated
  acca('5 Fold Acca', 'acca', '2026-06-24T10:00:00.000Z', 100, [
    leg('No', 'Both Teams To Score', 'Portugal v Uzbekistan', 1.56, 'won', 'football', { isBoosted: true }),
    leg('England -1', 'Handicap -1', 'England v Ghana', 1.53, 'lost', 'football'),
    leg('Croatia', 'Match Winner - (Normal Time)', 'Panama v Croatia', 1.56, 'won', 'football', { isBoosted: true }),
    leg('Las Vegas Aces', 'Match Winner (incl. OT)', 'New York Liberty @ Las Vegas Aces', 1.72, 'lost', 'basketball'),
    leg('Brazil', 'Match Winner - (Normal Time)', 'Scotland v Brazil', 1.44, 'won', 'football', { isBoosted: true }),
  ], { isBoosted: true, baseTotalOdds: 9.22, totalOdds: 10.21 }),

  // #2 - stake/date not shown, estimated
  acca('4 Fold Acca', 'acca', '2026-06-24T14:00:00.000Z', 100, [
    leg('Bosnia and Herzegovina', 'Match Winner - (Normal Time)', 'Bosnia and Herzegovina v Qatar', 1.42, 'won', 'football', { isBoosted: true }),
    leg('Draw', 'Match Winner - (Normal Time)', 'Switzerland v Canada', 2.95, 'lost', 'football'),
    leg('Brazil', 'Match Winner - (Normal Time)', 'Scotland v Brazil', 1.39, 'won', 'football', { isBoosted: true }),
    leg('South Korea', 'Match Winner - (Normal Time)', 'South Africa v South Korea', 1.58, 'lost', 'football'),
  ], { isBoosted: true, baseTotalOdds: 9.20, totalOdds: 10.16 }),

  // #3 - date not shown, estimated. Stake shown as £50.
  acca('4 Fold Acca', 'acca', '2026-06-24T20:00:00.000Z', 50, [
    leg('Morocco', 'Match Winner - (Normal Time)', 'Morocco v Haiti', 1.28, 'won', 'football'),
    leg('Brazil', 'Match Winner - (Normal Time)', 'Scotland v Brazil', 1.33, 'won', 'football'),
    leg('Atlanta Dream', 'Match Winner (incl. OT)', 'Atlanta Dream @ Golden State Valkyries', 1.77, 'lost', 'basketball'),
    leg('Germany', 'Match Winner - (Normal Time)', 'Ecuador v Germany', 1.82, 'lost', 'football'),
  ]),

  acca('4 Fold Acca', 'acca', '2026-06-25T06:18:21.000Z', 100, [
    leg('Yes', 'Both Teams To Score', 'Ecuador v Germany', 1.78, 'won', 'football', { isBoosted: true }),
    leg('Yes', 'Both Teams To Score', 'Japan v Sweden', 1.85, 'won', 'football', { isBoosted: true }),
    leg('Dallas Wings', 'Match Winner (incl. OT)', 'Dallas Wings @ Las Vegas Aces', 2.65, 'lost', 'basketball'),
    leg('Spain', 'Match Winner - (Normal Time)', 'Uruguay v Spain', 1.63, 'won', 'football', { isBoosted: true }),
  ], { isBoosted: true, baseTotalOdds: 14.22, totalOdds: 15.24 }),

  acca('4 Fold Acca', 'acca', '2026-06-27T12:04:34.000Z', 100, [
    leg('Robbie Martin', 'Match Result', 'Robbie Martin v Scott Mitchell', 1.40, 'lost', 'darts'),
    leg('Philadelphia Phillies', 'Match Winner', 'Philadelphia Phillies @ New York Mets', 1.64, 'won', 'baseball', { isBoosted: true }),
    leg('Spain', 'Match Winner - (Normal Time)', 'Uruguay v Spain', 1.74, 'won', 'football', { isBoosted: true }),
    leg('Egypt', 'Match Winner - (Normal Time)', 'Egypt v Iran', 2.60, 'lost', 'football'),
  ], { isBoosted: true, baseTotalOdds: 10.39, totalOdds: 10.66 }),

  acca('4 Fold Acca', 'acca', '2026-06-27T03:12:28.000Z', 100, [
    leg('Atlanta Braves', 'Match Winner', 'Atlanta Braves @ San Francisco Giants', 1.80, 'won', 'baseball'),
    leg('Luke Humphries', 'Match Result', 'Luke Humphries v Gian van Veen', 1.46, 'won', 'darts'),
    leg('DR Congo', 'Match Winner - (Normal Time)', 'DR Congo v Uzbekistan', 1.70, 'won', 'football'),
    leg('Portugal', 'Match Winner - (Normal Time)', 'Colombia v Portugal', 1.90, 'lost', 'football'),
  ]),

  acca('4 Fold Acca', 'acca', '2026-06-28T05:32:23.000Z', 50, [
    leg('North Melbourne Kangaroos', 'Match Winner', 'North Melbourne Kangaroos v Essendon Bombers', 1.46, 'won', 'other'),
    leg('Fremantle Dockers', 'Match Winner', 'Fremantle Dockers v Gold Coast Suns', 1.17, 'won', 'other'),
    leg('VP', 'Winner 2-Way', 'Virtus.pro vs HULIGANI', 1.48, 'lost', 'esports'),
    leg('Netherlands', 'Match Winner', 'Netherlands v Israel', 1.25, 'won', 'football'),
  ], { notes: 'Rebound: £20 in Free Bets awarded' }),

  // Bet builder - South Africa v Canada
  {
    id: randomUUID(),
    date: '2026-06-28T04:25:37.000Z',
    title: 'South Africa v Canada',
    type: 'bet_builder',
    totalOdds: 12.00,
    stake: 20,
    result: 'won',
    returns: 220,
    legs: [{
      id: randomUUID(),
      selection: 'South Africa v Canada Bet Builder',
      market: 'Bet Builder',
      matchup: 'South Africa v Canada',
      odds: 12.00,
      result: 'won',
      sport: 'football',
      isBetBuilder: true,
      subLegs: [
        { id: randomUUID(), selection: 'Draw/Canada', market: 'Half-time / full-time', result: 'won' },
        { id: randomUUID(), selection: 'Under 10.5', market: 'Corner over/under', result: 'won' },
        { id: randomUUID(), selection: 'Canada first corner', market: 'Away Team Events', result: 'won' },
        { id: randomUUID(), selection: 'Jonathan David', market: 'To Have 1+ Shots On Target (Excl. ET)', result: 'won' },
        { id: randomUUID(), selection: 'Under 4.5', market: 'Number of cards over/under', result: 'won' },
      ],
    }],
  },

  acca('5 Fold Acca', 'acca', '2026-06-28T05:16:13.000Z', 100, [
    leg('Las Vegas Aces', 'Match Winner (incl. OT)', 'Las Vegas Aces @ Chicago Sky', 1.32, 'won', 'basketball'),
    leg('Denis Shapovalov', 'Match Winner', 'Denis Shapovalov v Pablo Carreno-Busta', 1.00, 'void', 'tennis'),
    leg('Andrey Rublev', 'Match Winner', 'Andrey Rublev v Roman Safiullin', 1.50, 'lost', 'tennis'),
    leg('Maja Chwalinska', 'Match Winner', 'Mananchaya Sawangkaew v Maja Chwalinska', 1.85, 'lost', 'tennis'),
    leg('Daniil Medvedev', 'Match Winner', 'Marin Cilic v Daniil Medvedev', 1.32, 'won', 'tennis'),
  ]),

  acca('4 Fold Acca', 'acca', '2026-06-29T11:19:49.000Z', 100, [
    leg('Cameron Norrie', 'Match Winner', 'Michael Zheng v Cameron Norrie', 1.57, 'lost', 'tennis'),
    leg('Daniil Medvedev', 'Match Winner', 'Marin Cilic v Daniil Medvedev', 1.42, 'won', 'tennis', { isBoosted: true }),
    leg('Yes', 'Both Teams To Score', 'Brazil v Japan', 2.07, 'won', 'football', { isBoosted: true }),
    leg('Germany -1', 'Handicap -1', 'Germany v Paraguay', 2.00, 'lost', 'football'),
  ], { isBoosted: true, baseTotalOdds: 9.23, totalOdds: 10.46 }),

  acca('4 Fold Acca', 'acca', '2026-06-29T05:09:26.000Z', 120, [
    leg('Brazil', 'Match Winner - (Normal Time)', 'Brazil v Japan', 1.80, 'won', 'football'),
    leg('Germany', 'Match Winner - (Normal Time)', 'Germany v Paraguay', 1.37, 'lost', 'football'),
    leg('Rinky Hijikata', 'Match Winner', 'Jesper De Jong v Rinky Hijikata', 1.35, 'lost', 'tennis'),
    leg('France -1', 'Handicap -1', 'France v Sweden', 1.75, 'won', 'football'),
  ]),

  acca('4 Fold Acca', 'acca', '2026-06-30T02:00:46.000Z', 100, [
    leg('Netherlands', 'Match Winner - (Normal Time)', 'Netherlands v Morocco', 2.30, 'lost', 'football'),
    leg('Seattle Mariners', 'Match Winner', 'Los Angeles Angels @ Seattle Mariners', 1.50, 'won', 'baseball'),
    leg('Norway', 'Match Winner - (Normal Time)', 'Ivory Coast v Norway', 2.08, 'won', 'football'),
    leg('France', 'Match Winner - (Normal Time)', 'France v Sweden', 1.30, 'won', 'football'),
  ]),

  acca('4 Fold Acca', 'acca', '2026-06-30T07:32:43.000Z', 100, [
    leg('Norway', 'Match Winner - (Normal Time)', 'Ivory Coast v Norway', 1.45, 'won', 'football', { isBoosted: true }),
    leg('France -1', 'Handicap -1', 'France v Sweden', 1.87, 'won', 'football', { isBoosted: true }),
    leg('Las Vegas Aces', 'Match Winner (incl. OT)', 'Las Vegas Aces @ New York Liberty', 2.90, 'lost', 'basketball'),
    leg('England', 'Match Winner - (Normal Time)', 'England v DR Congo', 1.37, 'won', 'football', { isBoosted: true }),
  ], { isBoosted: true, baseTotalOdds: 10.77, totalOdds: 11.29 }),

  acca('4 Fold Acca', 'acca', '2026-07-01T03:12:14.000Z', 100, [
    leg('Mexico', 'Match Winner - (Normal Time)', 'Mexico v Ecuador', 2.10, 'won', 'football'),
    leg('Hubert Hurkacz', 'Match Winner', 'Hubert Hurkacz v Sebastian Ofner', 1.30, 'won', 'tennis'),
    leg('Michael Zheng', 'Match Winner', 'Nicolas Mejia v Michael Zheng', 1.22, 'won', 'tennis'),
    leg('England', 'Match Winner - (Normal Time)', 'England v DR Congo', 1.30, 'won', 'football'),
  ], { returns: 433.00 }),

  {
    id: randomUUID(),
    date: '2026-07-01T03:13:23.000Z',
    title: 'Double',
    type: 'double',
    totalOdds: 2.17,
    stake: 10,
    result: 'lost',
    returns: 0,
    legs: [
      leg('England', 'Match Winner - (Normal Time)', 'England v DR Congo', 1.30, 'won', 'football'),
      leg('Boston Red Sox', 'Match Winner', 'Washington Nationals @ Boston Red Sox', 1.67, 'lost', 'baseball'),
    ],
  },

  {
    id: randomUUID(),
    date: '2026-07-01T09:02:46.000Z',
    title: 'Belgium v Senegal',
    type: 'bet_builder',
    totalOdds: 3.10,
    stake: 33,
    result: 'lost',
    returns: 0,
    legs: [{
      id: randomUUID(),
      selection: 'Belgium v Senegal Bet Builder',
      market: 'Bet Builder',
      matchup: 'Belgium v Senegal',
      odds: 3.10,
      result: 'lost',
      sport: 'football',
      isBetBuilder: true,
      subLegs: [
        { id: randomUUID(), selection: 'Under 3.5', market: 'Goal over/under', result: 'lost' },
        { id: randomUUID(), selection: 'Yes', market: 'Both teams score', result: 'won' },
      ],
    }],
  },

  acca('4 Fold Acca', 'acca', '2026-07-02T10:24:25.000Z', 100, [
    leg('Diana Shnaider', 'Match Winner', 'Diana Shnaider v Ludmilla Samsonova', 1.70, 'lost', 'tennis'),
    leg('Karen Khachanov', 'Match Winner', 'Karen Khachanov v Yannick Hanfmann', 1.69, 'won', 'tennis', { isBoosted: true }),
    leg('Spain -1', 'Handicap -1', 'Spain v Austria', 2.07, 'won', 'football', { isBoosted: true }),
    leg('Portugal', 'To Win the Tie', 'Portugal v Croatia', 1.43, 'won', 'football', { isBoosted: true }),
  ], { isBoosted: true, baseTotalOdds: 8.50, totalOdds: 9.15 }),

  acca('4 Fold Acca', 'acca', '2026-07-02T01:48:48.000Z', 100, [
    leg('Flavio Cobolli', 'Match Winner', 'James Duckworth v Flavio Cobolli', 1.38, 'won', 'tennis'),
    leg('Karen Khachanov', 'Match Winner', 'Karen Khachanov v Yannick Hanfmann', 1.58, 'won', 'tennis'),
    leg('Spain -1', 'Handicap -1', 'Spain v Austria', 1.85, 'won', 'football'),
    leg('Yes', 'Joao Felix Total Shots On Target 1+', 'Portugal v Croatia', 1.00, 'void', 'football'),
  ], { returns: 403.00 }),

  acca('5 Fold Acca', 'acca', '2026-07-03T11:04:06.000Z', 100, [
    leg('Belinda Bencic', 'Match Winner', 'Belinda Bencic v Anna Kalinskaya', 1.34, 'won', 'tennis', { isBoosted: true }),
    leg('Daniil Medvedev', 'Match Winner', 'Jan-Lennard Struff v Daniil Medvedev', 1.20, 'lost', 'tennis'),
    leg('Alejandro Davidovich Fokina', 'Match Winner', 'Alejandro Davidovich Fokina v Marton Fucsovics', 1.27, 'won', 'tennis', { isBoosted: true }),
    leg('Egypt', 'Match Winner - (Normal Time)', 'Australia v Egypt', 2.40, 'lost', 'football'),
    leg('Colombia', 'Match Winner - (Normal Time)', 'Colombia v Ghana', 1.43, 'won', 'football', { isBoosted: true }),
  ], { isBoosted: true, baseTotalOdds: 7.01, totalOdds: 7.10 }),

  acca('4 Fold Acca', 'acca', '2026-07-03T12:40:09.000Z', 103, [
    leg('Portugal', 'Match Winner - (Normal Time)', 'Portugal v Croatia', 1.70, 'won', 'football'),
    leg('Switzerland', 'Match Winner - (Normal Time)', 'Switzerland v Algeria', 1.95, 'won', 'football'),
    leg('Iva Jovic', 'Match Winner', 'Ekaterina Alexandrova v Iva Jovic', 1.48, 'won', 'tennis'),
    leg('Alejandro Davidovich Fokina', 'Match Winner', 'Alejandro Davidovich Fokina v Marton Fucsovics', 1.28, 'won', 'tennis'),
  ], { returns: 646.84 }),

  acca('Treble', 'treble', '2026-07-03T09:42:50.000Z', 146.84, [
    leg('Egypt', 'To Win the Tie', 'Australia v Egypt', 1.85, 'won', 'football'),
    leg('Minnesota Lynx', 'Match Winner (incl. OT)', 'Minnesota Lynx @ New York Liberty', 1.75, 'lost', 'basketball'),
    leg('Flavio Cobolli', 'Match Winner', 'Karen Khachanov v Flavio Cobolli', 2.25, 'won', 'tennis'),
  ]),

  // Cashed out early - treated as won with the cashed-out amount as returns
  acca('4 Fold Acca', 'acca', '2026-07-03T14:00:00.000Z', 100, [
    leg('Colombia', 'Match Winner - (Normal Time)', 'Colombia v Ghana', 1.42, 'won', 'football'),
    leg('Las Vegas Aces', 'Match Winner (incl. OT)', 'Chicago Sky @ Las Vegas Aces', 1.53, 'won', 'basketball'),
    leg('Morocco', 'Match Winner - (Normal Time)', 'Canada v Morocco', 1.85, 'won', 'football'),
    leg('France', 'Match Winner - (Normal Time)', 'Paraguay v France', 1.20, 'won', 'football'),
  ], { result: 'won', returns: 826.27, notes: 'Cashed out early' }),

  acca('4 Fold Acca', 'acca', '2026-07-04T05:35:56.000Z', 100, [
    leg('Morocco', 'Match Winner - (Normal Time)', 'Canada v Morocco', 1.82, 'won', 'football', { isBoosted: true }),
    leg('Golden State Valkyries', 'Match Winner (incl. OT)', 'Golden State Valkyries @ Atlanta Dream', 2.48, 'won', 'basketball', { isBoosted: true }),
    leg('Matteo Berrettini', 'Match Winner', 'Grigor Dimitrov v Matteo Berrettini', 1.65, 'lost', 'tennis'),
    leg('France', 'Match Winner - (Normal Time)', 'Paraguay v France', 1.22, 'won', 'football', { isBoosted: true }),
  ], { isBoosted: true, baseTotalOdds: 9.09, totalOdds: 9.20 }),

  acca('4 Fold Acca', 'acca', '2026-07-04T10:07:54.000Z', 126.27, [
    leg('France -1', 'Handicap +1', 'Paraguay v France', 1.68, 'lost', 'football'),
    leg('Seattle Storm', 'Match Winner (incl. OT)', 'Portland Fire @ Seattle Storm', 1.53, 'lost', 'basketball'),
    leg('Felix Auger Aliassime', 'Match Winner', 'Felix Auger Aliassime v Alejandro Davidovich Fokina', 1.45, 'won', 'tennis'),
    leg('England', 'Match Winner - (Normal Time)', 'Mexico v England', 2.40, 'won', 'football'),
  ]),

  acca('4 Fold Acca', 'acca', '2026-07-05T12:35:05.000Z', 100, [
    leg('Colorado Rockies', 'Match Winner', 'San Francisco Giants @ Colorado Rockies', 2.05, 'lost', 'baseball'),
    leg('Seattle Storm', 'Match Winner (incl. OT)', 'Portland Fire @ Seattle Storm', 1.53, 'lost', 'basketball'),
    leg('Felix Auger Aliassime', 'Match Winner', 'Felix Auger Aliassime v Alejandro Davidovich Fokina', 1.48, 'won', 'tennis'),
    leg('England', 'Match Winner - (Normal Time)', 'Mexico v England', 2.40, 'won', 'football'),
  ]),

  acca('4 Fold Acca', 'acca', '2026-07-05T04:57:42.000Z', 100, [
    leg('Hubert Hurkacz', 'Match Winner', 'Hubert Hurkacz v Jan-Lennard Struff', 1.00, 'void', 'tennis'),
    leg('Belinda Bencic', 'Match Winner', 'Belinda Bencic v Coco Gauff', 2.00, 'lost', 'tennis'),
    leg('Yes', 'Both Teams To Score', 'Brazil v Norway', 1.65, 'won', 'football'),
    leg('England', 'Match Winner - (Normal Time)', 'Mexico v England', 2.40, 'won', 'football'),
  ]),

  acca('4 Fold Acca', 'acca', '2026-07-05T10:48:55.000Z', 100, [
    leg('Norway', 'Match Winner - (Normal Time)', 'Brazil v Norway', 1.46, 'won', 'football', { isBoosted: true }),
    leg('England', 'Match Winner - (Normal Time)', 'Mexico v England', 2.55, 'won', 'football', { isBoosted: true }),
    leg('Marta Kostyuk', 'Match Winner', 'Ashlyn Krueger v Marta Kostyuk', 1.50, 'won', 'tennis', { isBoosted: true }),
    leg('Spain', 'Match Winner - (Normal Time)', 'Portugal v Spain', 2.00, 'won', 'football', { isBoosted: true }),
  ], { isBoosted: true, returns: 1117.00 }),

  // Odds not shown clearly - calculated from legs per instruction
  acca('5 Fold Acca', 'acca', '2026-07-06T12:00:00.000Z', 100, [
    leg('Spain', 'Match Winner - (Normal Time)', 'Portugal v Spain', 1.97, 'won', 'football', { isBoosted: true }),
    leg('Golden State Valkyries', 'Match Winner (incl. OT)', 'Golden State Valkyries @ Washington Mystics', 1.46, 'won', 'basketball', { isBoosted: true }),
    leg('Draw', 'Match Winner - (Normal Time)', 'USA v Belgium', 3.30, 'lost', 'football'),
    leg('Jessica Pegula', 'Match Winner', 'Jessica Pegula v Coco Gauff', 1.67, 'lost', 'tennis'),
    leg('Alexander Zverev', 'Match Winner', 'Jiri Lehecka v Alexander Zverev', 1.32, 'won', 'tennis', { isBoosted: true }),
  ], { isBoosted: true }),

  acca('4 Fold Acca', 'acca', '2026-07-07T10:33:44.000Z', 117, [
    leg('Jessica Pegula', 'Match Winner', 'Jessica Pegula v Coco Gauff', 1.62, 'lost', 'tennis'),
    leg('Novak Djokovic', 'Match Winner', 'Felix Auger Aliassime v Novak Djokovic', 1.59, 'won', 'tennis', { isBoosted: true }),
    leg('Colombia', 'To Win the Tie', 'Switzerland v Colombia', 1.62, 'lost', 'football'),
    leg('New York Liberty', 'Match Winner (incl. OT)', 'Dallas Wings @ New York Liberty', 1.50, 'lost', 'basketball'),
  ], { isBoosted: true, baseTotalOdds: 6.26, totalOdds: 6.50 }),
];

const current = (await redis.get('bets')) ?? [];
for (const bet of bets) current.unshift(bet);
await redis.set('bets', current);
console.log(`Inserted ${bets.length} bets. Total bets now: ${current.length}`);
