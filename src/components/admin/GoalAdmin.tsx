'use client';

import { useEffect, useState } from 'react';
import { Goal } from '@/lib/types';

const SECTION: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 14,
};
const SECTION_TITLE: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.1em',
  marginBottom: 14, textTransform: 'uppercase',
};
const INPUT: React.CSSProperties = {
  background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
  color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 13, padding: '8px 10px', width: '100%', outline: 'none',
};
const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.05em',
  display: 'block', marginBottom: 4, textTransform: 'uppercase',
};

export default function GoalAdmin() {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [targetUnits, setTargetUnits] = useState('50');
  const [deadline, setDeadline] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    fetch('/api/goal').then(r => r.json()).then(setGoal).finally(() => setLoading(false));
  }
  useEffect(() => {
    fetch('/api/goal').then(r => r.json()).then(data => { setGoal(data); setLoading(false); });
  }, []);

  async function handleSet(e: React.FormEvent) {
    e.preventDefault();
    if (!deadline || saving) return;
    setSaving(true);
    const res = await fetch('/api/goal', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUnits: parseFloat(targetUnits) || 0, deadline: new Date(deadline).toISOString(), note: note || undefined }),
    });
    if (res.ok) load();
    setSaving(false);
  }

  async function handleClear() {
    setSaving(true);
    await fetch('/api/goal', { method: 'DELETE' });
    load();
    setSaving(false);
  }

  return (
    <div style={SECTION}>
      <p style={SECTION_TITLE}>GOAL</p>
      {loading ? (
        <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>Loading…</p>
      ) : goal ? (
        <div>
          <p style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>
            <strong>{goal.targetUnits >= 0 ? '+' : ''}{goal.targetUnits.toFixed(2)}u</strong> by{' '}
            <strong>{new Date(goal.deadline).toLocaleDateString('en-GB')}</strong>
          </p>
          {goal.note && <p style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 8 }}>{goal.note}</p>}
          <p style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 12 }}>
            Measured from {new Date(goal.startDate).toLocaleDateString('en-GB')} — shown as a progress bar on Insights.
          </p>
          <button onClick={handleClear} disabled={saving} style={{
            background: 'transparent', border: '1px solid color-mix(in srgb, var(--lost) 30%, transparent)', borderRadius: 8,
            color: 'var(--lost)', fontSize: 12, padding: '7px 13px', cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            Clear Goal
          </button>
        </div>
      ) : (
        <form onSubmit={handleSet}>
          <p style={{ fontSize: 11.5, color: 'var(--text-faint)', marginBottom: 12, maxWidth: '55ch' }}>
            Set a target — net units gained from today, by a deadline. Shown as a progress bar on the public Insights page.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={LABEL}>Target (units)</label>
              <input value={targetUnits} onChange={e => setTargetUnits(e.target.value)} inputMode="decimal" placeholder="e.g. 50" style={{ ...INPUT, fontFamily: 'var(--font-mono)' }} required />
            </div>
            <div>
              <label style={LABEL}>Deadline</label>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={INPUT} required />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL}>Note (optional)</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Save for a holiday" style={INPUT} />
          </div>
          <button type="submit" disabled={saving || !deadline} style={{
            background: 'var(--accent)', border: 'none', borderRadius: 8, color: 'var(--accent-contrast)',
            fontSize: 13, fontWeight: 700, padding: '8px 16px', cursor: (saving || !deadline) ? 'not-allowed' : 'pointer',
          }}>
            Set Goal
          </button>
        </form>
      )}
    </div>
  );
}
