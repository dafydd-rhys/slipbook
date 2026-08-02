// Static reference page explaining every term and feature in the app — bet
// mechanics, analytics, and what each admin tool does. Content lives in
// KB_SECTIONS below as data so the page component itself just renders a list.
import { SITE_NAME } from '@/lib/config';
import { KB_SECTIONS } from './sections';

const CONTENT_WIDTH = 760;

// Jump-link index of every section, generated from KB_SECTIONS.
function TableOfContents() {
  return (
    <nav style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
      padding: '14px 16px', marginBottom: 32,
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.08em', marginBottom: 10 }}>
        CONTENTS
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '4px 12px' }}>
        {KB_SECTIONS.map((section) => (
          <a key={section.id} href={`#${section.id}`} style={{ fontSize: 12.5, color: 'var(--accent)', textDecoration: 'none', padding: '3px 0' }}>
            {section.title}
          </a>
        ))}
      </div>
    </nav>
  );
}

// Public knowledge base page — see file header.
export default function KnowledgeBasePage() {
  return (
    <div style={{ maxWidth: CONTENT_WIDTH, margin: '0 auto', padding: '24px 20px 64px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
        Knowledge Base
      </h1>
      <p style={{ fontSize: 13, color: 'var(--text-faint)', marginBottom: 24, maxWidth: '60ch' }}>
        Everything {SITE_NAME} tracks and how to read it — bet mechanics, analytics terms, and what each admin tool does.
      </p>

      <TableOfContents />

      {KB_SECTIONS.map(({ id, title, Content }) => (
        <section key={id} id={id} style={{ scrollMarginTop: 84, marginBottom: 36 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: 16, fontWeight: 700,
            color: 'var(--accent)', letterSpacing: '0.02em', marginBottom: 10,
            paddingBottom: 8, borderBottom: '1px solid var(--border)',
          }}>
            {title}
          </h2>
          <div style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            <Content />
          </div>
        </section>
      ))}
    </div>
  );
}
