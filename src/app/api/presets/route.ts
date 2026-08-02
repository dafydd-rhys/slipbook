// List or save saved filter presets. Public read (anyone on the Tracker page
// can apply a saved preset) — admin-gated write.
import { NextRequest, NextResponse } from 'next/server';
import { readPresets, addPreset } from '@/lib/storage';
import { FilterPreset } from '@/lib/filters';
import { SESSION_COOKIE, isValidSession } from '@/lib/adminAuth';

export async function GET() {
  const data = await readPresets();

  return NextResponse.json(data.presets);
}

// Saves a new filter preset, assigning it a fresh id.
export async function POST(req: NextRequest) {
  if (!isValidSession(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as Omit<FilterPreset, 'id'>;
  const preset: FilterPreset = { ...body, id: crypto.randomUUID() };
  const created = await addPreset(preset);

  return NextResponse.json(created, { status: 201 });
}
