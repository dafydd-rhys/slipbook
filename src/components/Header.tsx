'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SITE_NAME } from '@/lib/config';
import ThemeToggle from './ThemeToggle';

export const CONTENT_WIDTH = 900;

const NAV_LINKS = [
  { href: '/', label: 'Tracker' },
  { href: '/insights', label: 'Insights' },
  { href: '/bankroll', label: 'Bankroll' },
  { href: '/knowledge-base', label: 'Knowledge Base' },
];

export default function Header() {
  const pathname = usePathname();
  const onAdmin = pathname.startsWith('/admin');

  return (
    <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: CONTENT_WIDTH, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
            <span
              style={{
                width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                background: 'linear-gradient(155deg, var(--accent) 0%, var(--accent-strong) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent-contrast)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
              }}
            >
              {SITE_NAME.charAt(0).toUpperCase()}
            </span>
            <span style={{
              color: 'var(--text)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
              textTransform: 'uppercase', letterSpacing: '0.01em', lineHeight: 1, whiteSpace: 'nowrap',
            }}>
              {SITE_NAME}
            </span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <ThemeToggle />
            {!onAdmin && (
              <Link href="/admin" style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    background: 'transparent', border: '1px solid var(--border)', borderRadius: 7,
                    color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600,
                    letterSpacing: '0.1em', padding: '6px 13px', cursor: 'pointer', transition: 'all 0.15s',
                    textTransform: 'uppercase', whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-faint)'; }}
                >
                  Admin
                </div>
              </Link>
            )}
          </div>
        </div>

        {!onAdmin && (
          <nav className="no-scrollbar" style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 1 }}>
            {NAV_LINKS.map(link => {
              const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    textDecoration: 'none', flexShrink: 0,
                    fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 600, letterSpacing: '0.04em',
                    color: active ? 'var(--accent)' : 'var(--text-faint)',
                    padding: '10px 12px 11px', borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                    whiteSpace: 'nowrap', transition: 'color 0.15s, border-color 0.15s',
                  }}
                >
                  {link.label.toUpperCase()}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
