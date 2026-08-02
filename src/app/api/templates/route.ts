// List or save bet templates. Admin-only convenience tool — gate both read and write.
import { NextRequest, NextResponse } from 'next/server';
import { readTemplates, addTemplate } from '@/lib/storage';
import { BetTemplate } from '@/lib/types';
import { SESSION_COOKIE, isValidSession } from '@/lib/adminAuth';

function authed(req: NextRequest) {
  return isValidSession(req.cookies.get(SESSION_COOKIE)?.value);
}

export async function GET(req: NextRequest) {
  if (!authed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await readTemplates();

  return NextResponse.json(data.templates);
}

// Saves a new bet template, assigning it a fresh id.
export async function POST(req: NextRequest) {
  if (!authed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as Omit<BetTemplate, 'id'>;
  const template: BetTemplate = { ...body, id: crypto.randomUUID() };
  const created = await addTemplate(template);

  return NextResponse.json(created, { status: 201 });
}
