'use client';

// Generic pill tab strip reused for the Calendar/Breakdowns/Patterns tabs,
// the breakdown-dimension picker, and the correlation-pair picker.
export default function InsightsTabBar<T extends string>({ options, value, onChange }: {
  options: readonly T[]; value: T; onChange: (option: T) => void;
}) {
  return (
    <div className="no-scrollbar" style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 18 }}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: active ? 700 : 600,
              letterSpacing: '0.03em', padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
              background: active ? 'var(--accent)' : 'transparent',
              border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
              color: active ? 'var(--accent-contrast)' : 'var(--text-muted)',
            }}
          >
            {opt.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
