'use client';

// "Data" tab — export bets/bankroll as CSV or JSON, and import bets from a file.
import { useEffect, useRef, useState } from 'react';
import { Bet, BankrollEntry, BetLeg } from '@/lib/types';
import { betsToCSV, betsToJSON, bankrollToCSV, bankrollToJSON, downloadFile, parseBetsCSV, ImportableBet } from '@/lib/exportImport';
import { canonicalMarket } from '@/lib/marketAliases';
import { SECTION, SECTION_TITLE } from './adminPanelStyles';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// VAPID application server keys are base64url — the Push API needs them as raw bytes.
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  const bytes = new Uint8Array(raw.length);

  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }

  return bytes;
}

const BTN: React.CSSProperties = {
  background: 'transparent', border: '1px solid var(--border)', borderRadius: 8,
  color: 'var(--accent)', fontSize: 12.5, fontWeight: 600, padding: '8px 14px', cursor: 'pointer',
};

// Today's date as YYYY-MM-DD, used in export filenames.
function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function DataAdmin({ bets, onImported }: { bets: Bet[]; onImported: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [normalizing, setNormalizing] = useState(false);
  const [normalizeResult, setNormalizeResult] = useState('');
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState('');
  const [tickBusy, setTickBusy] = useState(false);
  const [tickResult, setTickResult] = useState('');
  const [tickError, setTickError] = useState('');

  const pushSupported = !!VAPID_PUBLIC_KEY && typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;

  useEffect(() => {
    if (!pushSupported) {
      return;
    }

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setPushSubscribed(!!subscription))
      .catch(() => {});
  }, [pushSupported]);

  // Subscribes this browser to push and registers it server-side, or tears
  // both down — a single toggle for "notify me about stale pending bets."
  async function togglePush() {
    setPushBusy(true);
    setPushError('');

    try {
      const registration = await navigator.serviceWorker.ready;

      if (pushSubscribed) {
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          await fetch('/api/push/subscribe', {
            method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
          await subscription.unsubscribe();
        }

        setPushSubscribed(false);
        return;
      }

      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY as string),
      });

      await fetch('/api/push/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subscription.toJSON()),
      });
      setPushSubscribed(true);
    } catch (err) {
      setPushError(err instanceof Error ? err.message : 'Failed to enable notifications');
    } finally {
      setPushBusy(false);
    }
  }

  // Runs the same CLV-capture + stale-pending-bet-push job the scheduled
  // cron endpoint runs, on demand — handy for testing without curl, or for
  // hosts where wiring up a real scheduler isn't done yet. Admin-session
  // gated (src/app/api/admin/cron-tick), not the CRON_SECRET-gated route.
  async function runScheduledJobsNow() {
    setTickBusy(true);
    setTickError('');
    setTickResult('');

    try {
      const res = await fetch('/api/admin/cron-tick', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to run');
      }

      const clvLine = data.clv.ran
        ? `CLV: ${data.clv.requestsUsed} request${data.clv.requestsUsed !== 1 ? 's' : ''} used, ${data.clv.legsUpdated} leg${data.clv.legsUpdated !== 1 ? 's' : ''} updated.`
        : `CLV: skipped (${data.clv.reason}).`;
      const pushLine = data.push.ran
        ? `Push: ${data.push.staleBets} stale bet${data.push.staleBets !== 1 ? 's' : ''}, ${data.push.notified} device${data.push.notified !== 1 ? 's' : ''} notified.`
        : `Push: skipped (${data.push.reason}).`;

      setTickResult(`${clvLine} ${pushLine}`);
      onImported();
    } catch (err) {
      setTickError(err instanceof Error ? err.message : 'Failed to run');
    } finally {
      setTickBusy(false);
    }
  }

  async function exportBankroll(format: 'csv' | 'json') {
    const entries: BankrollEntry[] = await fetch('/api/bankroll').then((response) => response.json());

    if (format === 'csv') {
      downloadFile(`bankroll-${todayStamp()}.csv`, bankrollToCSV(entries), 'text/csv');
    } else {
      downloadFile(`bankroll-${todayStamp()}.json`, bankrollToJSON(entries), 'application/json');
    }
  }

  async function handleFile(file: File) {
    setImporting(true);
    setError('');
    setResult('');

    try {
      const text = await file.text();
      let importBets: ImportableBet[];

      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);

        importBets = Array.isArray(parsed) ? parsed : [];
      } else {
        importBets = parseBetsCSV(text);
      }

      if (importBets.length === 0) {
        throw new Error('No bets found in file');
      }

      const res = await fetch('/api/admin/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bets: importBets }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResult(`Imported ${data.imported} bet${data.imported !== 1 ? 's' : ''}.`);
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  // Rewrites each leg's market to its canonical spelling where one is known
  // (e.g. "Moneyline" -> "Match Winner") — only relabels legs that match a
  // known synonym, everything else (odds, stake, results, dates) is untouched.
  async function normalizeMarkets() {
    setNormalizing(true);
    setNormalizeResult('');

    try {
      let legsChanged = 0;
      const changedBets: { id: string; legs: BetLeg[] }[] = [];

      for (const bet of bets) {
        let betChanged = false;
        const legs = bet.legs.map((leg) => {
          const canonical = canonicalMarket(leg.market);

          if (canonical !== leg.market) {
            legsChanged++;
            betChanged = true;

            return { ...leg, market: canonical };
          }

          return leg;
        });

        if (betChanged) {
          changedBets.push({ id: bet.id, legs });
        }
      }

      await Promise.all(changedBets.map(({ id, legs }) =>
        fetch(`/api/bets/${id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ legs }),
        })
      ));

      setNormalizeResult(`Normalized ${legsChanged} market name${legsChanged !== 1 ? 's' : ''} across ${changedBets.length} bet${changedBets.length !== 1 ? 's' : ''}.`);
      onImported();
    } finally {
      setNormalizing(false);
    }
  }

  return (
    <div>
      <div style={SECTION}>
        <p style={SECTION_TITLE}>EXPORT BETS</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={BTN} onClick={() => downloadFile(`bets-${todayStamp()}.csv`, betsToCSV(bets), 'text/csv')}>Download CSV</button>
          <button style={BTN} onClick={() => downloadFile(`bets-${todayStamp()}.json`, betsToJSON(bets), 'application/json')}>Download JSON</button>
        </div>
      </div>

      <div style={SECTION}>
        <p style={SECTION_TITLE}>EXPORT BANKROLL</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={BTN} onClick={() => exportBankroll('csv')}>Download CSV</button>
          <button style={BTN} onClick={() => exportBankroll('json')}>Download JSON</button>
        </div>
      </div>

      <div style={SECTION}>
        <p style={SECTION_TITLE}>IMPORT BETS</p>
        <p style={{ fontSize: 11.5, color: 'var(--text-faint)', marginBottom: 12, maxWidth: '55ch' }}>
          Upload a CSV exported from this app, or a JSON array of bets. Imported bets are added alongside
          your existing ones — nothing is overwritten.
        </p>
        <input
          ref={fileRef} type="file" accept=".csv,.json" style={{ display: 'none' }} disabled={importing}
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file) {
              handleFile(file);
            }

            event.target.value = '';
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          style={{ ...BTN, background: 'var(--accent)', color: 'var(--accent-contrast)', border: 'none', cursor: importing ? 'not-allowed' : 'pointer', opacity: importing ? 0.6 : 1 }}
        >
          {importing ? 'Importing…' : 'Choose File…'}
        </button>
        {result && <p style={{ fontSize: 12, color: 'var(--won)', marginTop: 10 }}>{result}</p>}
        {error && <p style={{ fontSize: 12, color: 'var(--lost)', marginTop: 10 }}>{error}</p>}
      </div>

      <div style={SECTION}>
        <p style={SECTION_TITLE}>DATA CLEANUP</p>
        <p style={{ fontSize: 11.5, color: 'var(--text-faint)', marginBottom: 12, maxWidth: '55ch' }}>
          Relabels leg markets that are just spelling variants of the same market (e.g. &quot;Moneyline&quot; and
          &quot;2-Way Winner&quot; both become &quot;Match Winner&quot;), so the Insights market breakdown isn&apos;t
          split across duplicates. Only known synonyms are changed — odds, stake, results and dates are never touched.
        </p>
        <button
          onClick={normalizeMarkets}
          disabled={normalizing}
          style={{ ...BTN, cursor: normalizing ? 'not-allowed' : 'pointer', opacity: normalizing ? 0.6 : 1 }}
        >
          {normalizing ? 'Normalizing…' : 'Normalize Market Names'}
        </button>
        {normalizeResult && <p style={{ fontSize: 12, color: 'var(--won)', marginTop: 10 }}>{normalizeResult}</p>}
      </div>

      <div style={SECTION}>
        <p style={SECTION_TITLE}>SCHEDULED JOBS</p>
        <p style={{ fontSize: 11.5, color: 'var(--text-faint)', marginBottom: 12, maxWidth: '55ch' }}>
          Closing Line Value capture and stale-pending-bet notifications normally run from a scheduler hitting{' '}
          <code>/api/cron/tick</code> (see the README). Run them right now instead — useful for testing, or if you
          haven&apos;t wired up a scheduler yet. Each does nothing if its own env vars aren&apos;t configured.
        </p>
        <button
          onClick={runScheduledJobsNow}
          disabled={tickBusy}
          style={{ ...BTN, cursor: tickBusy ? 'not-allowed' : 'pointer', opacity: tickBusy ? 0.6 : 1 }}
        >
          {tickBusy ? 'Running…' : 'Run Now'}
        </button>
        {tickResult && <p style={{ fontSize: 12, color: 'var(--won)', marginTop: 10 }}>{tickResult}</p>}
        {tickError && <p style={{ fontSize: 12, color: 'var(--lost)', marginTop: 10 }}>{tickError}</p>}
      </div>

      {pushSupported && (
        <div style={SECTION}>
          <p style={SECTION_TITLE}>NOTIFICATIONS</p>
          <p style={{ fontSize: 11.5, color: 'var(--text-faint)', marginBottom: 12, maxWidth: '55ch' }}>
            Get a push notification when a bet&apos;s event has clearly passed and it&apos;s still pending — a nudge
            to settle it instead of it sitting forgotten. Needs the scheduled job configured (see the README) to
            actually check and send these.
          </p>
          <button
            onClick={togglePush}
            disabled={pushBusy}
            style={{ ...BTN, cursor: pushBusy ? 'not-allowed' : 'pointer', opacity: pushBusy ? 0.6 : 1 }}
          >
            {pushBusy ? 'Working…' : pushSubscribed ? 'Disable Notifications' : 'Enable Notifications'}
          </button>
          {pushError && <p style={{ fontSize: 12, color: 'var(--lost)', marginTop: 10 }}>{pushError}</p>}
        </div>
      )}
    </div>
  );
}
