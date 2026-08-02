'use client';

import { useEffect, useState } from 'react';

// Whether ANTHROPIC_API_KEY is configured server-side — null while the check is in flight.
export function useAiEnabled(): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    fetch('/api/ai-status').then((r) => r.json()).then((d) => setEnabled(!!d.enabled)).catch(() => setEnabled(false));
  }, []);
  return enabled;
}
