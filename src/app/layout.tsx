// Root layout: fonts, page <head> metadata, the theme-init/service-worker
// bootstrap scripts, and the persistent Header/Footer chrome.
import type { Metadata, Viewport } from 'next';
import { Oswald, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/config';

const oswald = Oswald({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-oswald' });
const plexSans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-plex-sans' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex-mono' });

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  appleWebApp: { title: SITE_NAME, statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  themeColor: '#0b0d12',
};

// Runs before paint so a stored theme preference applies immediately —
// otherwise the page would flash the OS-default theme, then swap.
const THEME_INIT_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') {
      document.documentElement.setAttribute('data-theme', stored);
    }
  } catch (e) {}
})();
`;

// Registers the offline-support service worker — best-effort, never blocks
// rendering. Production only: a service worker caching every same-origin GET
// fights Turbopack's HMR chunk loading in dev.
const SW_REGISTER_SCRIPT = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').catch(function() {});
  });
}
`;

// Cleans up any service worker + cache left behind by a dev build that ran
// before this production-only gate existed.
const SW_UNREGISTER_SCRIPT = `
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(regs) {
    regs.forEach(function(reg) { reg.unregister(); });
  });
  if ('caches' in window) {
    caches.keys().then(function(keys) { keys.forEach(function(key) { caches.delete(key); }); });
  }
}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${oswald.variable} ${plexSans.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <script dangerouslySetInnerHTML={{ __html: process.env.NODE_ENV === 'production' ? SW_REGISTER_SCRIPT : SW_UNREGISTER_SCRIPT }} />
        <Header />
        <main style={{ flex: 1 }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
