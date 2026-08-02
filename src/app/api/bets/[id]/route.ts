import { NextRequest, NextResponse } from 'next/server';
import { updateBet, deleteBet } from '@/lib/db';
import { Bet } from '@/lib/types';
import { SESSION_COOKIE, isValidSession } from '@/lib/adminAuth';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function authed(req: NextRequest) {
  return isValidSession(req.cookies.get(SESSION_COOKIE)?.value);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authed(req)) return unauthorized();
  const { id } = await params;
  const body = await req.json() as Partial<Bet>;
  const updated = await updateBet(id, body);
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authed(req)) return unauthorized();
  const { id } = await params;
  const ok = await deleteBet(id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
