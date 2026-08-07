'use client';

import { useEffect, useState } from 'react';

// Whether THE_ODDS_API_KEY is configured server-side — null while the check is in flight.
export function useClvEnabled(): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    fetch('/api/clv-status').then((r) => r.json()).then((d) => setEnabled(!!d.enabled)).catch(() => setEnabled(false));
  }, []);
  return enabled;
}
