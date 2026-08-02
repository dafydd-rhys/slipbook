'use client';

const CONTENT_WIDTH = 720;

// Pulsing "N LIVE" pill shown above the bet list when any filtered bet is still pending.
export default function LivePicksBadge({ count }: { count: number }) {
  if (count === 0) {
    return null;
  }

  return (
    <div style={{ maxWidth: CONTENT_WIDTH, margin: '0 auto', padding: '10px 20px 0' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        background: 'var(--pending-soft)', border: '1px solid color-mix(in srgb, var(--pending) 45%, transparent)',
        borderRadius: 20, color: 'var(--pending)', fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 700,
        padding: '5px 14px',
      }}>
        <span className="animate-pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--pending)', display: 'block' }} />
        {count} LIVE
      </div>
    </div>
  );
}
