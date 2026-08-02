'use client';

export interface StoredSummary { text: string; period: string; generatedAt: string }

// Cached AI performance summary shown at the top of Insights — regenerated from the admin Reports tab.
export default function AiSummaryBanner({ summary }: { summary: StoredSummary | null }) {
  if (!summary) {
    return null;
  }

  return (
    <div style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.06em', marginBottom: 6 }}>
        AI SUMMARY — {summary.period.toUpperCase()}
      </div>
      <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55 }}>{summary.text}</p>
      <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 8 }}>
        Generated {new Date(summary.generatedAt).toLocaleDateString('en-GB')} — regenerate from Admin
      </div>
    </div>
  );
}
