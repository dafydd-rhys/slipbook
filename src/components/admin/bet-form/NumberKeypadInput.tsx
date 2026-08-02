'use client';

// Popup number keypad — click the field to tap out a value (odds/stake), like the admin PIN pad.
import { useState } from 'react';
import { INPUT } from '../adminPanelStyles';

const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

export default function NumberKeypadInput({ value, onChange, placeholder, style }: {
  value: string; onChange: (value: string) => void; placeholder?: string; style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');

  // Opens the keypad with a fresh draft (rather than continuing from the current value).
  function openPad() {
    setDraft('');
    setOpen(true);
  }

  // Applies one keypress to the draft value and reports it to the parent immediately.
  function tap(key: string) {
    let next = draft;

    if (key === 'C') {
      next = '';
    } else if (key === '⌫') {
      next = draft.slice(0, -1);
    } else if (key === '.') {
      next = draft.includes('.') ? draft : draft + '.';
    } else {
      next = draft + key;
    }

    setDraft(next);
    onChange(next);
  }

  return (
    <>
      <input readOnly value={value} placeholder={placeholder} onClick={openPad}
        style={{ ...INPUT, fontFamily: 'var(--font-mono)', ...style, cursor: 'pointer' }} />
      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
            zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 18px', width: '100%', maxWidth: 260 }}>
            <div className="tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 600, color: 'var(--text)', textAlign: 'center', marginBottom: 16, minHeight: 34 }}>
              {draft || '0'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {KEYPAD_KEYS.map((key) => (
                <button key={key} type="button" onClick={() => tap(key)} style={{
                  background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10,
                  color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, padding: '12px 0', cursor: 'pointer',
                }}>{key}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="button" onClick={() => tap('C')} style={{
                flex: 1, background: 'transparent', border: '1px solid var(--border)', borderRadius: 10,
                color: 'var(--text-muted)', fontSize: 14, fontWeight: 700, padding: 10, cursor: 'pointer',
              }}>
                Clear
              </button>
              <button type="button" onClick={() => setOpen(false)} style={{
                flex: 1, background: 'var(--accent)', border: 'none', borderRadius: 10,
                color: 'var(--accent-contrast)', fontSize: 14, fontWeight: 700, padding: 10, cursor: 'pointer',
              }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
