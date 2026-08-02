'use client';

import { useEffect, useState } from 'react';
import { Bet } from '@/lib/types';
import { CURRENCY_SYMBOL } from '@/lib/config';

const SECTION: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 14,
};
const SECTION_TITLE: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.1em',
  marginBottom: 14, textTransform: 'uppercase',
};

const RETENTION_DAYS = 30;

function daysLeft(deletedAt: string): number {
  const ageMs = Date.now() - new Date(deletedAt).getTime();
  const remaining = RETENTION_DAYS - Math.floor(ageMs / (24 * 60 * 60 * 1000));
  return Math.max(0, remaining);
}

export default function TrashAdmin({ onChanged }: { onChanged: () => void }) {
  const [trash, setTrash] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch('/api/admin/trash').then(r => r.json()).then(setTrash).finally(() => setLoading(false));
  }
  useEffect(() => {
    fetch('/api/admin/trash').then(r => r.json()).then(data => { setTrash(data); setLoading(false); });
  }, []);

  async function handleRestore(id: string) {
    setBusyId(id);
    await fetch(`/api/admin/trash/${id}`, { method: 'POST' });
    load();
    onChanged();
    setBusyId(null);
  }

  async function handlePurge(id: string) {
    if (!window.confirm('Permanently delete this bet? This cannot be undone.')) return;
    setBusyId(id);
    await fetch(`/api/admin/trash/${id}`, { method: 'DELETE' });
    load();
    setBusyId(null);
  }

  return (
    <div style={SECTION}>
      <p style={SECTION_TITLE}>TRASH ({trash.length})</p>
      <p style={{ fontSize: 11.5, color: 'var(--text-faint)', marginBottom: 14 }}>
        Deleted bets stay here for {RETENTION_DAYS} days before being permanently removed. Restore or delete them for good below.
      </p>
      {loading ? (
        <p style={{ fontSize: 12, color: 'var(--text-faint)', textAlign: 'center', padding: '20px 0' }}>Loading…</p>
      ) : trash.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--text-faint)', textAlign: 'center', padding: '20px 0' }}>Trash is empty.</p>
      ) : (
        trash.map(bet => (
          <div key={bet.id} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
            borderTop: '1px solid var(--border-soft)', opacity: busyId === bet.id ? 0.5 : 1,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{bet.title}</span>
              <span className="tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-faint)', display: 'block', marginTop: 2 }}>
                {new Date(bet.date).toLocaleDateString('en-GB')} · @{bet.totalOdds} · {CURRENCY_SYMBOL}{bet.stake}
                {bet.deletedAt && ` · purges in ${daysLeft(bet.deletedAt)}d`}
              </span>
            </div>
            <button disabled={busyId === bet.id} onClick={() => handleRestore(bet.id)} style={{
              background: 'transparent', border: '1px solid color-mix(in srgb, var(--won) 40%, transparent)', borderRadius: 6,
              color: 'var(--won)', fontSize: 11, padding: '4px 10px', cursor: 'pointer', flexShrink: 0,
            }}>
              Restore
            </button>
            <button disabled={busyId === bet.id} onClick={() => handlePurge(bet.id)} style={{
              background: 'transparent', border: '1px solid color-mix(in srgb, var(--lost) 30%, transparent)', borderRadius: 6,
              color: 'var(--lost)', fontSize: 11, padding: '4px 10px', cursor: 'pointer', flexShrink: 0,
            }}>
              Delete Forever
            </button>
          </div>
        ))
      )}
    </div>
  );
}
