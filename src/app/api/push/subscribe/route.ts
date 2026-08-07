// Register/unregister a browser push subscription (admin only — this is a
// single-user app, so only the person settling bets needs to hear about them).
import { NextRequest, NextResponse } from 'next/server';
import { addPushSubscription, removePushSubscriptions } from '@/lib/storage';
import { PushSubscriptionRecord } from '@/lib/types';
import { SESSION_COOKIE, isValidSession } from '@/lib/adminAuth';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function POST(req: NextRequest) {
  if (!isValidSession(req.cookies.get(SESSION_COOKIE)?.value)) {
    return unauthorized();
  }

  const subscription = await req.json() as PushSubscriptionRecord;

  if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
  }

  await addPushSubscription(subscription);

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!isValidSession(req.cookies.get(SESSION_COOKIE)?.value)) {
    return unauthorized();
  }

  const { endpoint } = await req.json() as { endpoint?: string };

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  }

  await removePushSubscriptions([endpoint]);

  return NextResponse.json({ success: true });
}
