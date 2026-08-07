// Single scheduled-job trigger, meant to be called by an external scheduler
// (Vercel Cron, cron-job.org, a GitHub Actions workflow, your own crontab —
// see README) since this app doesn't assume an always-on host. Protected by
// CRON_SECRET rather than the admin PIN, since a scheduler isn't a browser
// session. Runs both optional jobs; each no-ops on its own if unconfigured.
import { NextRequest, NextResponse } from 'next/server';
import { runClvCapture } from '@/lib/clvCapture';
import { runStalePendingPush } from '@/lib/pushNotify';

export async function POST(req: NextRequest) {
  const expected = process.env.CRON_SECRET;

  if (!expected || req.headers.get('authorization') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [clv, push] = await Promise.all([runClvCapture(), runStalePendingPush()]);

  return NextResponse.json({ clv, push });
}
