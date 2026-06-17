'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const CONTENT_WIDTH = 720;

export default function Header() {
  const pathname = usePathname();
  const onAdmin = pathname === '/admin';

  return (
    <header style={{ background: '#0d0d20', borderBottom: '1px solid #1a1a38' }} className="sticky top-0 z-50">
      <div
        style={{
          maxWidth: CONTENT_WIDTH,
          margin: '0 auto',
          padding: '0 20px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #4c1d95 0%, #1e1b4b 100%)',
              border: '1px solid #6d28d9',
              borderRadius: 8,
              padding: '7px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 17, letterSpacing: '-0.03em', lineHeight: 1 }}>
              strz
            </span>
            <span style={{ color: '#a78bfa', fontWeight: 900, fontSize: 17, letterSpacing: '-0.03em', lineHeight: 1 }}>
              Slipz
            </span>
          </div>
        </Link>

        {!onAdmin && (
          <Link href="/admin" style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: 'transparent',
                border: '1px solid #1e1e3e',
                borderRadius: 7,
                color: '#475569',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                padding: '6px 13px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = '#6d28d9';
                (e.currentTarget as HTMLElement).style.color = '#a78bfa';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = '#1e1e3e';
                (e.currentTarget as HTMLElement).style.color = '#475569';
              }}
            >
              ADMIN
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}
