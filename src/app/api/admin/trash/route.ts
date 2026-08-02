// List soft-deleted bets. Trash contents are admin-only — same sensitivity as the normal Manage list.
import { NextRequest, NextResponse } from 'next/server';
import { readTrash } from '@/lib/storage';
import { SESSION_COOKIE, isValidSession } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  if (!isValidSession(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await readTrash();

  return NextResponse.json(data.bets);
}
