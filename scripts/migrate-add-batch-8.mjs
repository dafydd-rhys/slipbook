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
    returns: opts.returns !== undefined ? opts.returns : (result === 'lost' ? 0 : result === 'pending' ? undefined : undefined),
    cashedOut: opts.cashedOut,
    legs,
  };
}

const bets = [
  // 1. 5 Fold Acca @13.45 (base 12.41) - lost
  acca('5 Fold Acca', 'acca', '2026-07-12T02:56:51.000Z', 150, [
    leg('Jannik Sinner -1.5', 'Set Handicap -1.5', 'Jannik Sinner v Alexander Zverev', 1.51, 'won', 'tennis', { isBoosted: true }),
    leg('Boston Red Sox', 'Match Winner', 'Boston Red Sox @ New York Mets', 1.90, 'won', 'baseball', { isBoosted: true }),
    leg('New York Liberty -5.5', 'Handicap +5.5', 'New York Liberty @ Toronto Tempo', 1.75, 'lost', 'basketball'),
    leg('IMP', 'Winner 2-Way', 'largadosypelados vs Imperial', 1.48, 'won', 'esports', { isBoosted: true }),
    leg('France', 'To Win the Tie', 'France v Spain', 1.67, 'lost', 'football'),
  ], { isBoosted: true, baseTotalOdds: 12.41, totalOdds: 13.45 }),

  // 2. 5 Fold Acca @5.58 (base 5.55) - lost
  acca('5 Fold Acca', 'acca', '2026-07-13T10:01:19.000Z', 100, [
    leg('Alex Williams', 'Match Result', 'Alex Williams v Stijn Dekleck', 1.33, 'won', 'darts', { isBoosted: true }),
    leg('New Zealand', 'Match Winner', 'West Indies v New Zealand', 1.73, 'won', 'cricket', { isBoosted: true }),
    leg('Liquid', 'Winner 2-Way', 'Team Liquid vs Xtreme Gaming', 1.47, 'won', 'esports', { isBoosted: true }),
    leg('Gian van Veen', 'Match Result', 'Gian van Veen v Krzysztof Ratajski', 1.00, 'void', 'darts'),
    leg('France', 'To Win the Tie', 'France v Spain', 1.64, 'lost', 'football'),
  ], { isBoosted: true, baseTotalOdds: 5.55, totalOdds: 5.58 }),

  // 3. 4 Fold Acca @15.93 (base 15.01) - lost, all 4 lost
  acca('4 Fold Acca', 'acca', '2026-07-14T10:29:04.000Z', 100, [
    leg('Toronto Tempo', 'Match Winner (incl. OT)', 'Washington Mystics @ Toronto Tempo', 2.05, 'lost', 'basketball'),
    leg('National League', 'Match Winner', 'American League @ National League', 1.75, 'lost', 'baseball'),
    leg('FUT', 'Winner 2-Way', 'FUT Esports vs Natus Vincere', 1.55, 'lost', 'esports'),
    leg('England', 'Match Winner - (Normal Time)', 'England v Argentina', 2.70, 'lost', 'football'),
  ], { isBoosted: true, baseTotalOdds: 15.01, totalOdds: 15.93 }),

  // 4. 5 Fold Acca (base 32.22) - boosted total wasn't visible in the screenshot (cropped), estimated at +5% over base.
  acca('5 Fold Acca', 'acca', '2026-07-15T10:06:03.000Z', 100, [
    leg('Alex Williams', 'Match Result', 'Mitch Minnie v Alex Williams', 1.35, 'won', 'darts', { isBoosted: true }),
    leg('Andy Hamilton', 'Match Result', 'Stijn Dekleck v Andy Hamilton', 1.27, 'won', 'darts', { isBoosted: true }),
    leg('Chicago Sky', 'Match Winner (incl. OT)', 'Seattle Storm @ Chicago Sky', 1.74, 'won', 'basketball', { isBoosted: true }),
    leg('England', 'Match Winner - (Normal Time)', 'England v Argentina', 2.70, 'lost', 'football'),
    leg('Matthew Fitzpatrick', 'Top 5 Finish', 'The Open Championship', 4.00, 'lost', 'golf'),
  ], { isBoosted: true, baseTotalOdds: 32.22, totalOdds: 33.83 }),

  // 5. 5 Fold Acca @9.87 (base 9.75) - stake/date not visible in the screenshot, estimated.
  acca('5 Fold Acca', 'acca', '2026-07-16T12:00:00.000Z', 100, [
    leg('Alex Williams', 'Match Result', 'Terry Nash v Alex Williams', 1.69, 'won', 'darts', { isBoosted: true }),
    leg('Los Angeles Sparks', 'Match Winner (incl. OT)', 'Los Angeles Sparks @ Chicago Sky', 2.00, 'lost', 'basketball'),
    leg('Indiana Fever', 'Match Winner (incl. OT)', 'Seattle Storm @ Indiana Fever', 1.25, 'won', 'basketball', { isBoosted: true }),
    leg('Stephen Bunting', 'Match Result', 'Stephen Bunting v Niels Zonneveld', 1.56, 'won', 'darts', { isBoosted: true }),
    leg('France', 'To Win the Tie', 'France v England', 1.48, 'lost', 'football'),
  ], { isBoosted: true, baseTotalOdds: 9.75, totalOdds: 9.87 }),

  // 6. 4 Fold Acca @7.31 (base 7.22) - lost
  acca('4 Fold Acca', 'acca', '2026-07-18T03:29:07.000Z', 100, [
    leg('Manchester United', 'Match Winner - (Normal Time)', 'Manchester United v Wrexham', 1.60, 'lost', 'football'),
    leg('Stephen Bunting', 'Match Result', 'Stephen Bunting v Niels Zonneveld', 1.56, 'won', 'darts', { isBoosted: true }),
    leg('France', 'Match Winner - (Normal Time)', 'France v England', 1.82, 'lost', 'football'),
    leg('Spain', 'To Win the Tie', 'Spain v Argentina', 1.59, 'won', 'football', { isBoosted: true }),
  ], { isBoosted: true, baseTotalOdds: 7.22, totalOdds: 7.31 }),

  // 7. Treble @10.11 (base 9.29) - lost
  acca('Treble', 'treble', '2026-07-19T04:56:11.000Z', 100, [
    leg('Spain', 'Match Winner - (Normal Time)', 'Spain v Argentina', 2.25, 'lost', 'football'),
    leg('Gian van Veen', 'Match Result', 'Gian van Veen v Krzysztof Ratajski', 1.72, 'won', 'darts', { isBoosted: true }),
    leg('Connecticut Sun', 'Match Winner (incl. OT)', 'Connecticut Sun @ Phoenix Mercury', 2.40, 'lost', 'basketball'),
  ], { isBoosted: true, baseTotalOdds: 9.29, totalOdds: 10.11 }),

  // 8. 5 Fold Acca @8.82 (not boosted) - lost
  acca('5 Fold Acca', 'acca', '2026-07-20T10:23:24.000Z', 100, [
    leg('David Evans', 'Match Result', 'David Evans v Archie Self', 1.86, 'won', 'darts'),
    leg('Derek Coulson', 'Match Result', 'Ashley Coleman v Derek Coulson', 1.42, 'lost', 'darts'),
    leg('Over 171.5', 'Total Points U/O 171.5', 'New York Liberty @ Dallas Wings', 1.69, 'won', 'basketball'),
    leg('Golden State Valkyries', 'Match Winner (incl. OT)', 'Washington Mystics @ Golden State Valkyries', 1.30, 'lost', 'basketball'),
    leg('Michael van Gerwen', 'Match Result', 'Michael van Gerwen v Dirk van Duijvenbode', 1.52, 'lost', 'darts'),
  ]),

  // 9. Double @2.28 - lost
  acca('Double', 'double', '2026-07-20T12:30:16.000Z', 50, [
    leg('Derek Coulson', 'Match Result', 'Derek Coulson v Archie Self', 1.30, 'won', 'darts'),
    leg('Henry Coates', 'Match Result', 'David Evans v Henry Coates', 1.75, 'lost', 'darts'),
  ]),

  // 10. 4 Fold Acca @10.57 (base 10.31) - lost
  acca('4 Fold Acca', 'acca', '2026-07-22T10:38:07.000Z', 125, [
    leg('Los Angeles Dodgers', 'Match Winner', 'Los Angeles Dodgers @ Philadelphia Phillies', 1.85, 'won', 'baseball', { isBoosted: true }),
    leg('Minnesota Twins', 'Match Winner', 'Minnesota Twins @ Cleveland Guardians', 2.18, 'won', 'baseball', { isBoosted: true }),
    leg('Boston Red Sox', 'Match Winner', 'Baltimore Orioles @ Boston Red Sox', 1.80, 'lost', 'baseball'),
    leg('Las Vegas Aces', 'Match Winner (incl. OT)', 'Las Vegas Aces @ Washington Mystics', 1.42, 'lost', 'basketball'),
  ], { isBoosted: true, baseTotalOdds: 10.31, totalOdds: 10.57 }),

  // 11. 4 Fold Acca @10.16 (base 9.72) - CASHED OUT early (3 legs won, 1 leg was still pending when cashed out)
  acca('4 Fold Acca', 'acca', '2026-07-23T02:39:12.000Z', 100, [
    leg('Jack Aldridge', 'Match Result', 'David Evans v Jack Aldridge', 1.68, 'won', 'darts', { isBoosted: true }),
    leg('Archie Self', 'Match Result', 'Alec Small v Archie Self', 1.68, 'won', 'darts', { isBoosted: true }),
    leg('Minnesota Twins', 'Match Winner', 'Minnesota Twins @ Cleveland Guardians', 2.25, 'won', 'baseball', { isBoosted: true }),
    leg('New York Liberty', 'Match Winner (incl. OT)', 'New York Liberty @ Los Angeles Sparks', 1.53, 'pending', 'basketball'),
  ], { isBoosted: true, baseTotalOdds: 9.72, totalOdds: 10.16, result: 'won', returns: 595.51, cashedOut: true }),

  // 12. 4 Fold Acca @7.88 (base 7.82) - lost
  acca('4 Fold Acca', 'acca', '2026-07-24T09:48:58.000Z', 95.51, [
    leg('Archie Self', 'Match Result', 'David Evans v Archie Self', 1.45, 'lost', 'darts'),
    leg('Jack Aldridge', 'Match Result', 'Alec Small v Jack Aldridge', 1.45, 'won', 'darts', { isBoosted: true }),
    leg('Gian van Veen', 'Match Result', 'Gian van Veen v James Wade', 1.78, 'won', 'darts', { isBoosted: true }),
    leg('New York Yankees', 'Match Winner', 'New York Yankees @ Philadelphia Phillies', 2.09, 'won', 'baseball', { isBoosted: true }),
  ], { isBoosted: true, baseTotalOdds: 7.82, totalOdds: 7.88 }),

  // 13. 6 Fold Acca @17.62 (not boosted) - lost
  acca('6 Fold Acca', 'acca', '2026-07-24T02:53:14.000Z', 100, [
    leg('Archie Self', 'Match Result', 'Jack Tweddell v Archie Self', 1.95, 'won', 'darts'),
    leg('Jack Aldridge', 'Match Result', 'Alec Small v Jack Aldridge', 1.44, 'won', 'darts'),
    leg('No', 'Both Teams Score In 1st Half', 'Rosenborg BK v Manchester United', 1.33, 'won', 'football'),
    leg('Gerwyn Price', 'Match Result', 'Ross Smith v Gerwyn Price', 1.55, 'won', 'darts'),
    leg('Over 4.5 Runs', 'Milwaukee Brewers Runs U/O 4.5', 'Colorado Rockies @ Milwaukee Brewers', 1.72, 'lost', 'baseball'),
    leg('Gian van Veen', 'Match Result', 'Gian van Veen v James Wade', 1.77, 'won', 'darts'),
  ]),

  // 14. 4 Fold Acca @6.43 (not boosted) - lost
  acca('4 Fold Acca', 'acca', '2026-07-25T12:19:09.000Z', 200, [
    leg('Henry Coates', 'Match Result', 'Henry Coates v Neil Duff', 1.46, 'won', 'darts'),
    leg('Minnesota Twins', 'Match Winner', 'Athletics @ Minnesota Twins', 1.70, 'lost', 'baseball'),
    leg('San Francisco Giants', 'Match Winner', 'Los Angeles Angels @ San Francisco Giants', 1.62, 'won', 'baseball'),
    leg('Gerwyn Price', 'Match Result', 'Gerwyn Price v Gian van Veen', 1.60, 'won', 'darts'),
  ]),

  // 15. 5 Fold Acca @12.94 - all WON
  acca('5 Fold Acca', 'acca', '2026-07-25T06:34:21.000Z', 200, [
    leg('DRG', 'Winner 2-Way', 'JD Gaming vs Dragon Ranger Gaming', 1.52, 'won', 'esports', { isBoosted: true }),
    leg('FaZe', 'Winner 2-Way', 'DENDELE CS vs FaZe', 1.48, 'won', 'esports', { isBoosted: true }),
    leg('Gerwyn Price', 'Match Result', 'Gerwyn Price v Gian van Veen', 1.62, 'won', 'darts', { isBoosted: true }),
    leg('Under 9.5', 'Pick Your Own Total', 'Athletics @ Minnesota Twins', 2.04, 'won', 'baseball', { isBoosted: true }),
    leg('Fallon Sherrock', 'Match Result', 'Fallon Sherrock v Deta Hedman', 1.74, 'won', 'darts', { isBoosted: true }),
  ], { isBoosted: true, totalOdds: 12.94, returns: 2588.00 }),

  // 16. Treble - lost (Bet365-style history entry)
  acca('Treble', 'treble', '2026-07-11T18:49:00.000Z', 10, [
    leg('England 3-1', 'Correct Score', 'Norway v England', 13.00, 'lost', 'football'),
    leg('Argentina 2-1', 'Correct Score', 'Argentina v Switzerland', 7.50, 'lost', 'football'),
    leg('Max Holloway', 'Bout Betting', 'Conor McGregor v Max Holloway', 1.44, 'won', 'mma'),
  ]),

  // 17. 4 Fold Acca - lost
  acca('4 Fold Acca', 'acca', '2026-07-12T01:23:00.000Z', 123.94, [
    leg('Argentina', '90 Minutes', 'Argentina v Switzerland', 1.70, 'lost', 'football'),
    leg('Max Holloway', 'Bout Betting', 'Conor McGregor v Max Holloway', 1.40, 'won', 'mma'),
    leg('Under 8.5', 'Total Runs', 'Toronto Blue Jays @ San Diego Padres', 1.70, 'lost', 'baseball'),
    leg('Jannik Sinner -1.5', 'Set Handicap Betting', 'Jannik Sinner v Alexander Zverev', 1.50, 'won', 'tennis'),
  ]),

  // 18. Treble - lost
  acca('Treble', 'treble', '2026-07-12T16:37:00.000Z', 100, [
    leg('Tampa Bay Rays', 'Money Line', 'Seattle Mariners @ Tampa Bay Rays', 1.67, 'lost', 'baseball'),
    leg('Athletics', 'Money Line', 'Athletics @ Chicago White Sox', 2.20, 'lost', 'baseball'),
    leg('Jannik Sinner -1.5', 'Set Handicap Betting Live', 'Jannik Sinner v Alexander Zverev', 1.53, 'won', 'tennis'),
  ]),

  // 19. 5 Fold Acca - lost
  acca('5 Fold Acca', 'acca', '2026-07-15T23:50:00.000Z', 20, [
    leg('Golden State Valkyries', 'Money Line', 'Golden State Valkyries @ Indiana Fever', 2.20, 'won', 'basketball'),
    leg('France', '90 Minutes', 'France v England', 2.00, 'lost', 'football'),
    leg('Spain', 'To Lift The Trophy', 'Spain v Argentina', 1.61, 'won', 'football'),
    leg('Matt Fitzpatrick', 'Top 5 Finish', 'The Open 2026', 4.33, 'lost', 'golf'),
    leg('Stefanos Tsitsipas', 'Match Betting Live', 'Jerome Kym v Stefanos Tsitsipas', 1.53, 'won', 'tennis'),
  ]),

  // 20. Treble - lost
  acca('Treble', 'treble', '2026-07-15T23:51:00.000Z', 100, [
    leg('Golden State Valkyries', 'Money Line', 'Golden State Valkyries @ Indiana Fever', 2.20, 'won', 'basketball'),
    leg('France', '90 Minutes', 'France v England', 2.00, 'lost', 'football'),
    leg('Spain', 'To Lift The Trophy', 'Spain v Argentina', 1.61, 'won', 'football'),
  ]),

  // 21. 4 Fold Acca - lost
  acca('4 Fold Acca', 'acca', '2026-07-18T22:07:00.000Z', 100, [
    leg('New York Liberty', 'Money Line', 'New York Liberty @ Indiana Fever', 1.73, 'lost', 'basketball'),
    leg('Golden State Valkyries', 'Money Line', 'Washington Mystics @ Golden State Valkyries', 1.25, 'won', 'basketball'),
    leg('Pittsburgh Pirates', 'Money Line', 'Pittsburgh Pirates @ Cleveland Guardians', 1.91, 'lost', 'baseball'),
    leg('France', 'To Finish Third Live', 'France v England', 1.80, 'lost', 'football'),
  ]),

  // 22. 4 Fold Acca - lost, all 4 lost
  acca('4 Fold Acca', 'acca', '2026-07-18T23:14:00.000Z', 100, [
    leg('Atlanta Hawks', 'Money Line', 'Atlanta Hawks @ Washington Wizards', 1.85, 'lost', 'basketball'),
    leg('Pittsburgh Pirates', 'Money Line', 'Pittsburgh Pirates @ Cleveland Guardians', 1.91, 'lost', 'baseball'),
    leg('New York Liberty', 'Money Line', 'New York Liberty @ Indiana Fever', 1.73, 'lost', 'basketball'),
    leg('Golden State Valkyries -8.5', 'Points Handicap', 'Washington Mystics @ Golden State Valkyries', 1.85, 'lost', 'basketball'),
  ]),

  // 23. ONGOING #1 - Single, live match in progress, date estimated (not shown)
  {
    id: randomUUID(),
    date: '2026-07-26T01:00:00.000Z',
    title: 'Single',
    type: 'single',
    totalOdds: 5.00,
    stake: 40,
    result: 'pending',
    legs: [leg('Fallon Sherrock', 'Match Betting', 'Beau Greaves v Fallon Sherrock', 5.00, 'pending', 'darts')],
  },

  // 24. ONGOING #2 - 4 Fold Acca, all legs future kickoffs, none started
  acca('4 Fold Acca', 'acca', '2026-07-26T03:43:53.000Z', 100, [
    leg('BBL', 'Winner 2-Way', 'BBL Esports vs Natus Vincere', 1.48, 'pending', 'esports'),
    leg('Cleveland Guardians', 'Match Winner', 'Cleveland Guardians @ Tampa Bay Rays', 2.05, 'pending', 'baseball'),
    leg('TH', 'Winner 2-Way', 'Team Heretics vs Karmine Corp', 1.64, 'pending', 'esports'),
    leg('Under 9.5', 'Pick Your Own Total', 'Athletics @ Minnesota Twins', 1.85, 'pending', 'baseball'),
  ], { isBoosted: true, baseTotalOdds: 9.21, totalOdds: 9.42 }),
];

const current = (await redis.get('bets')) ?? [];
for (const bet of bets) current.unshift(bet);
await redis.set('bets', current);
console.log(`Inserted ${bets.length} bets. Total bets now: ${current.length}`);
