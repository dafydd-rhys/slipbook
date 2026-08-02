// PIN login: checks the submitted PIN server-side and sets/clears the admin session cookie.
import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_PIN } from '@/lib/config';
import { SESSION_COOKIE, sessionToken, isValidSession } from '@/lib/adminAuth';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 12, // 12h
};

// Whether the current request already carries a valid session cookie.
export async function GET(req: NextRequest) {
  const authed = isValidSession(req.cookies.get(SESSION_COOKIE)?.value);

  return NextResponse.json({ authed });
}

// Checks the submitted PIN and, if correct, sets the session cookie.
export async function POST(req: NextRequest) {
  const { pin } = await req.json().catch(() => ({})) as { pin?: string };

  if (pin !== ADMIN_PIN) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, sessionToken(), COOKIE_OPTS);

  return res;
}

// Logs out by clearing the session cookie.
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);

  return res;
}
