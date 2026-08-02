// Admin session cookie helpers. Server-only — never import this from a 'use client' file.
import { createHash } from 'crypto';
import { ADMIN_PIN } from './config';

export const SESSION_COOKIE = 'admin_session';

// Deterministic token derived from the PIN — lets us verify a session
// cookie statelessly (no session store) without ever sending the PIN
// itself to the browser.
export function sessionToken(): string {
  return createHash('sha256').update(ADMIN_PIN).digest('hex');
}

// True if the given session cookie value matches the current PIN's token.
export function isValidSession(token: string | undefined | null): boolean {
  return !!token && token === sessionToken();
}
