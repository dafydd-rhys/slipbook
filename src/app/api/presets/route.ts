import { NextRequest, NextResponse } from 'next/server';
import { readPresets, addPreset } from '@/lib/db';
import { FilterPreset } from '@/lib/filters';
import { SESSION_COOKIE, isValidSession } from '@/lib/adminAuth';

// Public read (anyone on the Tracker page can apply a saved preset) — admin-gated write.
export async function GET() {
  const data = await readPresets();
  return NextResponse.json(data.presets);
}

export async function POST(req: NextRequest) {
  if (!isValidSession(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json() as Omit<FilterPreset, 'id'>;
  const preset: FilterPreset = { ...body, id: crypto.randomUUID() };
  const created = await addPreset(preset);
  return NextResponse.json(created, { status: 201 });
}
