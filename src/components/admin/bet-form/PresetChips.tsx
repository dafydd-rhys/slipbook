'use client';

// Row of tap-to-fill buttons, e.g. the stake presets under the Stake field.
export default function PresetChips({ values, onPick, prefix = '' }: { values: string[]; onPick: (value: string) => void; prefix?: string }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
      {values.map((value) => (
        <button key={value} type="button" onClick={() => onPick(value)} style={{
          background: 'transparent', border: '1px solid var(--border)', borderRadius: 6,
          color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 11, padding: '3px 8px', cursor: 'pointer',
        }}>
          {prefix}{value}
        </button>
      ))}
    </div>
  );
}
