// Deployment-specific settings, configurable via .env.local — see .env.example.
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Slipbook';
export const SITE_DESCRIPTION = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Personal betting tracker';

// Server-only — deliberately NOT prefixed with NEXT_PUBLIC_ so it never
// reaches the client JS bundle. Only import this from server code
// (route handlers, src/lib/adminAuth.ts) — never from a 'use client' file.
export const ADMIN_PIN = process.env.ADMIN_PIN || '000000';

// ISO 4217 currency code (e.g. GBP, USD, EUR) — used for stake/returns entry
// in the admin area only. The public tracker view never shows real currency,
// only anonymised "units" (see UNIT_SIZE below).
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || 'GBP';

export const CURRENCY_SYMBOL = currencySymbol(CURRENCY);

// Resolves an ISO currency code to its display symbol, e.g. "GBP" -> "£".
// Falls back to the code itself if Intl doesn't recognize it.
function currencySymbol(code: string): string {
  try {
    const parts = new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).formatToParts(0);
    const currencyPart = parts.find((part) => part.type === 'currency');

    return currencyPart?.value ?? code;
  } catch {
    return code;
  }
}

// How much stake/returns currency equals 1 "unit" in the public tracker view.
export const UNIT_SIZE = Number(process.env.NEXT_PUBLIC_UNIT_SIZE) || 100;
