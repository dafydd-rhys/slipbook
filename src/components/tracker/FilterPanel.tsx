'use client';

// Search bar + expandable advanced filters (sport/result/bookmaker/tag chips,
// odds range) plus saved filter presets and the "copy link to this view" button.
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

const GROUP_LABEL_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 6,
};

// Single toggleable pill used inside a ChipGroup.
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

// Labelled row of toggleable chips for one filter dimension (sport, result, etc.).
function ChipGroup<T extends string>({ label, options, isActive, onToggle, labelOf = (option) => option }: {
  label: string; options: T[]; isActive: (option: T) => boolean; onToggle: (option: T) => void; labelOf?: (option: T) => string;
}) {
  if (options.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={GROUP_LABEL_STYLE}>{label}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {options.map((option) => <Chip key={option} active={isActive(option)} onClick={() => onToggle(option)}>{labelOf(option)}</Chip>)}
      </div>
    </div>
  );
}

interface SearchAndActionsRowProps {
  search: string;
  onSearchChange: (value: string) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  activeFilterCount: number;
  copied: boolean;
  onCopyLink: () => void;
}

// Search input plus the "Filters" toggle and "Share" (copy link) buttons.
function SearchAndActionsRow({ search, onSearchChange, filtersOpen, onToggleFilters, activeFilterCount, copied, onCopyLink }: SearchAndActionsRowProps) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search selections, matchups, markets…"
          style={{
            width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20,
            color: 'var(--text)', fontSize: 12.5, padding: '8px 14px', outline: 'none',
          }}
        />
      </div>
      <button
        type="button"
        onClick={onToggleFilters}
        style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
          background: filtersOpen || activeFilterCount > 0 ? 'var(--accent-soft)' : 'transparent',
          border: `1px solid ${filtersOpen || activeFilterCount > 0 ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 20, color: filtersOpen || activeFilterCount > 0 ? 'var(--accent)' : 'var(--text-muted)',
          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
          padding: '8px 13px', cursor: 'pointer',
        }}
      >
        Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
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
  );
}

interface PresetsSectionProps {
  presets: FilterPreset[];
  authed: boolean;
  onApplyPreset: (preset: FilterPreset) => void;
  onSavePreset: (name: string) => void;
  onDeletePreset: (id: string) => void;
}

// Saved-preset chips, plus a "save current view" button when logged in.
function PresetsSection({ presets, authed, onApplyPreset, onSavePreset, onDeletePreset }: PresetsSectionProps) {
  if (presets.length === 0 && !authed) {
    return null;
  }

  function handleSave() {
    const name = window.prompt('Name this preset (filters + date range):');

    if (name && name.trim()) {
      onSavePreset(name.trim());
    }
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={GROUP_LABEL_STYLE}>SAVED PRESETS</div>
        {authed && (
          <button type="button" onClick={handleSave} style={{
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
          {presets.map((preset) => (
            <div key={preset.id} style={{ display: 'flex', alignItems: 'center' }}>
              <button type="button" onClick={() => onApplyPreset(preset)} style={{
                fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600,
                padding: authed ? '4px 4px 4px 10px' : '4px 10px',
                borderRadius: authed ? '14px 0 0 14px' : 14,
                background: 'transparent', border: '1px solid var(--border)',
                borderRight: authed ? 'none' : undefined,
                color: 'var(--text-muted)', cursor: 'pointer',
              }}>
                {preset.name}
              </button>
              {authed && (
                <button type="button" onClick={() => onDeletePreset(preset.id)} title="Delete preset" style={{
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
  );
}

// Min/max odds number inputs, plus a "Clear" button when any advanced filter is active.
function OddsRangeRow({ value, onChange, showClear, onClear }: {
  value: AdvancedFilters; onChange: (filters: AdvancedFilters) => void; showClear: boolean; onClear: () => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
      <div>
        <div style={GROUP_LABEL_STYLE}>ODDS MIN</div>
        <input
          value={value.oddsMin} onChange={(event) => onChange({ ...value, oddsMin: event.target.value })}
          inputMode="decimal" placeholder="1.00"
          style={{ width: 70, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 12, padding: '6px 8px' }}
        />
      </div>
      <div>
        <div style={GROUP_LABEL_STYLE}>ODDS MAX</div>
        <input
          value={value.oddsMax} onChange={(event) => onChange({ ...value, oddsMax: event.target.value })}
          inputMode="decimal" placeholder="10.00"
          style={{ width: 70, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 12, padding: '6px 8px' }}
        />
      </div>
      {showClear && (
        <button
          type="button"
          onClick={onClear}
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
  );
}

interface Props {
  value: AdvancedFilters;
  onChange: (filters: AdvancedFilters) => void;
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

// Search + advanced-filters panel: sport/result/bookmaker/tag chips, odds
// range, saved presets, and the share-link button.
export default function FilterPanel({
  value, onChange, bookmakers, tags, onCopyLink, copied,
  presets, authed, onApplyPreset, onSavePreset, onDeletePreset,
}: Props) {
  const [open, setOpen] = useState(false);
  const active = hasActiveAdvancedFilters(value);
  const activeFilterCount = value.sports.length + value.bookmakers.length + value.results.length + value.tags.length + (value.oddsMin || value.oddsMax ? 1 : 0);

  // Adds or removes one item from a multi-select advanced-filter field.
  function toggle<K extends 'sports' | 'bookmakers' | 'results' | 'tags'>(key: K, item: AdvancedFilters[K][number]) {
    const items = new Set(value[key] as (typeof item)[]);

    if (items.has(item)) {
      items.delete(item);
    } else {
      items.add(item);
    }

    onChange({ ...value, [key]: Array.from(items) } as AdvancedFilters);
  }

  return (
    <div style={{ marginBottom: 4 }}>
      <SearchAndActionsRow
        search={value.search}
        onSearchChange={(search) => onChange({ ...value, search })}
        filtersOpen={open}
        onToggleFilters={() => setOpen((currentlyOpen) => !currentlyOpen)}
        activeFilterCount={activeFilterCount}
        copied={copied}
        onCopyLink={onCopyLink}
      />

      {open && (
        <div className="rise-in" style={{ marginTop: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
          <PresetsSection presets={presets} authed={authed} onApplyPreset={onApplyPreset} onSavePreset={onSavePreset} onDeletePreset={onDeletePreset} />

          <ChipGroup label="SPORT" options={SPORT_OPTIONS.map((sport) => sport.value)}
            isActive={(sport) => value.sports.includes(sport)} onToggle={(sport) => toggle('sports', sport)}
            labelOf={(sport) => SPORT_OPTIONS.find((option) => option.value === sport)?.code ?? sport} />

          <ChipGroup label="RESULT" options={RESULT_OPTIONS}
            isActive={(result) => value.results.includes(result)} onToggle={(result) => toggle('results', result)}
            labelOf={(result) => result.toUpperCase()} />

          <ChipGroup label="BOOKMAKER" options={bookmakers}
            isActive={(bookmaker) => value.bookmakers.includes(bookmaker)} onToggle={(bookmaker) => toggle('bookmakers', bookmaker)} />

          <ChipGroup label="TAG" options={tags}
            isActive={(tag) => value.tags.includes(tag)} onToggle={(tag) => toggle('tags', tag)} />

          <OddsRangeRow value={value} onChange={onChange} showClear={active} onClear={() => onChange({ ...EMPTY_ADVANCED_FILTERS })} />
        </div>
      )}
    </div>
  );
}
