// Shared inline-style constants for the admin panel. Every admin tab/section
// used to keep its own copy of these — centralised here so a visual tweak
// (e.g. field border radius) only needs to happen once.
import { BetResult } from '@/lib/types';

export const SECTION: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
  padding: 16, marginBottom: 14,
};

export const SECTION_TITLE: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.1em',
  marginBottom: 14, textTransform: 'uppercase',
};

export const INPUT: React.CSSProperties = {
  background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
  color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 13, padding: '8px 10px', width: '100%', outline: 'none',
};

export const SELECT: React.CSSProperties = { ...INPUT };

export const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.06em',
  display: 'block', marginBottom: 4, textTransform: 'uppercase',
};

export const FIELD: React.CSSProperties = { marginBottom: 12 };

export const RESULT_COLORS: Record<BetResult, string> = {
  won: 'var(--won)', lost: 'var(--lost)', void: 'var(--void)', pending: 'var(--pending)',
};
