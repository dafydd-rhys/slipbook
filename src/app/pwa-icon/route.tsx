import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { SITE_NAME } from '@/lib/config';

// Serves the larger square icons the web app manifest wants (192/512) —
// separate from the app/icon.tsx and app/apple-icon.tsx conventions, which
// are fixed at 32px/180px and only wire up <head> favicon tags, not the manifest.
export async function GET(req: NextRequest) {
  const size = Number(req.nextUrl.searchParams.get('size')) || 512;
  const initial = (SITE_NAME.trim()[0] ?? 'S').toUpperCase();
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0b0d12', color: '#c6963c', fontSize: size * 0.58, fontWeight: 700, fontFamily: 'sans-serif',
        }}
      >
        {initial}
      </div>
    ),
    { width: size, height: size }
  );
}
