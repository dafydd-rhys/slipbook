// Generated Apple touch icon — a plain glyph of the site's first initial.
import { ImageResponse } from 'next/og';
import { SITE_NAME } from '@/lib/config';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  const initial = (SITE_NAME.trim()[0] ?? 'S').toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0b0d12', color: '#c6963c', fontSize: 104, fontWeight: 700, fontFamily: 'sans-serif',
        }}
      >
        {initial}
      </div>
    ),
    { ...size }
  );
}
