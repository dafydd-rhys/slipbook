// CSV/JSON export and CSV import for bets and bankroll entries — the admin Data tab.
import { Bet, BankrollEntry } from './types';

// Quotes a CSV cell if it contains a comma, quote, or newline.
function csvCell(value: string | number): string {
  const stringValue = String(value);

  return /[",\n]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
}

// Legs are packed into a single column: sport|selection|market|matchup|odds|result,
// legs joined by ';;'. Dense, but keeps the export one-row-per-bet and fully
// round-trippable through parseBetsCSV below.
const BET_COLUMNS = [
  'date', 'title', 'type', 'bookmaker', 'tags', 'totalOdds', 'stake',
  'result', 'returns', 'cashedOut', 'notes', 'legs',
] as const;

// Packs a single leg into its pipe-delimited CSV cell.
function legToCell(leg: Bet['legs'][number]): string {
  return [leg.sport ?? 'other', leg.selection, leg.market, leg.matchup, leg.odds, leg.result].join('|');
}

// Every bet as a CSV row, header first.
export function betsToCSV(bets: Bet[]): string {
  const rows = bets.map((bet) => [
    bet.date, bet.title, bet.type, bet.bookmaker ?? '', (bet.tags ?? []).join(';'),
    bet.totalOdds, bet.stake, bet.result, bet.returns ?? '', bet.cashedOut ? 'yes' : '',
    bet.notes ?? '', bet.legs.map(legToCell).join(';;'),
  ].map(csvCell).join(','));

  return [BET_COLUMNS.join(','), ...rows].join('\n');
}

// Every bet as a pretty-printed JSON array.
export function betsToJSON(bets: Bet[]): string {
  return JSON.stringify(bets, null, 2);
}

const BANKROLL_COLUMNS = ['date', 'type', 'amount', 'note'] as const;

// Every bankroll entry as a CSV row, header first.
export function bankrollToCSV(entries: BankrollEntry[]): string {
  const rows = entries.map((entry) => [entry.date, entry.type, entry.amount, entry.note ?? ''].map(csvCell).join(','));

  return [BANKROLL_COLUMNS.join(','), ...rows].join('\n');
}

// Every bankroll entry as a pretty-printed JSON array.
export function bankrollToJSON(entries: BankrollEntry[]): string {
  return JSON.stringify(entries, null, 2);
}

// Triggers a browser download of the given text content.
export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// ── CSV import (round-trips betsToCSV's own format) ─────────────────────────

// Splits one CSV line into cells, honoring quoted fields and escaped quotes.
function parseCSVLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(current);

  return cells;
}

export interface ImportableBet {
  date: string; title: string; type: string; bookmaker?: string; tags?: string[];
  totalOdds: number; stake: number; result: string; returns?: number; cashedOut?: boolean; notes?: string;
  legs: { sport: string; selection: string; market: string; matchup: string; odds: number; result: string }[];
}

// Parses a CSV export (this module's own format, or any file with matching
// headers) back into importable bets.
export function parseBetsCSV(text: string): ImportableBet[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return [];
  }

  const header = parseCSVLine(lines[0]).map((column) => column.trim());
  const columnIndex = (column: string) => header.indexOf(column);

  return lines.slice(1).map((line) => {
    const cells = parseCSVLine(line);
    const get = (column: string) => cells[columnIndex(column)] ?? '';
    const legs = get('legs').split(';;').filter(Boolean).map((chunk) => {
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
