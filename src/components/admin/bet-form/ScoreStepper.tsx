'use client';

// Labelled +/- counter used for home/away/penalty scores in the Outcome section.
import { INPUT, LABEL } from '../adminPanelStyles';

export default function ScoreStepper({ label, value, onChange }: { label: string; value: number | undefined; onChange: (value: number) => void }) {
  const currentValue = value ?? 0;
  const stepBtn: React.CSSProperties = {
    background: 'transparent', border: '1px solid var(--border)', borderRadius: 6,
    color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, width: 28, height: 28, cursor: 'pointer', flexShrink: 0,
  };

  return (
    <div>
      <label style={LABEL}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button type="button" disabled={currentValue <= 0} onClick={() => onChange(Math.max(0, currentValue - 1))} style={{
          ...stepBtn, cursor: currentValue <= 0 ? 'not-allowed' : 'pointer', opacity: currentValue <= 0 ? 0.35 : 1,
        }}>−</button>
        <input type="number" min="0" value={currentValue}
          onChange={(event) => onChange(Math.max(0, parseInt(event.target.value) || 0))}
          style={{ ...INPUT, fontFamily: 'var(--font-mono)', width: 44, textAlign: 'center', padding: '4px 2px', flexShrink: 0 }} />
        <button type="button" onClick={() => onChange(currentValue + 1)} style={stepBtn}>+</button>
      </div>
    </div>
  );
}
