// Server-only. The scheduled job that nudges about pending bets whose event
// has clearly passed. No-ops if VAPID keys aren't set or there are no
// subscriptions, so it's a safe default in every deployment.
import webpush from 'web-push';
import { readBets, updateBet, readPushSubscriptions, removePushSubscriptions } from './storage';

const STALE_AFTER_HOURS = 6; // long enough that the event has almost certainly finished

export interface PushNotifyResult {
  ran: boolean;
  staleBets: number;
  notified: number;
  reason?: string;
}

export async function runStalePendingPush(): Promise<PushNotifyResult> {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    return { ran: false, staleBets: 0, notified: 0, reason: 'VAPID keys not set' };
  }

  const { subscriptions } = await readPushSubscriptions();

  if (subscriptions.length === 0) {
    return { ran: true, staleBets: 0, notified: 0, reason: 'no push subscriptions' };
  }

  const { bets } = await readBets();
  const staleCutoff = Date.now() - STALE_AFTER_HOURS * 60 * 60 * 1000;
  const staleBets = bets.filter((bet) => bet.result === 'pending' && !bet.staleNotifiedAt && new Date(bet.date).getTime() < staleCutoff);

  if (staleBets.length === 0) {
    return { ran: true, staleBets: 0, notified: 0 };
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const payload = JSON.stringify({
    title: `${staleBets.length} bet${staleBets.length !== 1 ? 's' : ''} ready to settle`,
    body: staleBets.length === 1 ? staleBets[0].title : staleBets.slice(0, 3).map((bet) => bet.title).join(', '),
  });

  const expiredEndpoints: string[] = [];

  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification(subscription, payload);
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;

      if (statusCode === 404 || statusCode === 410) {
        expiredEndpoints.push(subscription.endpoint);
      }
    }
  }));

  if (expiredEndpoints.length > 0) {
    await removePushSubscriptions(expiredEndpoints);
  }

  const now = new Date().toISOString();

  await Promise.all(staleBets.map((bet) => updateBet(bet.id, { staleNotifiedAt: now })));

  return { ran: true, staleBets: staleBets.length, notified: subscriptions.length - expiredEndpoints.length };
}
