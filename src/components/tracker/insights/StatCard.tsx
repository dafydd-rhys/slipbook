'use client';

// Small tile used for the streak/drawdown numbers on the Patterns tab.
export default function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ flex: '1 1 140px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '13px 14px' }}>
      <div className="tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: 17, fontWeight: 600, color: color ?? 'var(--text)' }}>{value}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.06em', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
