'use client';

export interface StatItem { label: string; value: string; color: string }

// Compact inline row of top-line stats under the filter pills.
export default function StatsRow({ items }: { items: StatItem[] }) {
  return (
    <div className="stats-grid" style={{ marginTop: 16, marginBottom: 4, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
      {items.map((item, index) => (
        <div key={index} className="stats-item" style={{ borderRight: index < items.length - 1 ? '1px solid var(--border)' : undefined }}>
          <div className="tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 600, color: item.color, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            {item.value}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.06em', marginTop: 3 }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
