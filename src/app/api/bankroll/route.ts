// List bankroll entries, or add a new deposit/withdrawal/adjustment (admin only).
import { NextRequest, NextResponse } from 'next/server';
import { readBankroll, addBankrollEntry } from '@/lib/storage';
import { BankrollEntry } from '@/lib/types';
import { SESSION_COOKIE, isValidSession } from '@/lib/adminAuth';

// Public — every bankroll entry.
export async function GET() {
  const data = await readBankroll();

  return NextResponse.json(data.entries);
}

// Adds a new bankroll entry, assigning it a fresh id.
export async function POST(req: NextRequest) {
  if (!isValidSession(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as Omit<BankrollEntry, 'id'>;
  const entry: BankrollEntry = { ...body, id: crypto.randomUUID() };
  const created = await addBankrollEntry(entry);

  return NextResponse.json(created, { status: 201 });
}
