'use client';

import { useEffect, useState } from 'react';
import BetCard from '@/components/BetCard';
import { Bet, BetLeg, BetResult, BetSubLeg, BetTemplate, BetType, SportOutcome, SportType } from '@/lib/types';
import { groupByDay } from '@/lib/dates';
import { CURRENCY_SYMBOL } from '@/lib/config';
import { uniqueBookmakers, uniqueTags } from '@/lib/filters';
import type { ParsedLeg } from '@/lib/slipParser';
import BankrollAdmin from '@/components/admin/BankrollAdmin';
import ReportsAdmin from '@/components/admin/ReportsAdmin';
import DataAdmin from '@/components/admin/DataAdmin';
import StakeSizer from '@/components/admin/StakeSizer';
import AiGate, { useAiEnabled } from '@/components/admin/AiGate';
import TrashAdmin from '@/components/admin/TrashAdmin';
const CONTENT_WIDTH = 720;
const MAX_PIN_LEN = 12;

// ── Style constants ───────────────────────────────────────────────────────────
const INPUT: React.CSSProperties = {
  background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
  color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 13, padding: '8px 10px', width: '100%', outline: 'none',
};
const SELECT: React.CSSProperties = { ...INPUT };
const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.06em',
  display: 'block', marginBottom: 4, textTransform: 'uppercase',
};
const FIELD: React.CSSProperties = { marginBottom: 12 };
const SECTION: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
  padding: 16, marginBottom: 14,
};
const SECTION_TITLE: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.1em',
  marginBottom: 14, textTransform: 'uppercase',
};
const RESULT_COLORS: Record<BetResult, string> = {
  won: 'var(--won)', lost: 'var(--lost)', void: 'var(--void)', pending: 'var(--pending)',
};

const BET_TYPES: { value: BetType; label: string }[] = [
  { value: 'acca',        label: 'Accumulator' },
  { value: 'single',      label: 'Single' },
  { value: 'double',      label: 'Double' },
  { value: 'treble',      label: 'Treble' },
  { value: 'bet_builder', label: 'Bet Builder' },
  { value: 'each_way',    label: 'Each Way' },
  { value: 'outright',    label: 'Outright' },
  { value: 'system',      label: 'System Bet' },
  { value: 'lucky15',     label: 'Lucky 15' },
  { value: 'lucky31',     label: 'Lucky 31' },
  { value: 'lucky63',     label: 'Lucky 63' },
];

function autoTitle(type: BetType): string {
  return BET_TYPES.find(t => t.value === type)?.label ?? 'Bet';
}

const SPORTS: { value: SportType; code: string; label: string }[] = [
  { value: 'football',     code: 'FB', label: 'Football' },
  { value: 'tennis',       code: 'TN', label: 'Tennis' },
  { value: 'basketball',   code: 'BK', label: 'Basketball' },
  { value: 'esports',      code: 'ES', label: 'Esports / CS' },
  { value: 'cricket',      code: 'CR', label: 'Cricket' },
  { value: 'horse_racing', code: 'HR', label: 'Horse Racing' },
  { value: 'golf',         code: 'GL', label: 'Golf' },
  { value: 'rugby',        code: 'RG', label: 'Rugby' },
  { value: 'boxing',       code: 'BX', label: 'Boxing' },
  { value: 'mma',          code: 'MM', label: 'MMA' },
  { value: 'darts',        code: 'DA', label: 'Darts' },
  { value: 'baseball',     code: 'BB', label: 'Baseball' },
  { value: 'other',        code: 'OT', label: 'Other' },
];

const COMMON_MARKETS = [
  'Match Result', 'Both Teams to Score', 'Over 2.5 Goals', 'Under 2.5 Goals',
  'Correct Score', 'Anytime Goalscorer', 'First Goalscorer', 'Double Chance',
  'Draw No Bet', 'Handicap', 'Outright Winner', 'Set Betting', 'To Win Match',
];

const STAKE_PRESETS = ['10', '50', '100', '200'];

const LAST_SPORT_KEY = 'strz_last_sport';

// ── Small reusable UI bits ─────────────────────────────────────────────────────
function PresetChips({ values, onPick, prefix = '' }: { values: string[]; onPick: (v: string) => void; prefix?: string }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
      {values.map(v => (
        <button key={v} type="button" onClick={() => onPick(v)} style={{
          background: 'transparent', border: '1px solid var(--border)', borderRadius: 6,
          color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 11, padding: '3px 8px', cursor: 'pointer',
        }}>
          {prefix}{v}
        </button>
      ))}
    </div>
  );
}

function MarketQuickPick({ onPick }: { onPick: (v: string) => void }) {
  return (
    <select value="" onChange={e => { if (e.target.value) onPick(e.target.value); }} style={{ ...SELECT, marginBottom: 6 }}>
      <option value="">Quick pick…</option>
      {COMMON_MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
    </select>
  );
}

function ScoreStepper({ label, value, onChange }: { label: string; value: number | undefined; onChange: (v: number) => void }) {
  const v = value ?? 0;
  const stepBtn: React.CSSProperties = {
    background: 'transparent', border: '1px solid var(--border)', borderRadius: 6,
    color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, width: 28, height: 28, cursor: 'pointer', flexShrink: 0,
  };
  return (
    <div>
      <label style={LABEL}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button type="button" disabled={v <= 0} onClick={() => onChange(Math.max(0, v - 1))} style={{
          ...stepBtn, cursor: v <= 0 ? 'not-allowed' : 'pointer', opacity: v <= 0 ? 0.35 : 1,
        }}>−</button>
        <input type="number" min="0" value={v}
          onChange={e => onChange(Math.max(0, parseInt(e.target.value) || 0))}
          style={{ ...INPUT, fontFamily: 'var(--font-mono)', width: 44, textAlign: 'center', padding: '4px 2px', flexShrink: 0 }} />
        <button type="button" onClick={() => onChange(v + 1)} style={stepBtn}>+</button>
      </div>
    </div>
  );
}

// Popup number keypad — click the field to tap out a value (odds/stake), like the admin PIN pad.
function NumberKeypadInput({ value, onChange, placeholder, style }: {
  value: string; onChange: (v: string) => void; placeholder?: string; style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  function openPad() { setDraft(''); setOpen(true); }
  function tap(key: string) {
    let next = draft;
    if (key === 'C') next = '';
    else if (key === '⌫') next = draft.slice(0, -1);
    else if (key === '.') next = draft.includes('.') ? draft : draft + '.';
    else next = draft + key;
    setDraft(next);
    onChange(next);
  }
  return (
    <>
      <input readOnly value={value} placeholder={placeholder} onClick={openPad}
        style={{ ...INPUT, fontFamily: 'var(--font-mono)', ...style, cursor: 'pointer' }} />
      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
            zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 18px', width: '100%', maxWidth: 260 }}>
            <div className="tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 600, color: 'var(--text)', textAlign: 'center', marginBottom: 16, minHeight: 34 }}>
              {draft || '0'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map(k => (
                <button key={k} type="button" onClick={() => tap(k)} style={{
                  background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10,
                  color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, padding: '12px 0', cursor: 'pointer',
                }}>{k}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="button" onClick={() => tap('C')} style={{
                flex: 1, background: 'transparent', border: '1px solid var(--border)', borderRadius: 10,
                color: 'var(--text-muted)', fontSize: 14, fontWeight: 700, padding: 10, cursor: 'pointer',
              }}>
                Clear
              </button>
              <button type="button" onClick={() => setOpen(false)} style={{
                flex: 1, background: 'var(--accent)', border: 'none', borderRadius: 10,
                color: 'var(--accent-contrast)', fontSize: 14, fontWeight: 700, padding: 10, cursor: 'pointer',
              }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Shared mini modal ─────────────────────────────────────────────────────────
interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}
function ConfirmDialog({ title, message, confirmLabel, confirmColor = 'var(--lost)', onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(4px)', zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
        padding: '24px 22px', width: '100%', maxWidth: 320,
      }}>
        <h3 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{title}</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{
            flex: 1, background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--text-muted)', fontSize: 13, fontWeight: 600,
            padding: '9px', cursor: 'pointer',
          }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{
            flex: 1, background: confirmColor, border: 'none',
            borderRadius: 8, color: 'var(--accent-contrast)', fontSize: 13, fontWeight: 700,
            padding: '9px', cursor: 'pointer',
          }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Outcome fields per sport ──────────────────────────────────────────────────
function OutcomeFields({ sport, outcome, onChange }: {
  sport: SportType; outcome: SportOutcome; onChange: (o: SportOutcome) => void;
}) {
  const set = (key: keyof SportOutcome, val: string | number | boolean) => onChange({ ...outcome, [key]: val });

  const textToggle = (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
      <input type="checkbox" checked={!!outcome.useText} onChange={e => set('useText', e.target.checked)} />
      Use text instead
    </label>
  );

  if (outcome.useText) return (
    <div style={FIELD}>
      {textToggle}
      <label style={LABEL}>Result</label>
      <input value={outcome.resultText ?? ''} onChange={e => set('resultText', e.target.value)}
        placeholder="e.g. Away Won" style={INPUT} />
    </div>
  );

  if (sport === 'tennis') return (
    <div style={FIELD}>
      {textToggle}
      <label style={LABEL}>Sets Score</label>
      <input value={outcome.sets ?? ''} onChange={e => set('sets', e.target.value)}
        placeholder="e.g. 6-4, 7-5, 3-6, 6-2" style={INPUT} />
    </div>
  );
  if (sport === 'darts') return (
    <div style={FIELD}>
      {textToggle}
      <label style={LABEL}>Sets/Legs Score</label>
      <input value={outcome.sets ?? ''} onChange={e => set('sets', e.target.value)}
        placeholder="e.g. 3-1 (sets)" style={INPUT} />
    </div>
  );
  if (sport === 'horse_racing') return (
    <div style={FIELD}>
      {textToggle}
      <label style={LABEL}>Finish Position</label>
      <select value={outcome.finishPosition ?? ''} onChange={e => set('finishPosition', e.target.value)} style={SELECT}>
        <option value="">Select…</option>
        {['1st','2nd','3rd','4th','5th','6th+','NR','Fell','PU'].map(p => <option key={p} value={p}>{p}</option>)}
      </select>
    </div>
  );
  if (sport === 'golf') return (
    <div style={FIELD}>
      {textToggle}
      <label style={LABEL}>Score to Par</label>
      <input value={outcome.scoreToPar ?? ''} onChange={e => set('scoreToPar', e.target.value)}
        placeholder="e.g. -12 or +3" style={INPUT} />
    </div>
  );
  if (sport === 'cricket') return (
    <div style={FIELD}>
      <label style={LABEL}>Result</label>
      <input value={outcome.resultText ?? ''} onChange={e => set('resultText', e.target.value)}
        placeholder="e.g. Won by 8 wickets" style={INPUT} />
    </div>
  );
  const statuses =
    sport === 'basketball' ? ['FT','OT','2OT'] :
    sport === 'esports'    ? ['FT','GG'] :
    sport === 'rugby'      ? ['FT','AET'] :
                             ['FT','AET','Pens'];
  return (
    <div>
      {textToggle}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <ScoreStepper label="Home Score" value={outcome.homeScore} onChange={v => set('homeScore', v)} />
        <ScoreStepper label="Away Score" value={outcome.awayScore} onChange={v => set('awayScore', v)} />
        <div>
          <label style={LABEL}>Status</label>
          <select value={outcome.matchStatus ?? 'FT'} onChange={e => set('matchStatus', e.target.value)} style={SELECT}>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      {outcome.matchStatus === 'Pens' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
          <ScoreStepper label="Pens (Home)" value={outcome.penaltyHomeScore} onChange={v => set('penaltyHomeScore', v)} />
          <ScoreStepper label="Pens (Away)" value={outcome.penaltyAwayScore} onChange={v => set('penaltyAwayScore', v)} />
        </div>
      )}
    </div>
  );
}

// ── Sub-leg editor (bet builder inside a leg) ─────────────────────────────────
function SubLegEditor({ subLegs, onChange }: {
  subLegs: Omit<BetSubLeg, 'id'>[]; onChange: (s: Omit<BetSubLeg, 'id'>[]) => void;
}) {
  function update(i: number, field: keyof Omit<BetSubLeg, 'id'>, val: string) {
    const next = [...subLegs];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  }
  return (
    <div style={{ paddingLeft: 12, borderLeft: '2px solid var(--border)', marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.06em' }}>
          BUILDER SELECTIONS ({subLegs.length})
        </span>
        <button type="button" onClick={() => onChange([...subLegs, { selection: '', market: '', result: 'pending' }])}
          style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 11, padding: '3px 8px', cursor: 'pointer' }}>
          + Add
        </button>
      </div>
      {subLegs.map((sl, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input value={sl.selection} onChange={e => update(i, 'selection', e.target.value)}
              placeholder="Selection" style={{ ...INPUT, flex: 2 }} />
            <input value={sl.market} onChange={e => update(i, 'market', e.target.value)}
              placeholder="Market" style={{ ...INPUT, flex: 2 }} />
            <select value={sl.result} onChange={e => update(i, 'result', e.target.value as BetResult)}
              style={{ ...SELECT, flex: 1, color: RESULT_COLORS[sl.result] }}>
              <option value="pending">Pending</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="void">Void</option>
            </select>
            <button type="button" onClick={() => onChange(subLegs.filter((_, j) => j !== i))}
              style={{ background: 'transparent', border: 'none', color: 'var(--lost)', opacity: 0.6, fontSize: 14, cursor: 'pointer', padding: 0, flexShrink: 0 }}>
              ✕
            </button>
          </div>
          <select value="" onChange={e => { if (e.target.value) update(i, 'market', e.target.value); }}
            style={{ ...SELECT, marginTop: 4, fontSize: 11, padding: '4px 8px' }}>
            <option value="">Quick pick market…</option>
            {COMMON_MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
type LegForm = {
  selection: string; market: string; matchup: string;
  odds: string;          // base odds (always shown)
  oddsTouched: boolean;  // once true, stops mirroring the main "Total Odds" field
  boostedOdds: string;   // effective boosted odds (shown when isBoosted)
  isBoosted: boolean;
  result: BetResult; sport: SportType;
  isBetBuilder: boolean; subLegs: Omit<BetSubLeg, 'id'>[];
  outcomeDecided: boolean; outcome: SportOutcome;
};

type BetForm = {
  date: string; title: string; type: BetType;
  odds: string;          // base odds (always shown) — "Total Odds" / "Base Odds"
  oddsAutoCalc: boolean;  // when true, odds is derived live from the product of legs' base odds
  boostedOdds: string;   // effective boosted odds (shown when isBoosted) — "Boosted Odds"
  boostedOddsAutoCalc: boolean; // when true, boostedOdds is derived live from legs' boosted-aware odds
  isBoosted: boolean;
  stake: string; result: BetResult; returns: string; notes: string;
  cashedOut: boolean; // when true (and result is 'won'), `returns` is a manually entered cash-out amount
  bookmaker: string;
  tags: string; // comma-separated in the form, split into Bet.tags on save
  legs: LegForm[];
};

function lastUsedSport(): SportType {
  if (typeof window === 'undefined') return 'football';
  return (localStorage.getItem(LAST_SPORT_KEY) as SportType | null) ?? 'football';
}

function emptyLeg(sport?: SportType, odds?: string): LegForm {
  return {
    selection: '', market: 'Match Result', matchup: '', odds: odds ?? '1.50', oddsTouched: false, boostedOdds: '',
    isBoosted: false, result: 'pending', sport: sport ?? lastUsedSport(),
    isBetBuilder: false, subLegs: [], outcomeDecided: false, outcome: {},
  };
}

// Base odds auto-calc — ignores per-leg boosts, ignores void legs.
function computeBaseOddsFromLegs(legs: LegForm[]): string {
  const total = legs.reduce((acc, l) => {
    if (l.result === 'void') return acc;
    return acc * (parseFloat(l.odds) || 1);
  }, 1);
  return total.toFixed(2);
}

// Boosted odds auto-calc — uses each leg's boosted price if that leg is boosted, ignores void legs.
function computeBoostedOddsFromLegs(legs: LegForm[]): string {
  const total = legs.reduce((acc, l) => {
    if (l.result === 'void') return acc;
    const odds = l.isBoosted && l.boostedOdds ? (parseFloat(l.boostedOdds) || 1) : parseFloat(l.odds) || 1;
    return acc * odds;
  }, 1);
  return total.toFixed(2);
}

// Overall bet result from leg results: any lost leg loses the whole bet; otherwise
// any leg still pending keeps the bet pending; all-void legs void the bet; else won.
function computeBetResult(legResults: BetResult[]): BetResult {
  if (legResults.some(r => r === 'lost')) return 'lost';
  if (legResults.some(r => r === 'pending')) return 'pending';
  if (legResults.every(r => r === 'void')) return 'void';
  return 'won';
}

// Auto-calculated returns for a "Won" bet — stake × effective total odds (boosted if applicable).
function computeWinReturns(form: BetForm): number {
  const effectiveOdds = form.isBoosted && form.boostedOdds
    ? (parseFloat(form.boostedOdds) || 1) : parseFloat(form.odds) || 1;
  return (parseFloat(form.stake) || 0) * effectiveOdds;
}

function emptyForm(): BetForm {
  const odds = '2.00';
  return {
    date: new Date().toISOString().slice(0, 16),
    title: autoTitle('acca'), type: 'acca',
    odds, oddsAutoCalc: false, boostedOdds: '', boostedOddsAutoCalc: false, isBoosted: false,
    stake: '10', result: 'pending', returns: '', notes: '', cashedOut: false,
    bookmaker: '', tags: '',
    legs: [emptyLeg(undefined, odds)],
  };
}

// ── Build Bet object from form ────────────────────────────────────────────────
function buildBet(form: BetForm, id: string = 'preview'): Bet {
  const effectiveTotalOdds = form.isBoosted && form.boostedOdds
    ? (parseFloat(form.boostedOdds) || 1) : parseFloat(form.odds) || 1;
  const parsedBaseTotalOdds = form.isBoosted && form.odds ? parseFloat(form.odds) : NaN;
  const baseTotalOdds = Number.isFinite(parsedBaseTotalOdds) ? parsedBaseTotalOdds : undefined;

  return {
    id,
    date: new Date(form.date).toISOString(),
    title: form.title || 'Untitled',
    type: form.type,
    totalOdds: effectiveTotalOdds,
    baseTotalOdds,
    isBoosted: form.isBoosted,
    stake: parseFloat(form.stake) || 0,
    result: form.result,
    returns: form.result === 'won'
      ? (form.cashedOut ? parseFloat(form.returns) || 0 : computeWinReturns(form))
      : form.result === 'lost' ? 0 : undefined,
    cashedOut: form.result === 'won' && form.cashedOut ? true : undefined,
    notes: form.notes || undefined,
    bookmaker: form.bookmaker.trim() || undefined,
    tags: form.tags.split(',').map(t => t.trim()).filter(Boolean).length
      ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
      : undefined,
    legs: form.legs.map((l, i): BetLeg => {
      const legOdds = l.odds || form.odds;
      const effectiveOdds = l.isBoosted && l.boostedOdds
        ? (parseFloat(l.boostedOdds) || 1) : parseFloat(legOdds) || 1;
      const parsedBaseOdds = l.isBoosted && legOdds ? parseFloat(legOdds) : NaN;
      const baseOdds = Number.isFinite(parsedBaseOdds) ? parsedBaseOdds : undefined;
      return {
        id: `leg-${Date.now()}-${i}`,
        selection: l.selection || 'Selection',
        market: l.market || 'Market',
        matchup: l.matchup,
        odds: effectiveOdds,
        baseOdds,
        isBoosted: l.isBoosted,
        result: l.result,
        sport: l.sport,
        isBetBuilder: l.isBetBuilder,
        subLegs: l.isBetBuilder ? l.subLegs.map((sl, j) => ({ ...sl, id: `sl-${Date.now()}-${j}` })) : undefined,
        outcomeDecided: l.outcomeDecided,
        outcome: l.outcomeDecided ? l.outcome : undefined,
      };
    }),
  };
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed]       = useState(false);
  const [pin, setPin]             = useState('');
  const [pinError, setPinError]   = useState(false);
  const [pinSubmitting, setPinSubmitting] = useState(false);
  const [bets, setBets]           = useState<Bet[]>([]);
  const [form, setForm]           = useState<BetForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [tab, setTab]             = useState<'add' | 'manage' | 'bankroll' | 'reports' | 'data' | 'trash'>('add');
  const [msg, setMsg]             = useState('');
  const [titleAuto, setTitleAuto] = useState(true);
  const [parsingSlip, setParsingSlip] = useState(false);
  const [parseError, setParseError]   = useState('');
  const [dragOver, setDragOver]       = useState(false);
  const [importMode, setImportMode]   = useState<'screenshot' | 'text'>('screenshot');
  const [nlText, setNlText]           = useState('');
  const [parsingText, setParsingText] = useState(false);

  const [templates, setTemplates] = useState<BetTemplate[]>([]);
  const [templatePick, setTemplatePick] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [settling, setSettling] = useState<Bet | null>(null);
  const [settleResult, setSettleResult] = useState<{
    legs: { index: number; result: BetResult; confidence: 'high' | 'medium' | 'low'; note: string }[]; summary: string;
  } | null>(null);
  const [settleError, setSettleError] = useState('');
  const [settleBusy, setSettleBusy] = useState(false);

  const aiEnabled = useAiEnabled();
  const bookmakerOptions = uniqueBookmakers(bets);
  const tagOptions = uniqueTags(bets);

  // Modals
  const [previewBet, setPreviewBet] = useState<Bet | null>(null);
  const [batchPreview, setBatchPreview] = useState<Bet[] | null>(null);
  const [batchErrors, setBatchErrors] = useState<string[]>([]);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });
  const [batchSaving, setBatchSaving] = useState(false);
  const [confirm, setConfirm] = useState<{
    title: string; message: string; confirmLabel: string; confirmColor?: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    fetch('/api/admin/login').then(r => r.json()).then(d => { if (d.authed) setAuthed(true); });
  }, []);
  useEffect(() => { if (authed) { loadBets(); loadTemplates(); } }, [authed]);

  async function loadBets() {
    setBets(await fetch('/api/bets').then(r => r.json()));
  }

  async function loadTemplates() {
    const res = await fetch('/api/templates');
    if (res.ok) setTemplates(await res.json());
  }

  type ParsedSlipResponse = { date: string; stake: number | null; legs: ParsedLeg[] };

  function parsedSlipToForm(data: ParsedSlipResponse): BetForm {
    const legs: LegForm[] = data.legs.map(l => ({
      ...emptyLeg(),
      selection: l.selection,
      market: l.market,
      matchup: l.matchup,
      odds: String(l.odds),
      oddsTouched: true,
      sport: l.sport,
      result: l.result,
      isBetBuilder: l.isBetBuilder,
      subLegs: l.subLegs.map(sl => ({ ...sl, result: l.result })),
    }));
    const type: BetType =
      legs.length === 1 && legs[0].isBetBuilder ? 'bet_builder'
      : legs.length === 1 ? 'single' : legs.length === 2 ? 'double' : legs.length === 3 ? 'treble' : 'acca';
    return {
      ...emptyForm(),
      date: new Date(data.date).toISOString().slice(0, 16),
      type,
      title: autoTitle(type),
      legs,
      odds: computeBaseOddsFromLegs(legs),
      oddsAutoCalc: true,
      result: computeBetResult(legs.map(l => l.result)),
      stake: data.stake != null ? String(data.stake) : emptyForm().stake,
    };
  }

  function applyParsedSlip(data: ParsedSlipResponse) {
    const newForm = parsedSlipToForm(data);
    setForm(newForm);
    setTitleAuto(true);
    setPreviewBet(buildBet(newForm));
  }

  async function parseSlipImage(file: File): Promise<ParsedSlipResponse> {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsDataURL(file);
    });
    const res = await fetch('/api/admin/parse-slip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl }),
    });
    const data = await res.json() as ParsedSlipResponse;
    if (!res.ok) throw new Error((data as unknown as { error?: string }).error || 'Failed to read screenshot');
    return data;
  }

  async function handleSlipFiles(fileList: FileList | File[]) {
    if (parsingSlip) return;
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) { setParseError('Please drop image files.'); return; }
    setParseError('');

    if (files.length === 1) {
      setParsingSlip(true);
      try {
        applyParsedSlip(await parseSlipImage(files[0]));
      } catch (e) {
        setParseError(e instanceof Error ? e.message : 'Failed to read screenshot');
      } finally {
        setParsingSlip(false);
      }
      return;
    }

    // Multiple screenshots: parse every one (don't stop on the first
    // failure), then show a batch preview so each can be reviewed/removed
    // before adding them all at once.
    setParsingSlip(true);
    setBatchProgress({ done: 0, total: files.length });
    const built: Bet[] = [];
    const errors: string[] = [];
    for (const [i, file] of files.entries()) {
      try {
        const data = await parseSlipImage(file);
        built.push(buildBet(parsedSlipToForm(data), `batch-${Date.now()}-${i}`));
      } catch (e) {
        errors.push(`${file.name}: ${e instanceof Error ? e.message : 'failed to read'}`);
      }
      setBatchProgress(p => ({ ...p, done: p.done + 1 }));
    }
    setParsingSlip(false);
    setBatchPreview(built);
    setBatchErrors(errors);
  }

  async function handleParseText() {
    if (parsingText || !nlText.trim()) return;
    setParseError('');
    setParsingText(true);
    try {
      const res = await fetch('/api/admin/parse-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: nlText }),
      });
      const data = await res.json() as ParsedSlipResponse;
      if (!res.ok) throw new Error((data as unknown as { error?: string }).error || 'Failed to parse description');
      applyParsedSlip(data);
      setNlText('');
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Failed to parse description');
    } finally {
      setParsingText(false);
    }
  }

  function applyTemplate(id: string) {
    setTemplatePick(id);
    if (!id) return;
    const t = templates.find(x => x.id === id);
    if (!t) return;
    const legs: LegForm[] = t.legs.map(l => emptyLeg(l.sport, form.odds
    )).map((l, i) => ({ ...l, selection: t.legs[i].selection, market: t.legs[i].market, matchup: t.legs[i].matchup }));
    setForm(f => ({
      ...emptyForm(),
      type: t.type,
      title: titleAuto ? autoTitle(t.type) : f.title,
      bookmaker: t.bookmaker ?? '',
      legs: legs.length ? legs : f.legs,
    }));
  }

  async function handleSaveTemplate() {
    const name = window.prompt('Template name?', form.title);
    if (!name) return;
    setSavingTemplate(true);
    try {
      const body = {
        name,
        type: form.type,
        bookmaker: form.bookmaker.trim() || undefined,
        legs: form.legs.map(l => ({ selection: l.selection, market: l.market, matchup: l.matchup, sport: l.sport })),
      };
      const res = await fetch('/api/templates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (res.ok) { await loadTemplates(); setMsg('Template saved!'); setTimeout(() => setMsg(''), 2500); }
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleDeleteTemplate(id: string) {
    await fetch(`/api/templates/${id}`, { method: 'DELETE' });
    await loadTemplates();
  }

  function handlePinDigit(d: string) {
    if (pinError) { setPin(''); setPinError(false); return; }
    if (pin.length >= MAX_PIN_LEN) return;
    setPin(pin + d);
  }

  async function handlePinSubmit() {
    if (!pin || pinSubmitting) return;
    setPinSubmitting(true);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    setPinSubmitting(false);
    if (res.ok) {
      setAuthed(true);
    } else {
      setPinError(true);
      setTimeout(() => { setPin(''); setPinError(false); }, 600);
    }
  }

  function handlePinBack() {
    if (pinError) { setPin(''); setPinError(false); return; }
    setPin(p => p.slice(0, -1));
  }

  // Recalculates Total/Boosted Odds live (when their Auto-calc is on) after any leg field change —
  // covers odds/boostedOdds/isBoosted edits, and marking a leg void (void legs are excluded).
  function updateLegOdds(i: number, patch: Partial<LegForm>) {
    setForm(f => {
      const legs = [...f.legs];
      legs[i] = { ...legs[i], ...patch };
      return {
        ...f, legs,
        odds: f.oddsAutoCalc ? computeBaseOddsFromLegs(legs) : f.odds,
        boostedOdds: f.boostedOddsAutoCalc ? computeBoostedOddsFromLegs(legs) : f.boostedOdds,
      };
    });
  }
  function updateLeg<K extends keyof LegForm>(i: number, field: K, val: LegForm[K]) {
    updateLegOdds(i, { [field]: val } as Partial<LegForm>);
  }
  function addLeg() {
    setForm(f => {
      const legs = [...f.legs, emptyLeg(f.legs[f.legs.length - 1]?.sport, f.odds)];
      return {
        ...f, legs,
        odds: f.oddsAutoCalc ? computeBaseOddsFromLegs(legs) : f.odds,
        boostedOdds: f.boostedOddsAutoCalc ? computeBoostedOddsFromLegs(legs) : f.boostedOdds,
      };
    });
  }
  function removeLeg(i: number) {
    setForm(f => {
      const legs = f.legs.filter((_, j) => j !== i);
      return {
        ...f, legs,
        odds: f.oddsAutoCalc ? computeBaseOddsFromLegs(legs) : f.odds,
        boostedOdds: f.boostedOddsAutoCalc ? computeBoostedOddsFromLegs(legs) : f.boostedOdds,
      };
    });
  }

  // Submit: show preview for new bet, confirm dialog for edit
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      setConfirm({
        title: 'Save changes?',
        message: 'Update this bet with the new details?',
        confirmLabel: 'Save',
        confirmColor: 'var(--accent)',
        onConfirm: () => { setConfirm(null); doSave(); },
      });
    } else {
      setPreviewBet(buildBet(form));
    }
  }

  async function doSave() {
    setSaving(true);
    const bet = buildBet(form);
    const url    = editingId ? `/api/bets/${editingId}` : '/api/bets';
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bet),
    });
    if (res.ok) {
      setMsg(editingId ? 'Bet updated!' : 'Bet added!');
      setForm(emptyForm()); setEditingId(null); setTitleAuto(true);
      await loadBets(); setTab('manage');
    } else if (res.status === 401) {
      setAuthed(false);
      setMsg('Session expired — please log in again.');
    } else {
      setMsg('Error saving.');
    }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  }

  async function handleAddAllBatch() {
    if (!batchPreview || batchPreview.length === 0 || batchSaving) return;
    setBatchSaving(true);
    const importBets = batchPreview.map(bet => ({
      date: bet.date, title: bet.title, type: bet.type, totalOdds: bet.totalOdds,
      baseTotalOdds: bet.baseTotalOdds, isBoosted: bet.isBoosted, stake: bet.stake,
      result: bet.result, returns: bet.returns, cashedOut: bet.cashedOut, notes: bet.notes,
      bookmaker: bet.bookmaker, tags: bet.tags,
      legs: bet.legs.map(leg => ({
        selection: leg.selection, market: leg.market, matchup: leg.matchup, odds: leg.odds,
        baseOdds: leg.baseOdds, result: leg.result, sport: leg.sport, isBoosted: leg.isBoosted,
        isBetBuilder: leg.isBetBuilder, subLegs: leg.subLegs, outcomeDecided: leg.outcomeDecided, outcome: leg.outcome,
      })),
    }));
    const res = await fetch('/api/admin/import', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bets: importBets }),
    });
    if (res.ok) {
      const data = await res.json();
      setMsg(`${data.imported} bet${data.imported !== 1 ? 's' : ''} added!`);
      setBatchPreview(null);
      setBatchErrors([]);
      await loadBets();
      setTab('manage');
    } else if (res.status === 401) {
      setAuthed(false);
    } else {
      setMsg('Error saving batch.');
    }
    setBatchSaving(false);
    setTimeout(() => setMsg(''), 3000);
  }

  function confirmDelete(id: string) {
    setConfirm({
      title: 'Delete bet?',
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      confirmColor: 'var(--lost)',
      onConfirm: async () => {
        setConfirm(null);
        const res = await fetch(`/api/bets/${id}`, { method: 'DELETE' });
        if (res.status === 401) { setAuthed(false); setConfirm(null); return; }
        await loadBets();
      },
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function bulkSetResult(result: BetResult) {
    if (selectedIds.size === 0 || bulkBusy) return;
    setBulkBusy(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id =>
        fetch(`/api/bets/${id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ result }),
        })
      ));
      setSelectedIds(new Set());
      await loadBets();
    } finally {
      setBulkBusy(false);
    }
  }

  function bulkDelete() {
    if (selectedIds.size === 0) return;
    setConfirm({
      title: `Delete ${selectedIds.size} bet${selectedIds.size !== 1 ? 's' : ''}?`,
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      confirmColor: 'var(--lost)',
      onConfirm: async () => {
        setConfirm(null);
        setBulkBusy(true);
        try {
          await Promise.all(Array.from(selectedIds).map(id => fetch(`/api/bets/${id}`, { method: 'DELETE' })));
          setSelectedIds(new Set());
          await loadBets();
        } finally {
          setBulkBusy(false);
        }
      },
    });
  }

  async function openSettleSuggest(bet: Bet) {
    setSettling(bet);
    setSettleResult(null);
    setSettleError('');
    setSettleBusy(true);
    try {
      const res = await fetch('/api/admin/settle-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: bet.title,
          eventDate: bet.date,
          legs: bet.legs.map(l => ({ selection: l.selection, market: l.market, matchup: l.matchup, sport: l.sport ?? 'other' })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to look up results');
      setSettleResult(data);
    } catch (e) {
      setSettleError(e instanceof Error ? e.message : 'Failed to look up results');
    } finally {
      setSettleBusy(false);
    }
  }

  function applySettleSuggestion() {
    if (!settling || !settleResult) return;
    const bet = settling;
    handleEdit(bet);
    setForm(f => ({
      ...f,
      legs: f.legs.map((l, i) => {
        const s = settleResult.legs.find(x => x.index === i);
        return s ? { ...l, result: s.result } : l;
      }),
    }));
    setForm(f => ({ ...f, result: computeBetResult(f.legs.map(l => l.result)) }));
    setSettling(null);
    setSettleResult(null);
  }

  function handleEdit(bet: Bet) {
    setEditingId(bet.id);
    setTitleAuto(false);
    setForm({
      date:        new Date(bet.date).toISOString().slice(0, 16),
      title:       bet.title,
      type:        bet.type,
      // If boosted: base goes into odds, boosted goes into boostedOdds
      odds:        bet.baseTotalOdds ? String(bet.baseTotalOdds) : String(bet.totalOdds),
      oddsAutoCalc: false,
      boostedOdds: bet.baseTotalOdds ? String(bet.totalOdds) : '',
      boostedOddsAutoCalc: false,
      isBoosted:   bet.isBoosted ?? false,
      stake:       String(bet.stake),
      result:      bet.result,
      returns:     bet.returns ? String(bet.returns) : '',
      cashedOut:   bet.cashedOut ?? false,
      notes:       bet.notes ?? '',
      bookmaker:   bet.bookmaker ?? '',
      tags:        (bet.tags ?? []).join(', '),
      legs: bet.legs.map(l => ({
        selection:     l.selection,
        market:        l.market,
        matchup:       l.matchup,
        odds:          l.baseOdds ? String(l.baseOdds) : String(l.odds),
        oddsTouched:   true,
        boostedOdds:   l.baseOdds ? String(l.odds) : '',
        isBoosted:     l.isBoosted ?? false,
        result:        l.result,
        sport:         l.sport ?? 'other',
        isBetBuilder:  l.isBetBuilder ?? false,
        subLegs:       l.subLegs ?? [],
        outcomeDecided:l.outcomeDecided ?? false,
        outcome:       l.outcome ?? {},
      })),
    });
    setTab('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancelEdit() {
    setConfirm({
      title: 'Discard changes?',
      message: 'Your unsaved edits will be lost.',
      confirmLabel: 'Discard',
      confirmColor: 'var(--lost)',
      onConfirm: () => { setConfirm(null); setEditingId(null); setForm(emptyForm()); setTitleAuto(true); },
    });
  }

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (!authed) {
    const PAD = ['1','2','3','4','5','6','7','8','9','⌫','0','✓'];
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ width: '100%', maxWidth: 280, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.14em', marginBottom: 28 }}>
            ENTER PIN
          </div>

          {/* Perforated ticket stub */}
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, minHeight: 20, marginBottom: 36 }}>
            {pin.length === 0 && (
              <div style={{ width: 13, height: 18, borderRadius: 3, border: '1.5px solid var(--border)' }} />
            )}
            {Array.from({ length: pin.length }).map((_, i) => (
              <div key={i} style={{
                width: 13, height: 18, borderRadius: 3, position: 'relative', overflow: 'hidden',
                border: `1.5px solid ${pinError ? 'var(--lost)' : 'var(--accent)'}`,
                background: pinError ? 'var(--lost-soft)' : 'var(--accent-soft)',
                transition: 'all 0.15s',
              }}>
                <span style={{ position: 'absolute', inset: 3, borderRadius: 1, background: pinError ? 'var(--lost)' : 'var(--accent)' }} />
              </div>
            ))}
          </div>

          {/* Keypad */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {PAD.map((key, i) => {
              const isBack = key === '⌫';
              const isSubmit = key === '✓';
              const disabled = isSubmit ? (!pin || pinSubmitting) : (!isBack && pin.length >= MAX_PIN_LEN);
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (isBack) handlePinBack();
                    else if (isSubmit) handlePinSubmit();
                    else handlePinDigit(key);
                  }}
                  disabled={disabled}
                  style={{
                    background: (isBack || isSubmit) ? 'transparent' : 'var(--surface)',
                    border: `1px solid ${(isBack || isSubmit) ? 'transparent' : 'var(--border)'}`,
                    borderRadius: 11,
                    color: isSubmit ? 'var(--accent)' : isBack ? 'var(--text-faint)' : 'var(--text)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: (isBack || isSubmit) ? 20 : 18,
                    fontWeight: 600,
                    height: 58,
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                    opacity: disabled ? 0.3 : 1,
                  }}
                  onMouseEnter={e => { if (!isBack && !isSubmit) e.currentTarget.style.borderColor = 'var(--accent)'; if (!isBack && !isSubmit) e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = (isBack || isSubmit) ? 'transparent' : 'var(--border)'; e.currentTarget.style.color = isSubmit ? 'var(--accent)' : isBack ? 'var(--text-faint)' : 'var(--text)'; }}
                >
                  {key}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Panel ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Confirm dialog ── */}
      {confirm && (
        <ConfirmDialog
          {...confirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* ── Add bet preview modal ── */}
      {previewBet && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(6px)', zIndex: 200,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            padding: '32px 16px', overflowY: 'auto',
          }}
          onClick={e => { if (e.target === e.currentTarget) setPreviewBet(null); }}
        >
          <div style={{ width: '100%', maxWidth: 480 }}>
            <div style={{ marginBottom: 14 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Preview Slip</h3>
              <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>Check your bet before adding it.</p>
            </div>
            <BetCard bet={previewBet} fmt="decimal" shareable={false} />
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                onClick={() => setPreviewBet(null)}
                style={{
                  flex: 1, background: 'transparent', border: '1px solid var(--border)',
                  borderRadius: 10, color: 'var(--text-muted)', fontSize: 14, fontWeight: 600,
                  padding: 12, cursor: 'pointer',
                }}
              >
                ← Keep Editing
              </button>
              <button
                onClick={async () => { setPreviewBet(null); await doSave(); }}
                disabled={saving}
                style={{
                  flex: 1, background: 'var(--accent)', border: 'none',
                  borderRadius: 10, color: 'var(--accent-contrast)', fontSize: 14, fontWeight: 700,
                  padding: 12, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Adding…' : 'Confirm & Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Batch screenshot preview modal ── */}
      {batchPreview && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(6px)', zIndex: 200,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            padding: '32px 16px', overflowY: 'auto',
          }}
          onClick={e => { if (e.target === e.currentTarget && !batchSaving) { setBatchPreview(null); setBatchErrors([]); } }}
        >
          <div style={{ width: '100%', maxWidth: 480 }}>
            <div style={{ marginBottom: 14 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                Preview {batchPreview.length} Slip{batchPreview.length !== 1 ? 's' : ''}
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>Remove any that don&apos;t look right, then add the rest at once.</p>
            </div>

            {batchErrors.length > 0 && (
              <div style={{ background: 'var(--lost-soft)', border: '1px solid color-mix(in srgb, var(--lost) 40%, transparent)', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--lost)', marginBottom: 4 }}>
                  {batchErrors.length} screenshot{batchErrors.length !== 1 ? 's' : ''} couldn&apos;t be read:
                </p>
                {batchErrors.map((e, i) => <p key={i} style={{ fontSize: 11, color: 'var(--lost)' }}>{e}</p>)}
              </div>
            )}

            {batchPreview.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', padding: '20px 0' }}>Nothing left to add.</p>
            ) : (
              batchPreview.map((bet, i) => (
                <div key={bet.id} style={{ position: 'relative', marginBottom: 12 }}>
                  <BetCard bet={bet} fmt="decimal" shareable={false} />
                  <button
                    onClick={() => setBatchPreview(prev => prev ? prev.filter((_, j) => j !== i) : prev)}
                    title="Remove this one"
                    style={{
                      position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: '50%',
                      background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--lost)',
                      fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                onClick={() => { setBatchPreview(null); setBatchErrors([]); }}
                disabled={batchSaving}
                style={{
                  flex: 1, background: 'transparent', border: '1px solid var(--border)',
                  borderRadius: 10, color: 'var(--text-muted)', fontSize: 14, fontWeight: 600,
                  padding: 12, cursor: batchSaving ? 'not-allowed' : 'pointer',
                }}
              >
                Discard All
              </button>
              <button
                onClick={handleAddAllBatch}
                disabled={batchSaving || batchPreview.length === 0}
                style={{
                  flex: 1, background: 'var(--accent)', border: 'none',
                  borderRadius: 10, color: 'var(--accent-contrast)', fontSize: 14, fontWeight: 700,
                  padding: 12, cursor: (batchSaving || batchPreview.length === 0) ? 'not-allowed' : 'pointer',
                  opacity: (batchSaving || batchPreview.length === 0) ? 0.6 : 1,
                }}
              >
                {batchSaving ? 'Adding…' : `Add All (${batchPreview.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: CONTENT_WIDTH, margin: '0 auto', padding: '16px 20px 64px' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: 19, fontWeight: 700, color: 'var(--text)' }}>Admin</h1>
          {msg && <span style={{ fontSize: 12, color: msg.startsWith('Error') ? 'var(--lost)' : 'var(--won)', fontWeight: 600 }}>{msg}</span>}
        </div>

        {/* Tabs */}
        <div className="no-scrollbar" style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto' }}>
          {(['add', 'manage', 'bankroll', 'reports', 'data', 'trash'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flexShrink: 0,
              background: tab === t ? 'var(--accent)' : 'transparent',
              border: `1px solid ${tab === t ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 20, color: tab === t ? 'var(--accent-contrast)' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: tab === t ? 700 : 600, letterSpacing: '0.03em',
              padding: '6px 16px', cursor: 'pointer',
            }}>
              {t === 'add' ? (editingId ? 'Edit Bet' : '+ Add Bet')
                : t === 'manage' ? `Manage (${bets.length})`
                : t === 'bankroll' ? 'Bankroll'
                : t === 'reports' ? 'Reports'
                : t === 'data' ? 'Data'
                : 'Trash'}
            </button>
          ))}
        </div>

        {/* ── ADD / EDIT FORM ── */}
        {tab === 'add' && (
          <form onSubmit={handleSubmit}>
            {/* Import from screenshot / text */}
            {!editingId && (
              <AiGate enabled={aiEnabled} anchor="import">
              <div style={SECTION}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <p style={{ ...SECTION_TITLE, margin: 0 }}>IMPORT</p>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['screenshot', 'text'] as const).map(m => (
                      <button key={m} type="button" onClick={() => setImportMode(m)} style={{
                        background: importMode === m ? 'var(--accent-soft)' : 'transparent',
                        border: `1px solid ${importMode === m ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 14, color: importMode === m ? 'var(--accent)' : 'var(--text-faint)',
                        fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, padding: '4px 10px', cursor: 'pointer',
                      }}>
                        {m === 'screenshot' ? 'Screenshot' : 'Describe it'}
                      </button>
                    ))}
                  </div>
                </div>

                {importMode === 'text' ? (
                  <div>
                    <textarea
                      value={nlText}
                      onChange={e => setNlText(e.target.value)}
                      placeholder="e.g. £10 acca, Arsenal to win vs Chelsea at 1.80 and Man City over 2.5 goals at 1.65, placed today"
                      rows={3}
                      disabled={parsingText}
                      style={{ ...INPUT, resize: 'vertical' as const, marginBottom: 8 }}
                    />
                    <button
                      type="button"
                      onClick={handleParseText}
                      disabled={parsingText || !nlText.trim()}
                      style={{
                        background: 'var(--accent)', border: 'none', borderRadius: 8,
                        color: 'var(--accent-contrast)', fontSize: 13, fontWeight: 700, padding: '9px 16px',
                        cursor: (parsingText || !nlText.trim()) ? 'not-allowed' : 'pointer',
                        opacity: (parsingText || !nlText.trim()) ? 0.6 : 1,
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                      }}
                    >
                      {parsingText && (
                        <span aria-hidden style={{
                          width: 13, height: 13, borderRadius: '50%',
                          border: '2px solid color-mix(in srgb, var(--accent-contrast) 40%, transparent)',
                          borderTopColor: 'var(--accent-contrast)', animation: 'spin 0.7s linear infinite', display: 'inline-block',
                        }} />
                      )}
                      {parsingText ? 'Reading…' : 'Parse Description'}
                    </button>
                    {parseError && <p style={{ fontSize: 12, color: 'var(--lost)', marginTop: 8 }}>{parseError}</p>}
                  </div>
                ) : (
                <>
                <label
                  onDragOver={e => { e.preventDefault(); if (!parsingSlip) setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setDragOver(false);
                    if (parsingSlip) return;
                    if (e.dataTransfer.files?.length) handleSlipFiles(e.dataTransfer.files);
                  }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 8, textAlign: 'center', cursor: parsingSlip ? 'wait' : 'pointer',
                    border: `1.5px dashed ${(dragOver || parsingSlip) ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 10,
                    padding: '24px 18px', background: (dragOver || parsingSlip) ? 'var(--accent-soft)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="file" accept="image/*" multiple style={{ display: 'none' }} disabled={parsingSlip}
                    onChange={e => { if (e.target.files?.length) handleSlipFiles(e.target.files); e.target.value = ''; }}
                  />

                  {parsingSlip ? (
                    <span
                      aria-hidden
                      style={{
                        width: 32, height: 32, borderRadius: '50%',
                        border: '3px solid var(--border)', borderTopColor: 'var(--accent)',
                        animation: 'spin 0.8s linear infinite', display: 'block',
                      }}
                    />
                  ) : (
                    <span aria-hidden style={{ width: 36, height: 24, border: '2px solid var(--accent)', borderRadius: 5, position: 'relative', display: 'block' }}>
                      <span style={{ position: 'absolute', left: 4, right: 4, top: '50%', height: 1.5, background: 'var(--accent)', opacity: 0.6 }} />
                    </span>
                  )}

                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }} aria-live="polite">
                    {parsingSlip
                      ? (batchProgress.total > 1 ? `Reading screenshot ${batchProgress.done + 1} of ${batchProgress.total}…` : 'Reading screenshot…')
                      : 'Drop betslip screenshots here, or click to choose one or more'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-faint)', maxWidth: 320 }}>
                    {parsingSlip
                      ? 'Extracting selections, odds, sport and result — this can take a few seconds per slip'
                      : 'Fills in date, selections, market, matchup, odds, sport, result and stake — review before adding. Drop several at once to import them all.'}
                  </span>

                  {parsingSlip && (
                    <span style={{ width: '100%', maxWidth: 200, height: 3, borderRadius: 2, background: 'var(--border)', overflow: 'hidden', marginTop: 2, position: 'relative' }}>
                      <span style={{
                        position: 'absolute', top: 0, bottom: 0, width: '40%',
                        background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                        animation: 'scan-sweep 1.1s ease-in-out infinite',
                      }} />
                    </span>
                  )}
                </label>
                {parseError && (
                  <p style={{ fontSize: 12, color: 'var(--lost)', marginTop: 8 }}>{parseError}</p>
                )}
                </>
                )}
              </div>
              </AiGate>
            )}

            {/* Templates */}
            {!editingId && templates.length > 0 && (
              <div style={SECTION}>
                <p style={SECTION_TITLE}>START FROM A TEMPLATE</p>
                <select value={templatePick} onChange={e => applyTemplate(e.target.value)} style={SELECT}>
                  <option value="">Select a saved template…</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.legs.length} leg{t.legs.length !== 1 ? 's' : ''})</option>)}
                </select>
                {templatePick && (
                  <button type="button" onClick={() => { handleDeleteTemplate(templatePick); setTemplatePick(''); }} style={{
                    marginTop: 8, background: 'transparent', border: '1px solid color-mix(in srgb, var(--lost) 30%, transparent)',
                    borderRadius: 6, color: 'var(--lost)', fontSize: 11, padding: '4px 10px', cursor: 'pointer',
                  }}>
                    Delete selected template
                  </button>
                )}
              </div>
            )}

            {/* Bet details */}
            <div style={SECTION}>
              <p style={SECTION_TITLE}>BET DETAILS</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={LABEL}>Date</label>
                  <input type="date" value={form.date.split('T')[0]}
                    onChange={e => setForm(f => ({ ...f, date: `${e.target.value}T${f.date.split('T')[1] ?? '00:00'}` }))}
                    style={INPUT} required />
                </div>
                <div>
                  <label style={LABEL}>Time</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select value={(form.date.split('T')[1] ?? '00:00').split(':')[0]}
                      onChange={e => {
                        const min = (form.date.split('T')[1] ?? '00:00').split(':')[1];
                        setForm(f => ({ ...f, date: `${f.date.split('T')[0]}T${e.target.value}:${min}` }));
                      }} style={SELECT}>
                      {Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0')).map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <select value={(form.date.split('T')[1] ?? '00:00').split(':')[1]}
                      onChange={e => {
                        const hr = (form.date.split('T')[1] ?? '00:00').split(':')[0];
                        setForm(f => ({ ...f, date: `${f.date.split('T')[0]}T${hr}:${e.target.value}` }));
                      }} style={SELECT}>
                      {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={LABEL}>Type</label>
                  <select value={form.type} onChange={e => {
                    const type = e.target.value as BetType;
                    setForm(f => ({ ...f, type, title: titleAuto ? autoTitle(type) : f.title }));
                  }} style={SELECT}>
                    {BET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LABEL}>Title</label>
                  <input value={form.title} onChange={e => { setTitleAuto(false); setForm(f => ({ ...f, title: e.target.value })); }}
                    placeholder="e.g. 4 Fold Acca" style={INPUT} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={LABEL}>Bookmaker</label>
                  <input value={form.bookmaker} onChange={e => setForm(f => ({ ...f, bookmaker: e.target.value }))}
                    placeholder="e.g. Bet365" style={INPUT} list="bookmaker-options" />
                  <datalist id="bookmaker-options">
                    {bookmakerOptions.map(b => <option key={b} value={b} />)}
                  </datalist>
                </div>
                <div>
                  <label style={LABEL}>Tags</label>
                  <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    placeholder="comma separated, e.g. value, in-play" style={INPUT} list="tag-options" />
                  <datalist id="tag-options">
                    {tagOptions.map(t => <option key={t} value={t} />)}
                  </datalist>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 4 }}>
                <div>
                  {/* Label: "Total Odds" normally; "Base Odds" when boosted */}
                  <label style={LABEL}>{form.isBoosted ? 'Base Odds' : 'Total Odds'}</label>
                  <div style={{ position: 'relative' }}>
                    {form.oddsAutoCalc ? (
                      <input readOnly value={form.odds} style={{ ...INPUT, fontFamily: 'var(--font-mono)', paddingRight: 58, opacity: 0.85 }} />
                    ) : (
                      <NumberKeypadInput value={form.odds} onChange={odds => setForm(f => ({
                        ...f, odds, legs: f.legs.map(l => l.oddsTouched ? l : { ...l, odds }),
                      }))} style={{ paddingRight: 58 }} />
                    )}
                    <label style={{
                      position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                      display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--accent)',
                      cursor: 'pointer', userSelect: 'none',
                    }}>
                      <input type="checkbox" checked={form.oddsAutoCalc} onChange={e => {
                        const on = e.target.checked;
                        setForm(f => ({ ...f, oddsAutoCalc: on, odds: on ? computeBaseOddsFromLegs(f.legs) : f.odds }));
                      }} />
                      Auto
                    </label>
                  </div>
                </div>
                <div>
                  <label style={LABEL}>Stake ({CURRENCY_SYMBOL})</label>
                  <NumberKeypadInput value={form.stake} onChange={v => setForm(f => ({ ...f, stake: v }))} />
                  <PresetChips values={STAKE_PRESETS} prefix={CURRENCY_SYMBOL} onPick={v => setForm(f => ({ ...f, stake: v }))} />
                </div>
                <div>
                  <label style={LABEL}>Result</label>
                  <select value={form.result}
                    onChange={e => setForm(f => ({ ...f, result: e.target.value as BetResult }))}
                    style={{ ...SELECT, color: RESULT_COLORS[form.result] }}>
                    <option value="pending">Pending</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                    <option value="void">Void</option>
                  </select>
                </div>
              </div>

              <StakeSizer odds={form.odds} onApply={stake => setForm(f => ({ ...f, stake }))} />

              {form.result === 'won' && (
                <div style={FIELD}>
                  <label style={LABEL}>Returns ({CURRENCY_SYMBOL})</label>
                  {form.cashedOut ? (
                    <NumberKeypadInput value={form.returns} placeholder="e.g. 59.86"
                      onChange={v => setForm(f => ({ ...f, returns: v }))} />
                  ) : (
                    <input readOnly value={computeWinReturns(form).toFixed(2)} style={{ ...INPUT, fontFamily: 'var(--font-mono)', opacity: 0.85 }} />
                  )}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}>
                    <input type="checkbox" checked={form.cashedOut} onChange={e => {
                      const cashedOut = e.target.checked;
                      setForm(f => ({ ...f, cashedOut, returns: cashedOut ? f.returns : '' }));
                    }} />
                    Cashed out early
                  </label>
                </div>
              )}

              {/* Boosted toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)' }}>
                  <input type="checkbox" checked={form.isBoosted}
                    onChange={e => setForm(f => ({ ...f, isBoosted: e.target.checked, boostedOdds: '' }))} />
                  Boosted odds
                </label>
                {form.isBoosted && (
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <label style={LABEL}>Boosted Odds</label>
                    <div style={{ position: 'relative' }}>
                      {form.boostedOddsAutoCalc ? (
                        <input readOnly value={form.boostedOdds} style={{ ...INPUT, fontFamily: 'var(--font-mono)', paddingRight: 58, opacity: 0.85 }} />
                      ) : (
                        <NumberKeypadInput value={form.boostedOdds} onChange={v => setForm(f => ({ ...f, boostedOdds: v }))}
                          placeholder="e.g. 5.50" style={{ paddingRight: 58 }} />
                      )}
                      <label style={{
                        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                        display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--accent)',
                        cursor: 'pointer', userSelect: 'none',
                      }}>
                        <input type="checkbox" checked={form.boostedOddsAutoCalc} onChange={e => {
                          const on = e.target.checked;
                          setForm(f => ({ ...f, boostedOddsAutoCalc: on, boostedOdds: on ? computeBoostedOddsFromLegs(f.legs) : f.boostedOdds }));
                        }} />
                        Auto
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Legs */}
            <div style={SECTION}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={{ ...SECTION_TITLE, margin: 0 }}>LEGS ({form.legs.length})</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={handleSaveTemplate} disabled={savingTemplate} style={{
                    background: 'transparent', border: '1px solid var(--border)', borderRadius: 6,
                    color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12, padding: '4px 10px',
                    cursor: savingTemplate ? 'not-allowed' : 'pointer', opacity: savingTemplate ? 0.6 : 1,
                  }}>
                    ☆ Save as Template
                  </button>
                  <button type="button" onClick={addLeg} style={{
                    background: 'transparent', border: '1px solid var(--border)', borderRadius: 6,
                    color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 12, padding: '4px 10px', cursor: 'pointer',
                  }}>
                    + Leg
                  </button>
                </div>
              </div>

              {form.legs.map((leg, i) => (
                <div key={i} style={{ background: 'var(--bg)', border: '1px solid var(--border-soft)', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.06em' }}>LEG {i + 1}</span>
                    {form.legs.length > 1 && (
                      <button type="button" onClick={() => removeLeg(i)} style={{
                        background: 'transparent', border: 'none', color: 'var(--lost)', opacity: 0.7, fontSize: 12, cursor: 'pointer', padding: 0,
                      }}>✕ Remove</button>
                    )}
                  </div>

                  {/* Sport + builder toggle */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 10, alignItems: 'end' }}>
                    <div>
                      <label style={LABEL}>Sport</label>
                      <select value={leg.sport} onChange={e => {
                        const sport = e.target.value as SportType;
                        updateLeg(i, 'sport', sport);
                        if (typeof window !== 'undefined') localStorage.setItem(LAST_SPORT_KEY, sport);
                      }} style={SELECT}>
                        {SPORTS.map(s => <option key={s.value} value={s.value}>{s.code} — {s.label}</option>)}
                      </select>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', paddingBottom: 9 }}>
                      <input type="checkbox" checked={leg.isBetBuilder}
                        onChange={e => updateLeg(i, 'isBetBuilder', e.target.checked)} />
                      Builder
                    </label>
                  </div>

                  <div style={FIELD}>
                    <label style={LABEL}>{leg.isBetBuilder ? 'Builder Name' : 'Selection'}</label>
                    <input value={leg.selection} onChange={e => updateLeg(i, 'selection', e.target.value)}
                      placeholder={leg.isBetBuilder ? 'e.g. Arsenal Bet Builder' : 'e.g. Arsenal'} style={INPUT} required />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={LABEL}>Market</label>
                      <MarketQuickPick onPick={v => updateLeg(i, 'market', v)} />
                      <input value={leg.market} onChange={e => updateLeg(i, 'market', e.target.value)}
                        placeholder="e.g. Match Result" style={INPUT} required />
                    </div>
                    <div>
                      <label style={LABEL}>Matchup</label>
                      <input value={leg.matchup} onChange={e => updateLeg(i, 'matchup', e.target.value)}
                        placeholder="e.g. Arsenal vs Chelsea" style={INPUT} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div>
                      {/* Label changes to "Base Odds" when boosted. Optional — mirrors main odds until edited. */}
                      <label style={LABEL}>{leg.isBoosted ? 'Base Odds' : 'Odds'}</label>
                      <NumberKeypadInput value={leg.odds} placeholder={form.odds}
                        onChange={v => updateLegOdds(i, { odds: v, oddsTouched: true })} />
                    </div>
                    <div>
                      <label style={LABEL}>Result</label>
                      <select value={leg.result} onChange={e => updateLeg(i, 'result', e.target.value as BetResult)}
                        style={{ ...SELECT, color: RESULT_COLORS[leg.result] }}>
                        <option value="pending">Pending</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                        <option value="void">Void</option>
                      </select>
                    </div>
                  </div>

                  {/* Leg boosted */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}>
                      <input type="checkbox" checked={leg.isBoosted}
                        onChange={e => updateLegOdds(i, { isBoosted: e.target.checked })} />
                      Boosted
                    </label>
                    {leg.isBoosted && (
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <label style={LABEL}>Boosted Odds</label>
                        <NumberKeypadInput value={leg.boostedOdds} placeholder="e.g. 1.25"
                          onChange={v => updateLegOdds(i, { boostedOdds: v })} />
                      </div>
                    )}
                  </div>

                  {/* Bet builder sub-legs */}
                  {leg.isBetBuilder && (
                    <SubLegEditor subLegs={leg.subLegs} onChange={s => updateLeg(i, 'subLegs', s)} />
                  )}

                  {/* Outcome */}
                  <div style={{ borderTop: '1px solid var(--border-soft)', marginTop: 10, paddingTop: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                      <input type="checkbox" checked={leg.outcomeDecided}
                        onChange={e => updateLeg(i, 'outcomeDecided', e.target.checked)} />
                      Outcome decided — enter result
                    </label>
                    {leg.outcomeDecided && (
                      <div style={{ paddingLeft: 4 }}>
                        <OutcomeFields sport={leg.sport} outcome={leg.outcome}
                          onChange={o => updateLeg(i, 'outcome', o)} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div style={SECTION}>
              <p style={SECTION_TITLE}>NOTES (OPTIONAL)</p>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any notes about this bet…" rows={2}
                style={{ ...INPUT, resize: 'vertical' as const }} />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={saving} style={{
                flex: 1, background: 'var(--accent)', border: 'none', borderRadius: 10,
                color: 'var(--accent-contrast)', fontSize: 14, fontWeight: 700, padding: 12,
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
              }}>
                {editingId ? 'Update Bet' : 'Preview & Add'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancelEdit} style={{
                  background: 'transparent', border: '1px solid var(--border)', borderRadius: 10,
                  color: 'var(--text-muted)', fontSize: 14, padding: '12px 16px', cursor: 'pointer',
                }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}

        {/* ── MANAGE TAB ── */}
        {tab === 'manage' && (
          <div>
            {bets.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '40px 0', fontSize: 14 }}>No bets yet. Add one!</p>
            )}

            {selectedIds.size > 0 && (
              <div style={{
                position: 'sticky', top: 8, zIndex: 50, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: 12, padding: '9px 12px', marginBottom: 14,
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 700, color: 'var(--accent)', marginRight: 4 }}>
                  {selectedIds.size} SELECTED
                </span>
                {(['won', 'lost', 'void', 'pending'] as const).map(r => (
                  <button key={r} type="button" disabled={bulkBusy} onClick={() => bulkSetResult(r)} style={{
                    background: 'transparent', border: `1px solid color-mix(in srgb, ${RESULT_COLORS[r]} 45%, transparent)`,
                    borderRadius: 6, color: RESULT_COLORS[r], fontSize: 11, fontWeight: 600, padding: '4px 10px',
                    cursor: bulkBusy ? 'not-allowed' : 'pointer', opacity: bulkBusy ? 0.5 : 1,
                  }}>
                    Mark {r}
                  </button>
                ))}
                <button type="button" disabled={bulkBusy} onClick={bulkDelete} style={{
                  background: 'transparent', border: '1px solid color-mix(in srgb, var(--lost) 45%, transparent)',
                  borderRadius: 6, color: 'var(--lost)', fontSize: 11, fontWeight: 600, padding: '4px 10px',
                  cursor: bulkBusy ? 'not-allowed' : 'pointer', opacity: bulkBusy ? 0.5 : 1,
                }}>
                  Delete
                </button>
                <button type="button" onClick={() => setSelectedIds(new Set())} style={{
                  marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-faint)', fontSize: 11, cursor: 'pointer',
                }}>
                  Clear
                </button>
              </div>
            )}

            {groupByDay([...bets].sort((a, b) => +new Date(b.date) - +new Date(a.date))).map(({ label, bets: dayBets }, gi) => (
              <div key={label} style={{ marginTop: gi > 0 ? 24 : 0 }}>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--text-faint)',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  paddingBottom: 10, borderBottom: '1px solid var(--border)', marginBottom: 12,
                }}>
                  {label}
                </div>
                {dayBets.map(bet => (
                  <div key={bet.id} style={{
                    background: 'var(--surface)',
                    border: `1px solid ${selectedIds.has(bet.id) ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 12, padding: '11px 14px', marginBottom: 10,
                    display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap',
                  }}>
                    {/* Select */}
                    <div style={{ paddingTop: 2, flexShrink: 0 }}>
                      <input type="checkbox" checked={selectedIds.has(bet.id)} onChange={() => toggleSelect(bet.id)}
                        style={{ width: 15, height: 15, cursor: 'pointer' }} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{bet.title}</span>
                      {bet.bookmaker && <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 6 }}>· {bet.bookmaker}</span>}
                      <span className="tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-faint)', display: 'block', marginTop: 2 }}>
                        {new Date(bet.date).toLocaleDateString('en-GB')} · {bet.legs.length} leg{bet.legs.length !== 1 ? 's' : ''} · @{bet.totalOdds} · {CURRENCY_SYMBOL}{bet.stake}
                      </span>
                    </div>

                    {/* Result */}
                    <div style={{ flexShrink: 0, paddingTop: 1 }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 700, padding: '3px 8px', borderRadius: 5,
                        background: `color-mix(in srgb, ${RESULT_COLORS[bet.result]} 14%, transparent)`,
                        color: RESULT_COLORS[bet.result],
                        border: `1px solid color-mix(in srgb, ${RESULT_COLORS[bet.result]} 45%, transparent)`,
                      }}>
                        {bet.result.toUpperCase()}
                      </span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0, width: '100%', justifyContent: 'flex-end' }}>
                      {bet.result === 'pending' && (
                        <button
                          onClick={() => openSettleSuggest(bet)}
                          disabled={aiEnabled === false}
                          title={aiEnabled === false ? "AI features aren't configured — see the Knowledge Base" : undefined}
                          style={{
                            background: 'transparent', border: '1px solid color-mix(in srgb, var(--pending) 40%, transparent)', borderRadius: 6,
                            color: 'var(--pending)', fontSize: 11, padding: '4px 10px',
                            cursor: aiEnabled === false ? 'not-allowed' : 'pointer', opacity: aiEnabled === false ? 0.4 : 1,
                          }}>
                          Suggest Result
                        </button>
                      )}
                      <button onClick={() => handleEdit(bet)} style={{
                        background: 'transparent', border: '1px solid var(--border)', borderRadius: 6,
                        color: 'var(--accent)', fontSize: 11, padding: '4px 10px', cursor: 'pointer',
                      }}>Edit</button>
                      <button onClick={() => confirmDelete(bet.id)} style={{
                        background: 'transparent', border: '1px solid color-mix(in srgb, var(--lost) 30%, transparent)', borderRadius: 6,
                        color: 'var(--lost)', fontSize: 11, padding: '4px 10px', cursor: 'pointer',
                      }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── BANKROLL TAB ── */}
        {tab === 'bankroll' && <BankrollAdmin />}

        {/* ── REPORTS TAB ── */}
        {tab === 'reports' && <ReportsAdmin bets={bets} aiEnabled={aiEnabled} />}

        {/* ── DATA TAB ── */}
        {tab === 'data' && <DataAdmin bets={bets} onImported={loadBets} />}

        {/* ── TRASH TAB ── */}
        {tab === 'trash' && <TrashAdmin onChanged={loadBets} />}
      </div>

      {/* ── Settle suggestion modal ── */}
      {settling && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(6px)', zIndex: 200,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            padding: '32px 16px', overflowY: 'auto',
          }}
          onClick={e => { if (e.target === e.currentTarget && !settleBusy) { setSettling(null); setSettleResult(null); } }}
        >
          <div style={{ width: '100%', maxWidth: 440, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 18px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
              Suggested Result
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 14 }}>{settling.title}</p>

            {settleBusy && (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <span aria-hidden style={{
                  display: 'inline-block', width: 26, height: 26, borderRadius: '50%',
                  border: '3px solid var(--border)', borderTopColor: 'var(--accent)',
                  animation: 'spin 0.8s linear infinite', marginBottom: 10,
                }} />
                <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>Searching the web for results…</p>
              </div>
            )}

            {settleError && <p style={{ fontSize: 12, color: 'var(--lost)', marginBottom: 12 }}>{settleError}</p>}

            {settleResult && (
              <>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 12 }}>{settleResult.summary}</p>
                {settleResult.legs.map(s => {
                  const leg = settling.legs[s.index];
                  if (!leg) return null;
                  return (
                    <div key={s.index} style={{ borderTop: '1px solid var(--border-soft)', padding: '9px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{leg.selection}</span>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                          background: `color-mix(in srgb, ${RESULT_COLORS[s.result]} 14%, transparent)`, color: RESULT_COLORS[s.result], flexShrink: 0,
                        }}>
                          {s.result.toUpperCase()} · {s.confidence}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 3 }}>{s.note}</p>
                    </div>
                  );
                })}
              </>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => { setSettling(null); setSettleResult(null); }} style={{
                flex: 1, background: 'transparent', border: '1px solid var(--border)', borderRadius: 10,
                color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, padding: 11, cursor: 'pointer',
              }}>
                Close
              </button>
              {settleResult && (
                <button onClick={applySettleSuggestion} style={{
                  flex: 1, background: 'var(--accent)', border: 'none', borderRadius: 10,
                  color: 'var(--accent-contrast)', fontSize: 13, fontWeight: 700, padding: 11, cursor: 'pointer',
                }}>
                  Review &amp; Apply
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
