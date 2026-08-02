// Bulk-add bets — used by both the CSV/JSON importer and the batch screenshot-import flow.
import { NextRequest, NextResponse } from 'next/server';
import { addBets } from '@/lib/storage';
import { Bet, BetLeg } from '@/lib/types';
import { SESSION_COOKIE, isValidSession } from '@/lib/adminAuth';

// Imported bets omit id (and leg ids) — assigned fresh here, same as manual add.
type ImportBet = Omit<Bet, 'id' | 'legs'> & { legs: Omit<BetLeg, 'id'>[] };

// Validates and normalizes a raw imported row into a real Bet, assigning fresh ids.
function normalizeImportedBet(raw: ImportBet, rowIndex: number): Bet {
  return {
    ...raw,
    id: crypto.randomUUID(),
    date: new Date(raw.date).toISOString(),
    totalOdds: Number(raw.totalOdds) || 1,
    stake: Number(raw.stake) || 0,
    returns: raw.returns != null ? Number(raw.returns) : undefined,
    result: raw.result ?? 'pending',
    legs: raw.legs.map((leg, legIndex): BetLeg => ({
      ...leg,
      id: `leg-${Date.now()}-${rowIndex}-${legIndex}`,
      selection: leg.selection || 'Selection',
      market: leg.market || 'Market',
      matchup: leg.matchup ?? '',
      odds: Number(leg.odds) || 1,
      baseOdds: leg.baseOdds != null ? Number(leg.baseOdds) : undefined,
      result: leg.result ?? 'pending',
      sport: leg.sport ?? 'other',
      subLegs: leg.subLegs?.map((subLeg, subLegIndex) => ({ ...subLeg, id: `sl-${Date.now()}-${rowIndex}-${legIndex}-${subLegIndex}` })),
    })),
  };
}

// Row-level validation error, or null if the row looks importable.
function validateImportRow(raw: ImportBet, rowIndex: number): string | null {
  if (!raw.date || !raw.title || !raw.type || !Array.isArray(raw.legs) || raw.legs.length === 0) {
    return `Row ${rowIndex + 1}: missing date, title, type, or legs`;
  }

  if (Number.isNaN(new Date(raw.date).getTime())) {
    return `Row ${rowIndex + 1}: invalid date "${raw.date}"`;
  }

  return null;
}

export async function POST(req: NextRequest) {
  if (!isValidSession(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as { bets?: ImportBet[] } | null;

  if (!body || !Array.isArray(body.bets) || body.bets.length === 0) {
    return NextResponse.json({ error: 'Expected a non-empty "bets" array' }, { status: 400 });
  }

  const bets: Bet[] = [];

  for (const [rowIndex, raw] of body.bets.entries()) {
    const validationError = validateImportRow(raw, rowIndex);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    bets.push(normalizeImportedBet(raw, rowIndex));
  }

  const count = await addBets(bets);

  return NextResponse.json({ imported: count }, { status: 201 });
}
