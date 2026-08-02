// Restore a trashed bet, or permanently delete it.
import { NextRequest, NextResponse } from 'next/server';
import { restoreBet, purgeBet } from '@/lib/storage';
import { SESSION_COOKIE, isValidSession } from '@/lib/adminAuth';

function authed(req: NextRequest) {
  return isValidSession(req.cookies.get(SESSION_COOKIE)?.value);
}

// Restore a soft-deleted bet.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const ok = await restoreBet(id);

  if (!ok) {
    return NextResponse.json({ error: 'Not found in trash' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

// Permanently delete a bet already in the trash.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const ok = await purgeBet(id);

  if (!ok) {
    return NextResponse.json({ error: 'Not found in trash' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
