// Read, set, or clear the single active goal. Public read (progress shown on
// the Insights page) — admin-gated write, single active goal.
import { NextRequest, NextResponse } from 'next/server';
import { readGoal, writeGoal } from '@/lib/storage';
import { Goal } from '@/lib/types';
import { SESSION_COOKIE, isValidSession } from '@/lib/adminAuth';

export async function GET() {
  const goal = await readGoal();

  return NextResponse.json(goal);
}

// Sets the active goal, always starting its progress window from today.
export async function POST(req: NextRequest) {
  if (!isValidSession(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { targetUnits?: number; deadline?: string; note?: string };

  if (typeof body.targetUnits !== 'number' || !Number.isFinite(body.targetUnits) || !body.deadline) {
    return NextResponse.json({ error: 'Missing or invalid targetUnits/deadline' }, { status: 400 });
  }

  const goal: Goal = {
    targetUnits: body.targetUnits,
    deadline: body.deadline,
    note: body.note || undefined,
    startDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  await writeGoal(goal);

  return NextResponse.json(goal, { status: 201 });
}

// Clears the active goal.
export async function DELETE(req: NextRequest) {
  if (!isValidSession(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await writeGoal(null);

  return NextResponse.json({ success: true });
}
