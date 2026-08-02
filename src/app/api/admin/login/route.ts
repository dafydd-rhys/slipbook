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

export async function GET(req: NextRequest) {
  const authed = isValidSession(req.cookies.get(SESSION_COOKIE)?.value);
  return NextResponse.json({ authed });
}

export async function POST(req: NextRequest) {
  const { pin } = await req.json().catch(() => ({})) as { pin?: string };
  if (pin !== ADMIN_PIN) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, sessionToken(), COOKIE_OPTS);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
