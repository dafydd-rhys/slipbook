import { NextRequest, NextResponse } from 'next/server';
import { readBets, addBet } from '@/lib/db';
import { Bet } from '@/lib/types';
import { SESSION_COOKIE, isValidSession } from '@/lib/adminAuth';

export async function GET() {
  const data = await readBets();
  return NextResponse.json(data.bets);
}

export async function POST(req: NextRequest) {
  if (!isValidSession(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json() as Omit<Bet, 'id'>;
  const bet: Bet = { ...body, id: crypto.randomUUID() };
  const created = await addBet(bet);
  return NextResponse.json(created, { status: 201 });
}
