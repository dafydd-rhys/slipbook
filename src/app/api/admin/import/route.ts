import { NextRequest, NextResponse } from 'next/server';
import { addBets } from '@/lib/db';
import { Bet, BetLeg } from '@/lib/types';
import { SESSION_COOKIE, isValidSession } from '@/lib/adminAuth';

// Imported bets omit id (and leg ids) — assigned fresh here, same as manual add.
type ImportBet = Omit<Bet, 'id' | 'legs'> & { legs: Omit<BetLeg, 'id'>[] };

export async function POST(req: NextRequest) {
  if (!isValidSession(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as { bets?: ImportBet[] } | null;
  if (!body || !Array.isArray(body.bets) || body.bets.length === 0) {
    return NextResponse.json({ error: 'Expected a non-empty "bets" array' }, { status: 400 });
  }

  const bets: Bet[] = [];
  for (const [i, raw] of body.bets.entries()) {
    if (!raw.date || !raw.title || !raw.type || !Array.isArray(raw.legs) || raw.legs.length === 0) {
      return NextResponse.json({ error: `Row ${i + 1}: missing date, title, type, or legs` }, { status: 400 });
    }
    const date = new Date(raw.date);
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: `Row ${i + 1}: invalid date "${raw.date}"` }, { status: 400 });
    }
    bets.push({
      ...raw,
      id: crypto.randomUUID(),
      date: date.toISOString(),
      totalOdds: Number(raw.totalOdds) || 1,
      stake: Number(raw.stake) || 0,
      returns: raw.returns != null ? Number(raw.returns) : undefined,
      result: raw.result ?? 'pending',
      legs: raw.legs.map((l, j): BetLeg => ({
        ...l,
        id: `leg-${Date.now()}-${i}-${j}`,
        selection: l.selection || 'Selection',
        market: l.market || 'Market',
        matchup: l.matchup ?? '',
        odds: Number(l.odds) || 1,
        baseOdds: l.baseOdds != null ? Number(l.baseOdds) : undefined,
        result: l.result ?? 'pending',
        sport: l.sport ?? 'other',
        subLegs: l.subLegs?.map((sl, k) => ({ ...sl, id: `sl-${Date.now()}-${i}-${j}-${k}` })),
      })),
    });
  }

  const count = await addBets(bets);
  return NextResponse.json({ imported: count }, { status: 201 });
}
