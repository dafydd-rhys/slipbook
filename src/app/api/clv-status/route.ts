import { NextResponse } from 'next/server';

// Public — lets the client show/hide CLV-related UI without exposing the key itself.
export async function GET() {
  return NextResponse.json({ enabled: !!process.env.THE_ODDS_API_KEY });
}
