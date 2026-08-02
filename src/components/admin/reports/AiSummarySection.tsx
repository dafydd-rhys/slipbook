'use client';

// Generates a short factual AI summary of performance over a chosen period —
// the same text shown at the top of the public Insights page.
import { useEffect, useState } from 'react';
import { FilterType } from '@/lib/types';
import AiGate from '../AiGate';
import { SECTION, SECTION_TITLE, SELECT } from '../adminPanelStyles';
import { AI_SUMMARY_COST_ESTIMATE } from '@/lib/aiCostEstimates';

interface StoredSummary { text: string; period: string; generatedAt: string }

const PERIOD_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'last90', label: 'Last 90 Days' },
  { value: 'year', label: 'Last Year' },
  { value: 'all', label: 'All Time' },
];

export default function AiSummarySection({ aiEnabled }: { aiEnabled: boolean | null }) {
  const [summary, setSummary] = useState<StoredSummary | null>(null);
  const [period, setPeriod] = useState<FilterType>('last30');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/summary').then((response) => response.ok ? response.json() : null).then(setSummary).catch(() => {});
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setError('');

    try {
      const res = await fetch('/api/admin/summary', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ period }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div style={SECTION}>
      <p style={SECTION_TITLE}>AI PERFORMANCE SUMMARY</p>
      <AiGate enabled={aiEnabled} anchor="ai-summary">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={period} onChange={(event) => setPeriod(event.target.value as FilterType)} style={SELECT}>
            {PERIOD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <button onClick={handleGenerate} disabled={generating} style={{
            background: 'var(--accent)', border: 'none', borderRadius: 8, color: 'var(--accent-contrast)',
            fontSize: 13, fontWeight: 700, padding: '8px 16px', cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.6 : 1,
          }}>
            {generating ? 'Generating…' : 'Generate Summary'}
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 10 }}>~{AI_SUMMARY_COST_ESTIMATE} in AI usage per generation.</p>
        {error && <p style={{ fontSize: 12, color: 'var(--lost)', marginBottom: 10 }}>{error}</p>}
        {summary ? (
          <div style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.06em', marginBottom: 6 }}>
              {summary.period.toUpperCase()}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55 }}>{summary.text}</p>
            <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 8 }}>
              Generated {new Date(summary.generatedAt).toLocaleString('en-GB')}
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>No summary generated yet.</p>
        )}
      </AiGate>
    </div>
  );
}
