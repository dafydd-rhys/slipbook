// Manual trigger for the CLV/notifications job from the admin panel — same
// underlying work as POST /api/cron/tick, just gated by the admin PIN
// session instead of CRON_SECRET, so testing it doesn't require exposing
// that secret to the browser.
import { NextRequest, NextResponse } from 'next/server';
import { runClvCapture } from '@/lib/clvCapture';
import { runStalePendingPush } from '@/lib/pushNotify';
import { SESSION_COOKIE, isValidSession } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  if (!isValidSession(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [clv, push] = await Promise.all([runClvCapture(), runStalePendingPush()]);

  return NextResponse.json({ clv, push });
}
