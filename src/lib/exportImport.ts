import { Bet, BankrollEntry } from './types';

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Legs are packed into a single column: sport|selection|market|matchup|odds|result,
// legs joined by ';;'. Dense, but keeps the export one-row-per-bet and fully
// round-trippable through parseBetsCSV below.
const BET_COLUMNS = [
  'date', 'title', 'type', 'bookmaker', 'tags', 'totalOdds', 'stake',
  'result', 'returns', 'cashedOut', 'notes', 'legs',
] as const;

function legToCell(l: Bet['legs'][number]): string {
  return [l.sport ?? 'other', l.selection, l.market, l.matchup, l.odds, l.result].join('|');
}

export function betsToCSV(bets: Bet[]): string {
  const rows = bets.map(b => [
    b.date, b.title, b.type, b.bookmaker ?? '', (b.tags ?? []).join(';'),
    b.totalOdds, b.stake, b.result, b.returns ?? '', b.cashedOut ? 'yes' : '',
    b.notes ?? '', b.legs.map(legToCell).join(';;'),
  ].map(csvCell).join(','));
  return [BET_COLUMNS.join(','), ...rows].join('\n');
}

export function betsToJSON(bets: Bet[]): string {
  return JSON.stringify(bets, null, 2);
}

const BANKROLL_COLUMNS = ['date', 'type', 'amount', 'note'] as const;

export function bankrollToCSV(entries: BankrollEntry[]): string {
  const rows = entries.map(e => [e.date, e.type, e.amount, e.note ?? ''].map(csvCell).join(','));
  return [BANKROLL_COLUMNS.join(','), ...rows].join('\n');
}

export function bankrollToJSON(entries: BankrollEntry[]): string {
  return JSON.stringify(entries, null, 2);
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ── CSV import (round-trips betsToCSV's own format) ─────────────────────────
function parseCSVLine(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { cur += ch; }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { cells.push(cur); cur = ''; }
      else cur += ch;
    }
  }
  cells.push(cur);
  return cells;
}

export interface ImportableBet {
  date: string; title: string; type: string; bookmaker?: string; tags?: string[];
  totalOdds: number; stake: number; result: string; returns?: number; cashedOut?: boolean; notes?: string;
  legs: { sport: string; selection: string; market: string; matchup: string; odds: number; result: string }[];
}

export function parseBetsCSV(text: string): ImportableBet[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];
  const header = parseCSVLine(lines[0]).map(h => h.trim());
  const idx = (col: string) => header.indexOf(col);

  return lines.slice(1).map(line => {
    const cells = parseCSVLine(line);
    const get = (col: string) => cells[idx(col)] ?? '';
    const legs = get('legs').split(';;').filter(Boolean).map(chunk => {
      const [sport, selection, market, matchup, odds, result] = chunk.split('|');
      return { sport: sport || 'other', selection: selection || '', market: market || '', matchup: matchup || '', odds: Number(odds) || 1, result: result || 'pending' };
    });
    return {
      date: get('date'),
      title: get('title'),
      type: get('type'),
      bookmaker: get('bookmaker') || undefined,
      tags: get('tags') ? get('tags').split(';').filter(Boolean) : undefined,
      totalOdds: Number(get('totalOdds')) || 1,
      stake: Number(get('stake')) || 0,
      result: get('result') || 'pending',
      returns: get('returns') ? Number(get('returns')) : undefined,
      cashedOut: get('cashedOut') === 'yes',
      notes: get('notes') || undefined,
      legs,
    };
  });
}
