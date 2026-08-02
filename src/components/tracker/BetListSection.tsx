'use client';

// The day-grouped bet list itself, plus its loading/empty states and the
// infinite-scroll sentinel that loads more pages as it comes into view.
import { Ref } from 'react';
import { OddsFormat } from '@/lib/types';
import { DayGroup } from '@/lib/dates';
import BetCard from './BetCard';
import Spinner from '@/components/Spinner';

const CONTENT_WIDTH = 720;

// Spinner shown while the first page of bets is loading.
function LoadingSpinner() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <Spinner style={{ marginBottom: 14 }} />
      <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>Loading slips…</p>
    </div>
  );
}

interface BetListSectionProps {
  loading: boolean;
  groups: DayGroup[];
  isEmpty: boolean;
  fmt: OddsFormat;
  hasMore: boolean;
  sentinelRef: Ref<HTMLDivElement>;
}

// Renders the day-grouped bet list with loading/empty states and an
// infinite-scroll sentinel that triggers loading more pages.
export default function BetListSection({ loading, groups, isEmpty, fmt, hasMore, sentinelRef }: BetListSectionProps) {
  return (
    <div style={{ maxWidth: CONTENT_WIDTH, margin: '0 auto', padding: '10px 20px 56px' }}>
      {loading && <LoadingSpinner />}

      {!loading && isEmpty && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>No bets match these filters.</p>
        </div>
      )}

      {groups.map(({ label, bets }, groupIndex) => (
        <div key={label} style={{ marginTop: groupIndex > 0 ? 24 : 0 }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--text-faint)',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            paddingBottom: 10, borderBottom: '1px solid var(--border)', marginBottom: 12,
          }}>
            {label}
          </div>
          {bets.map((bet, index) => (
            <div key={bet.id} className="stagger-in" style={{ ['--i' as string]: Math.min(index, 6) }}>
              <BetCard bet={bet} fmt={fmt} />
            </div>
          ))}
        </div>
      ))}

      {hasMore && (
        <div ref={sentinelRef} style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
          Loading more…
        </div>
      )}
    </div>
  );
}
