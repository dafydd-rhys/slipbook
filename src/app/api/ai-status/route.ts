import { NextResponse } from 'next/server';

// Public — lets the client show a disabled state (with a link to the
// Knowledge Base) for AI features instead of only finding out after
// clicking, without ever exposing the key itself.
export async function GET() {
  return NextResponse.json({ enabled: !!process.env.ANTHROPIC_API_KEY });
}
