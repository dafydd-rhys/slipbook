import { ImageResponse } from 'next/og';
import { SITE_NAME } from '@/lib/config';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  const initial = (SITE_NAME.trim()[0] ?? 'S').toUpperCase();
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0b0d12', border: '2px solid #c6963c', borderRadius: 7,
          color: '#c6963c', fontSize: 19, fontWeight: 700, fontFamily: 'sans-serif',
        }}
      >
        {initial}
      </div>
    ),
    { ...size }
  );
}
