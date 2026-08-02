import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, isValidSession } from '@/lib/adminAuth';
import { parseSlipText } from '@/lib/slipParser';

export async function POST(req: NextRequest) {
  if (!isValidSession(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not set — natural-language entry is unavailable.' },
      { status: 500 }
    );
  }
  const { text } = await req.json().catch(() => ({})) as { text?: string };
  if (!text || !text.trim()) {
    return NextResponse.json({ error: 'Describe the bet first' }, { status: 400 });
  }
  try {
    const result = await parseSlipText(text);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to parse bet description' }, { status: 500 });
  }
}
