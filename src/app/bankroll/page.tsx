'use client';

// Public bankroll page: current balance, deposit/withdrawal/P&L stat tiles,
// the running-balance chart, and an optional full entry list.
import { useEffect, useState } from 'react';
import { Bet, BankrollEntry } from '@/lib/types';
import { computeBankrollSeries } from '@/lib/bankroll';
import { formatUnits } from '@/lib/units';
import BankrollChart from '@/components/charts/BankrollChart';
import Spinner from '@/components/Spinner';

const CONTENT_WIDTH = 720;

// Small labelled number tile used for the top-line balance/deposit/withdrawal/P&L stats.
function StatTile({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 120, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '13px 14px' }}>
      <div className="tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: 17, fontWeight: 600, color: color ?? 'var(--text)' }}>{value}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.06em', marginTop: 4 }}>{label}</div>
    </div>
  );
}

// Public bankroll page — see file header.
export default function BankrollPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [entries, setEntries] = useState<BankrollEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/bets').then((response) => response.json()),
      fetch('/api/bankroll').then((response) => response.json()),
    ]).then(([betsData, entriesData]) => {
      setBets(betsData);
      setEntries(entriesData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const series = computeBankrollSeries(bets, entries);

  return (
    <div className="rise-in" style={{ maxWidth: CONTENT_WIDTH, margin: '0 auto', padding: '24px 20px 56px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
        Bankroll
      </h1>
      <p style={{ fontSize: 13, color: 'var(--text-faint)', marginBottom: 20, maxWidth: '60ch' }}>
        Running balance from deposits, withdrawals, and settled bet P&amp;L — set on the Admin side.
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spinner />
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
            <StatTile label="CURRENT BALANCE" value={formatUnits(series.currentBalance)} color={series.currentBalance >= 0 ? 'var(--won)' : 'var(--lost)'} />
            <StatTile label="TOTAL DEPOSITED" value={formatUnits(series.totalDeposited)} />
            <StatTile label="TOTAL WITHDRAWN" value={formatUnits(series.totalWithdrawn)} />
            <StatTile label="BETTING P&L" value={`${series.bettingPnl >= 0 ? '+' : ''}${formatUnits(series.bettingPnl)}`} color={series.bettingPnl >= 0 ? 'var(--won)' : 'var(--lost)'} />
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 12px 8px', marginBottom: 18 }}>
            <BankrollChart points={series.points} />
          </div>

          <button
            onClick={() => setShowTable((shown) => !shown)}
            style={{
              background: 'transparent', border: '1px solid var(--border)', borderRadius: 20,
              color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
              padding: '6px 14px', cursor: 'pointer', marginBottom: 14,
            }}
          >
            {showTable ? 'Hide' : 'Show'} entry list
          </button>

          {showTable && (
            <div className="rise-in" style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              {entries.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '24px 0', fontSize: 13 }}>No entries yet.</p>
              )}
              {entries
                .slice()
                .sort((a, b) => +new Date(b.date) - +new Date(a.date))
                .map((entry, index) => (
                  <div key={entry.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', background: 'var(--surface)',
                    borderTop: index > 0 ? '1px solid var(--border-soft)' : undefined,
                  }}>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>{entry.type}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                        {new Date(entry.date).toLocaleDateString('en-GB')}{entry.note ? ` — ${entry.note}` : ''}
                      </div>
                    </div>
                    <span className="tabular" style={{
                      fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13,
                      color: entry.type === 'withdrawal' ? 'var(--lost)' : 'var(--won)',
                    }}>
                      {entry.type === 'withdrawal' ? '−' : '+'}{formatUnits(entry.amount)}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
