// "Suggest Result": web-searches each leg of a pending bet for a reviewable settlement suggestion.
import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, isValidSession } from '@/lib/adminAuth';
import { suggestSettlement } from '@/lib/slipParser';
import { SportType } from '@/lib/types';

export async function POST(req: NextRequest) {
  if (!isValidSession(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not set — settlement suggestions are unavailable.' },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({})) as {
    title?: string; eventDate?: string;
    legs?: { selection: string; market: string; matchup: string; sport: SportType }[];
  };

  if (!body.title || !body.eventDate || !Array.isArray(body.legs) || body.legs.length === 0) {
    return NextResponse.json({ error: 'Missing bet title, date, or legs' }, { status: 400 });
  }

  try {
    const result = await suggestSettlement({ title: body.title, eventDate: body.eventDate, legs: body.legs });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to look up results' }, { status: 500 });
  }
}
