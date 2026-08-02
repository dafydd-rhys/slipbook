// Update or soft-delete a single bet (admin only).
import { NextRequest, NextResponse } from 'next/server';
import { updateBet, deleteBet } from '@/lib/storage';
import { Bet } from '@/lib/types';
import { SESSION_COOKIE, isValidSession } from '@/lib/adminAuth';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function authed(req: NextRequest) {
  return isValidSession(req.cookies.get(SESSION_COOKIE)?.value);
}

// Merges the given fields into the existing bet.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authed(req)) {
    return unauthorized();
  }

  const { id } = await params;
  const body = await req.json() as Partial<Bet>;
  const updated = await updateBet(id, body);

  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(updated);
}

// Soft-deletes the bet (moves it to the trash).
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authed(req)) {
    return unauthorized();
  }

  const { id } = await params;
  const ok = await deleteBet(id);

  if (!ok) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
