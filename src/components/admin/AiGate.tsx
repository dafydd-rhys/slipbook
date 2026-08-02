'use client';

import { useEffect, useState } from 'react';

export function useAiEnabled(): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    fetch('/api/ai-status').then(r => r.json()).then(d => setEnabled(!!d.enabled)).catch(() => setEnabled(false));
  }, []);
  return enabled;
}

// Dims whatever's passed in and overlays a message + Knowledge Base link when
// ANTHROPIC_API_KEY isn't configured. `enabled === null` (still loading)
// renders children normally rather than flashing the overlay on every load.
export default function AiGate({ enabled, anchor = 'import', children }: {
  enabled: boolean | null; anchor?: string; children: React.ReactNode;
}) {
  if (enabled !== false) return <>{children}</>;
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ opacity: 0.35, pointerEvents: 'none', filter: 'grayscale(0.4)' }} aria-hidden>
        {children}
      </div>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 8, textAlign: 'center', padding: 16,
      }}>
        <span style={{
          fontSize: 12.5, fontWeight: 600, color: 'var(--text)', background: 'var(--surface)',
          padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)',
        }}>
          AI features aren&apos;t configured on this instance
        </span>
        <a href={`/knowledge-base#${anchor}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>
          Learn more in the Knowledge Base →
        </a>
      </div>
    </div>
  );
}
