'use client';

import { useState } from 'react';
import { AdvancedFilters, FilterPreset, hasActiveAdvancedFilters, EMPTY_ADVANCED_FILTERS } from '@/lib/filters';
import { BetResult, SportType } from '@/lib/types';

const SPORT_OPTIONS: { value: SportType; code: string }[] = [
  { value: 'football', code: 'FB' }, { value: 'tennis', code: 'TN' }, { value: 'basketball', code: 'BK' },
  { value: 'esports', code: 'ES' }, { value: 'cricket', code: 'CR' }, { value: 'horse_racing', code: 'HR' },
  { value: 'golf', code: 'GL' }, { value: 'rugby', code: 'RG' }, { value: 'boxing', code: 'BX' },
  { value: 'mma', code: 'MM' }, { value: 'darts', code: 'DA' }, { value: 'baseball', code: 'BB' }, { value: 'other', code: 'OT' },
];
const RESULT_OPTIONS: BetResult[] = ['pending', 'won', 'lost', 'void'];

interface Props {
  value: AdvancedFilters;
  onChange: (f: AdvancedFilters) => void;
  bookmakers: string[];
  tags: string[];
  onCopyLink: () => void;
  copied: boolean;
  presets: FilterPreset[];
  authed: boolean;
  onApplyPreset: (preset: FilterPreset) => void;
  onSavePreset: (name: string) => void;
  onDeletePreset: (id: string) => void;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.02em',
        padding: '4px 10px', borderRadius: 14, cursor: 'pointer',
        background: active ? 'var(--accent)' : 'transparent',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        color: active ? 'var(--accent-contrast)' : 'var(--text-muted)',
        transition: 'all 0.12s',
      }}
    >
      {children}
    </button>
  );
}

export default function FilterPanel({
  value, onChange, bookmakers, tags, onCopyLink, copied,
  presets, authed, onApplyPreset, onSavePreset, onDeletePreset,
}: Props) {
  const [open, setOpen] = useState(false);
  const active = hasActiveAdvancedFilters(value);

  function handleSavePreset() {
    const name = window.prompt('Name this preset (filters + date range):');
    if (name && name.trim()) onSavePreset(name.trim());
  }

  function toggle<K extends 'sports' | 'bookmakers' | 'results' | 'tags'>(key: K, item: AdvancedFilters[K][number]) {
    const set = new Set(value[key] as (typeof item)[]);
    if (set.has(item)) set.delete(item); else set.add(item);
    onChange({ ...value, [key]: Array.from(set) } as AdvancedFilters);
  }

  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <input
            value={value.search}
            onChange={e => onChange({ ...value, search: e.target.value })}
            placeholder="Search selections, matchups, markets…"
            style={{
              width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20,
              color: 'var(--text)', fontSize: 12.5, padding: '8px 14px', outline: 'none',
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
            background: open || active ? 'var(--accent-soft)' : 'transparent',
            border: `1px solid ${open || active ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 20, color: open || active ? 'var(--accent)' : 'var(--text-muted)',
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
            padding: '8px 13px', cursor: 'pointer',
          }}
        >
          Filters{active ? ` (${value.sports.length + value.bookmakers.length + value.results.length + value.tags.length + (value.oddsMin || value.oddsMax ? 1 : 0)})` : ''}
        </button>
        <button
          type="button"
          onClick={onCopyLink}
          title="Copy a link to this filtered view"
          style={{
            flexShrink: 0, background: 'transparent', border: '1px solid var(--border)', borderRadius: 20,
            color: copied ? 'var(--won)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
            padding: '8px 13px', cursor: 'pointer', transition: 'color 0.15s',
          }}
        >
          {copied ? 'Copied' : 'Share'}
        </button>
      </div>

      {open && (
        <div className="rise-in" style={{ marginTop: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
          {(presets.length > 0 || authed) && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.06em' }}>SAVED PRESETS</div>
                {authed && (
                  <button type="button" onClick={handleSavePreset} style={{
                    background: 'transparent', border: '1px solid var(--border)', borderRadius: 10,
                    color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                    padding: '3px 8px', cursor: 'pointer',
                  }}>
                    + Save current view
                  </button>
                )}
              </div>
              {presets.length === 0 ? (
                <p style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>No presets saved yet.</p>
              ) : (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {presets.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center' }}>
                      <button type="button" onClick={() => onApplyPreset(p)} style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600,
                        padding: authed ? '4px 4px 4px 10px' : '4px 10px',
                        borderRadius: authed ? '14px 0 0 14px' : 14,
                        background: 'transparent', border: '1px solid var(--border)',
                        borderRight: authed ? 'none' : undefined,
                        color: 'var(--text-muted)', cursor: 'pointer',
                      }}>
                        {p.name}
                      </button>
                      {authed && (
                        <button type="button" onClick={() => onDeletePreset(p.id)} title="Delete preset" style={{
                          fontFamily: 'var(--font-mono)', fontSize: 10, padding: '4px 8px',
                          borderRadius: '0 14px 14px 0', background: 'transparent',
                          border: '1px solid var(--border)', borderLeft: 'none',
                          color: 'var(--lost)', cursor: 'pointer',
                        }}>
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 6 }}>SPORT</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SPORT_OPTIONS.map(s => (
                <Chip key={s.value} active={value.sports.includes(s.value)} onClick={() => toggle('sports', s.value)}>{s.code}</Chip>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 6 }}>RESULT</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {RESULT_OPTIONS.map(r => (
                <Chip key={r} active={value.results.includes(r)} onClick={() => toggle('results', r)}>{r.toUpperCase()}</Chip>
              ))}
            </div>
          </div>

          {bookmakers.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 6 }}>BOOKMAKER</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {bookmakers.map(b => (
                  <Chip key={b} active={value.bookmakers.includes(b)} onClick={() => toggle('bookmakers', b)}>{b}</Chip>
                ))}
              </div>
            </div>
          )}

          {tags.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 6 }}>TAG</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {tags.map(t => (
                  <Chip key={t} active={value.tags.includes(t)} onClick={() => toggle('tags', t)}>{t}</Chip>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 6 }}>ODDS MIN</div>
              <input
                value={value.oddsMin} onChange={e => onChange({ ...value, oddsMin: e.target.value })}
                inputMode="decimal" placeholder="1.00"
                style={{ width: 70, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 12, padding: '6px 8px' }}
              />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 6 }}>ODDS MAX</div>
              <input
                value={value.oddsMax} onChange={e => onChange({ ...value, oddsMax: e.target.value })}
                inputMode="decimal" placeholder="10.00"
                style={{ width: 70, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 12, padding: '6px 8px' }}
              />
            </div>
            {active && (
              <button
                type="button"
                onClick={() => onChange({ ...EMPTY_ADVANCED_FILTERS })}
                style={{
                  marginLeft: 'auto', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8,
                  color: 'var(--lost)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                  padding: '7px 12px', cursor: 'pointer',
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
