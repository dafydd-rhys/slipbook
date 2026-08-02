// Site footer — name and a Knowledge Base link, shown on every page via the root layout.
import Link from 'next/link';
import { SITE_NAME } from '@/lib/config';

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, letterSpacing: '0.02em',
          textTransform: 'uppercase', color: 'var(--text-faint)',
        }}>
          {SITE_NAME}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/knowledge-base" style={{
            textDecoration: 'none', fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-faint)',
          }}>
            Knowledge Base
          </Link>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-faint)' }}>
            © {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </footer>
  );
}
