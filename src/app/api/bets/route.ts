import { NextRequest, NextResponse } from 'next/server';
import { readBets, addBet } from '@/lib/db';
import { Bet } from '@/lib/types';

export async function GET() {
  const data = await readBets();
  return NextResponse.json(data.bets);
}

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-key') !== '131275') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json() as Omit<Bet, 'id'>;
  const bet: Bet = { ...body, id: crypto.randomUUID() };
  const created = await addBet(bet);
  return NextResponse.json(created, { status: 201 });
}
