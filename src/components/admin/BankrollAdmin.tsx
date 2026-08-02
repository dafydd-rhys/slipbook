'use client';

import { useEffect, useState } from 'react';
import { BankrollEntry, BankrollEntryType } from '@/lib/types';
import { CURRENCY_SYMBOL } from '@/lib/config';

const INPUT: React.CSSProperties = {
  background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
  color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 13, padding: '8px 10px', width: '100%', outline: 'none',
};
const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.06em',
  display: 'block', marginBottom: 4, textTransform: 'uppercase',
};
const SECTION: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 14,
};
const SECTION_TITLE: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.1em',
  marginBottom: 14, textTransform: 'uppercase',
};

const TYPE_COLORS: Record<BankrollEntryType, string> = {
  deposit: 'var(--won)', withdrawal: 'var(--lost)', adjustment: 'var(--pending)',
};

export default function BankrollAdmin() {
  const [entries, setEntries] = useState<BankrollEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<BankrollEntryType>('deposit');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setEntries(await fetch('/api/bankroll').then(r => r.json()));
  }
  useEffect(() => {
    fetch('/api/bankroll').then(r => r.json()).then(data => { setEntries(data); setLoading(false); });
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || saving) return;
    setSaving(true);
    const res = await fetch('/api/bankroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: new Date(date).toISOString(), type, amount: parseFloat(amount) || 0, note: note || undefined }),
    });
    if (res.ok) { setAmount(''); setNote(''); await refresh(); }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/bankroll/${id}`, { method: 'DELETE' });
    await refresh();
  }

  const sorted = [...entries].sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return (
    <div>
      <div style={SECTION}>
        <p style={SECTION_TITLE}>ADD ENTRY</p>
        <form onSubmit={handleAdd}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={LABEL}>Type</label>
              <select value={type} onChange={e => setType(e.target.value as BankrollEntryType)} style={{ ...INPUT, color: TYPE_COLORS[type] }}>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </div>
            <div>
              <label style={LABEL}>Amount ({CURRENCY_SYMBOL})</label>
              <input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" style={{ ...INPUT, fontFamily: 'var(--font-mono)' }} required />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={LABEL}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={INPUT} required />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL}>Note (optional)</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Monthly top-up" style={INPUT} />
          </div>
          <button type="submit" disabled={saving || !amount} style={{
            width: '100%', background: 'var(--accent)', border: 'none', borderRadius: 10,
            color: 'var(--accent-contrast)', fontSize: 14, fontWeight: 700, padding: 11,
            cursor: (saving || !amount) ? 'not-allowed' : 'pointer', opacity: (saving || !amount) ? 0.6 : 1,
          }}>
            {saving ? 'Adding…' : 'Add Entry'}
          </button>
        </form>
      </div>

      <div style={SECTION}>
        <p style={SECTION_TITLE}>HISTORY ({entries.length})</p>
        {loading ? (
          <p style={{ fontSize: 12, color: 'var(--text-faint)', textAlign: 'center', padding: '16px 0' }}>Loading…</p>
        ) : sorted.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--text-faint)', textAlign: 'center', padding: '16px 0' }}>No entries yet.</p>
        ) : (
          sorted.map(e => (
            <div key={e.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0',
              borderTop: '1px solid var(--border-soft)',
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 5,
                background: `color-mix(in srgb, ${TYPE_COLORS[e.type]} 14%, transparent)`, color: TYPE_COLORS[e.type], flexShrink: 0,
              }}>
                {e.type.toUpperCase()}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>
                  {e.type === 'withdrawal' ? '-' : '+'}{CURRENCY_SYMBOL}{e.amount.toFixed(2)}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 8 }}>
                  {new Date(e.date).toLocaleDateString('en-GB')}{e.note ? ` · ${e.note}` : ''}
                </span>
              </div>
              <button onClick={() => handleDelete(e.id)} style={{
                background: 'transparent', border: '1px solid color-mix(in srgb, var(--lost) 30%, transparent)', borderRadius: 6,
                color: 'var(--lost)', fontSize: 11, padding: '3px 9px', cursor: 'pointer', flexShrink: 0,
              }}>
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
