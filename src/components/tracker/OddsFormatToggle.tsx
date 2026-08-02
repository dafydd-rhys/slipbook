'use client';

// Small top-right dropdown controlling whether odds display as decimal/fraction/American.
import { OddsFormat } from '@/lib/types';

const CONTENT_WIDTH = 720;

const SELECT_STYLE: React.CSSProperties = {
  background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8,
  color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 600, padding: '5px 8px',
  outline: 'none', cursor: 'pointer',
};

const FORMAT_LABELS: Record<OddsFormat, string> = {
  decimal: 'Decimal',
  fraction: 'Fraction',
  us: 'American',
};
const FORMATS: OddsFormat[] = ['decimal', 'fraction', 'us'];

// Dropdown for switching how odds are displayed across the whole page.
export default function OddsFormatToggle({ fmt, onChange }: { fmt: OddsFormat; onChange: (format: OddsFormat) => void }) {
  return (
    <div style={{ marginTop: 8, borderBottom: '1px solid var(--border-soft)' }}>
      <div style={{
        maxWidth: CONTENT_WIDTH, margin: '0 auto', padding: '0 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        height: 36,
      }}>
        <select value={fmt} onChange={(event) => onChange(event.target.value as OddsFormat)} style={SELECT_STYLE}>
          {FORMATS.map((format) => <option key={format} value={format}>{FORMAT_LABELS[format]}</option>)}
        </select>
      </div>
    </div>
  );
}
