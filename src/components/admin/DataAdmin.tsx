'use client';

// "Data" tab — export bets/bankroll as CSV or JSON, and import bets from a file.
import { useRef, useState } from 'react';
import { Bet, BankrollEntry } from '@/lib/types';
import { betsToCSV, betsToJSON, bankrollToCSV, bankrollToJSON, downloadFile, parseBetsCSV, ImportableBet } from '@/lib/exportImport';
import { SECTION, SECTION_TITLE } from './adminPanelStyles';

const BTN: React.CSSProperties = {
  background: 'transparent', border: '1px solid var(--border)', borderRadius: 8,
  color: 'var(--accent)', fontSize: 12.5, fontWeight: 600, padding: '8px 14px', cursor: 'pointer',
};

// Today's date as YYYY-MM-DD, used in export filenames.
function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function DataAdmin({ bets, onImported }: { bets: Bet[]; onImported: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  async function exportBankroll(format: 'csv' | 'json') {
    const entries: BankrollEntry[] = await fetch('/api/bankroll').then((response) => response.json());

    if (format === 'csv') {
      downloadFile(`bankroll-${todayStamp()}.csv`, bankrollToCSV(entries), 'text/csv');
    } else {
      downloadFile(`bankroll-${todayStamp()}.json`, bankrollToJSON(entries), 'application/json');
    }
  }

  async function handleFile(file: File) {
    setImporting(true);
    setError('');
    setResult('');

    try {
      const text = await file.text();
      let importBets: ImportableBet[];

      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);

        importBets = Array.isArray(parsed) ? parsed : [];
      } else {
        importBets = parseBetsCSV(text);
      }

      if (importBets.length === 0) {
        throw new Error('No bets found in file');
      }

      const res = await fetch('/api/admin/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bets: importBets }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResult(`Imported ${data.imported} bet${data.imported !== 1 ? 's' : ''}.`);
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <div style={SECTION}>
        <p style={SECTION_TITLE}>EXPORT BETS</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={BTN} onClick={() => downloadFile(`bets-${todayStamp()}.csv`, betsToCSV(bets), 'text/csv')}>Download CSV</button>
          <button style={BTN} onClick={() => downloadFile(`bets-${todayStamp()}.json`, betsToJSON(bets), 'application/json')}>Download JSON</button>
        </div>
      </div>

      <div style={SECTION}>
        <p style={SECTION_TITLE}>EXPORT BANKROLL</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={BTN} onClick={() => exportBankroll('csv')}>Download CSV</button>
          <button style={BTN} onClick={() => exportBankroll('json')}>Download JSON</button>
        </div>
      </div>

      <div style={SECTION}>
        <p style={SECTION_TITLE}>IMPORT BETS</p>
        <p style={{ fontSize: 11.5, color: 'var(--text-faint)', marginBottom: 12, maxWidth: '55ch' }}>
          Upload a CSV exported from this app, or a JSON array of bets. Imported bets are added alongside
          your existing ones — nothing is overwritten.
        </p>
        <input
          ref={fileRef} type="file" accept=".csv,.json" style={{ display: 'none' }} disabled={importing}
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file) {
              handleFile(file);
            }

            event.target.value = '';
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          style={{ ...BTN, background: 'var(--accent)', color: 'var(--accent-contrast)', border: 'none', cursor: importing ? 'not-allowed' : 'pointer', opacity: importing ? 0.6 : 1 }}
        >
          {importing ? 'Importing…' : 'Choose File…'}
        </button>
        {result && <p style={{ fontSize: 12, color: 'var(--won)', marginTop: 10 }}>{result}</p>}
        {error && <p style={{ fontSize: 12, color: 'var(--lost)', marginTop: 10 }}>{error}</p>}
      </div>
    </div>
  );
}
