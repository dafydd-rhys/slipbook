'use client';

import { useEffect, useState } from 'react';
import BetCard from '@/components/BetCard';
import { Bet, BetLeg, BetResult, BetSubLeg, BetType, SportOutcome, SportType } from '@/lib/types';

const ADMIN_KEY = '131275';
const CONTENT_WIDTH = 720;

// ── Style constants ───────────────────────────────────────────────────────────
const INPUT: React.CSSProperties = {
  background: '#0a0a14', border: '1px solid #2a2a52', borderRadius: 8,
  color: '#f1f5f9', fontSize: 13, padding: '8px 10px', width: '100%', outline: 'none',
};
const SELECT: React.CSSProperties = { ...INPUT };
const LABEL: React.CSSProperties = {
  fontSize: 11, color: '#475569', fontWeight: 700, letterSpacing: '0.05em',
  display: 'block', marginBottom: 4,
};
const FIELD: React.CSSProperties = { marginBottom: 12 };
const SECTION: React.CSSProperties = {
  background: '#16162e', border: '1px solid #1e1e3e', borderRadius: 14,
  padding: 16, marginBottom: 14,
};
const SECTION_TITLE: React.CSSProperties = {
  fontSize: 10, color: '#6d28d9', fontWeight: 800, letterSpacing: '0.1em',
  marginBottom: 14,
};
const RESULT_COLORS: Record<BetResult, string> = {
  won: '#10b981', lost: '#ef4444', void: '#94a3b8', pending: '#f59e0b',
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

const SPORTS: { value: SportType; emoji: string; label: string }[] = [
  { value: 'football',     emoji: '⚽', label: 'Football' },
  { value: 'tennis',       emoji: '🎾', label: 'Tennis' },
  { value: 'basketball',   emoji: '🏀', label: 'Basketball' },
  { value: 'esports',      emoji: '🎮', label: 'Esports / CS' },
  { value: 'cricket',      emoji: '🏏', label: 'Cricket' },
  { value: 'horse_racing', emoji: '🏇', label: 'Horse Racing' },
  { value: 'golf',         emoji: '⛳', label: 'Golf' },
  { value: 'rugby',        emoji: '🏉', label: 'Rugby' },
  { value: 'boxing',       emoji: '🥊', label: 'Boxing' },
  { value: 'mma',          emoji: '🥋', label: 'MMA' },
  { value: 'darts',        emoji: '🎯', label: 'Darts' },
  { value: 'other',        emoji: '❔', label: 'Other' },
];

const COMMON_MARKETS = [
  'Match Result', 'Both Teams to Score', 'Over 2.5 Goals', 'Under 2.5 Goals',
  'Correct Score', 'Anytime Goalscorer', 'First Goalscorer', 'Double Chance',
  'Draw No Bet', 'Handicap', 'Outright Winner', 'Set Betting', 'To Win Match',
];

const ODDS_PRESETS = ['2.00', '2.50', '3.00', '4.00', '5.00', '10.00'];
const STAKE_PRESETS = ['5', '10', '15', '20', '25', '50'];

const LAST_SPORT_KEY = 'strz_last_sport';

// ── Small reusable UI bits ─────────────────────────────────────────────────────
function PresetChips({ values, onPick, prefix = '' }: { values: string[]; onPick: (v: string) => void; prefix?: string }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
      {values.map(v => (
        <button key={v} type="button" onClick={() => onPick(v)} style={{
          background: 'transparent', border: '1px solid #2a2a52', borderRadius: 6,
          color: '#a78bfa', fontSize: 11, padding: '3px 8px', cursor: 'pointer',
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
    background: 'transparent', border: '1px solid #2a2a52', borderRadius: 6,
    color: '#a78bfa', fontSize: 14, fontWeight: 700, width: 28, height: 28, cursor: 'pointer', flexShrink: 0,
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
          style={{ ...INPUT, width: 44, textAlign: 'center', padding: '4px 2px', flexShrink: 0 }} />
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
  function tap(key: string) {
    if (key === '⌫') { onChange(value.slice(0, -1)); return; }
    if (key === '.' && value.includes('.')) return;
    onChange(value + key);
  }
  return (
    <>
      <input readOnly value={value} placeholder={placeholder} onClick={() => setOpen(true)}
        style={{ ...INPUT, ...style, cursor: 'pointer' }} />
      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
            zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div style={{ background: '#16162e', border: '1px solid #2a2a52', borderRadius: 14, padding: '20px 18px', width: '100%', maxWidth: 260 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#f1f5f9', textAlign: 'center', marginBottom: 16, minHeight: 34 }}>
              {value || '0'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map(k => (
                <button key={k} type="button" onClick={() => tap(k)} style={{
                  background: '#0a0a14', border: '1px solid #2a2a52', borderRadius: 10,
                  color: '#f1f5f9', fontSize: 18, fontWeight: 600, padding: '12px 0', cursor: 'pointer',
                }}>{k}</button>
              ))}
            </div>
            <button type="button" onClick={() => setOpen(false)} style={{
              marginTop: 12, width: '100%', background: '#7c3aed', border: 'none', borderRadius: 10,
              color: '#fff', fontSize: 14, fontWeight: 700, padding: 10, cursor: 'pointer',
            }}>
              Done
            </button>
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
function ConfirmDialog({ title, message, confirmLabel, confirmColor = '#ef4444', onConfirm, onCancel }: ConfirmDialogProps) {
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
        background: '#16162e', border: '1px solid #2a2a52', borderRadius: 14,
        padding: '24px 22px', width: '100%', maxWidth: 320,
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>{title}</h3>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{
            flex: 1, background: 'transparent', border: '1px solid #2a2a52',
            borderRadius: 8, color: '#64748b', fontSize: 13, fontWeight: 600,
            padding: '9px', cursor: 'pointer',
          }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{
            flex: 1, background: confirmColor, border: 'none',
            borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700,
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
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11, color: '#64748b', marginBottom: 8 }}>
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
    <div style={{ paddingLeft: 12, borderLeft: '2px solid #2a2a52', marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: '#475569', fontWeight: 700, letterSpacing: '0.06em' }}>
          BUILDER SELECTIONS ({subLegs.length})
        </span>
        <button type="button" onClick={() => onChange([...subLegs, { selection: '', market: '', result: 'pending' }])}
          style={{ background: 'transparent', border: '1px solid #2a2a52', borderRadius: 6, color: '#a78bfa', fontSize: 11, padding: '3px 8px', cursor: 'pointer' }}>
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
              style={{ background: 'transparent', border: 'none', color: '#ef444480', fontSize: 14, cursor: 'pointer', padding: 0, flexShrink: 0 }}>
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
  oddsAutoCalc: boolean;  // when true, odds is derived live from the product of leg odds
  boostedOdds: string;   // effective boosted odds (shown when isBoosted) — "Boosted Odds"
  isBoosted: boolean;
  stake: string; result: BetResult; returns: string; notes: string;
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

function computeOddsFromLegs(legs: LegForm[]): string {
  const total = legs.reduce((acc, l) => {
    const odds = l.isBoosted && l.boostedOdds ? parseFloat(l.boostedOdds) : parseFloat(l.odds) || 1;
    return acc * odds;
  }, 1);
  return total.toFixed(2);
}

function emptyForm(): BetForm {
  const odds = '2.00';
  return {
    date: new Date().toISOString().slice(0, 16),
    title: autoTitle('acca'), type: 'acca',
    odds, oddsAutoCalc: false, boostedOdds: '', isBoosted: false,
    stake: '10', result: 'pending', returns: '', notes: '',
    legs: [emptyLeg(undefined, odds)],
  };
}

// ── Build Bet object from form ────────────────────────────────────────────────
function buildBet(form: BetForm, id: string = 'preview'): Bet {
  const effectiveTotalOdds = form.isBoosted && form.boostedOdds
    ? parseFloat(form.boostedOdds) : parseFloat(form.odds) || 1;
  const baseTotalOdds = form.isBoosted && form.odds ? parseFloat(form.odds) : undefined;

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
    returns: form.result === 'won' && form.returns ? parseFloat(form.returns)
           : form.result === 'lost' ? 0 : undefined,
    notes: form.notes || undefined,
    legs: form.legs.map((l, i): BetLeg => {
      const legOdds = l.odds || form.odds;
      const effectiveOdds = l.isBoosted && l.boostedOdds
        ? parseFloat(l.boostedOdds) : parseFloat(legOdds) || 1;
      const baseOdds = l.isBoosted && legOdds ? parseFloat(legOdds) : undefined;
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
  const [bets, setBets]           = useState<Bet[]>([]);
  const [form, setForm]           = useState<BetForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [tab, setTab]             = useState<'add' | 'manage'>('add');
  const [msg, setMsg]             = useState('');
  const [titleAuto, setTitleAuto] = useState(true);

  // Modals
  const [previewBet, setPreviewBet] = useState<Bet | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string; message: string; confirmLabel: string; confirmColor?: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('admin') === btoa(ADMIN_KEY)) setAuthed(true);
  }, []);
  useEffect(() => { if (authed) loadBets(); }, [authed]);

  async function loadBets() {
    setBets(await fetch('/api/bets').then(r => r.json()));
  }

  function handlePinDigit(d: string) {
    if (pinError) { setPin(''); setPinError(false); }
    const next = (pinError ? '' : pin) + d;
    if (next.length < ADMIN_KEY.length) { setPin(next); return; }
    // full PIN entered
    if (next === ADMIN_KEY) {
      sessionStorage.setItem('admin', btoa(ADMIN_KEY));
      setAuthed(true);
    } else {
      setPin(next);
      setPinError(true);
      setTimeout(() => { setPin(''); setPinError(false); }, 600);
    }
  }

  function handlePinBack() {
    if (pinError) { setPin(''); setPinError(false); return; }
    setPin(p => p.slice(0, -1));
  }

  function updateLeg<K extends keyof LegForm>(i: number, field: K, val: LegForm[K]) {
    const legs = [...form.legs];
    legs[i] = { ...legs[i], [field]: val };
    setForm(f => ({ ...f, legs }));
  }
  // For leg fields that feed into the total odds (odds/boostedOdds/isBoosted) — recalculates
  // the main Total Odds field live when Auto-calc is on.
  function updateLegOdds(i: number, patch: Partial<LegForm>) {
    setForm(f => {
      const legs = [...f.legs];
      legs[i] = { ...legs[i], ...patch };
      return { ...f, legs, odds: f.oddsAutoCalc ? computeOddsFromLegs(legs) : f.odds };
    });
  }
  function addLeg() {
    setForm(f => {
      const legs = [...f.legs, emptyLeg(f.legs[f.legs.length - 1]?.sport, f.odds)];
      return { ...f, legs, odds: f.oddsAutoCalc ? computeOddsFromLegs(legs) : f.odds };
    });
  }
  function removeLeg(i: number) {
    setForm(f => {
      const legs = f.legs.filter((_, j) => j !== i);
      return { ...f, legs, odds: f.oddsAutoCalc ? computeOddsFromLegs(legs) : f.odds };
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
        confirmColor: '#7c3aed',
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
      headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
      body: JSON.stringify(bet),
    });
    if (res.ok) {
      setMsg(editingId ? 'Bet updated!' : 'Bet added!');
      setForm(emptyForm()); setEditingId(null); setTitleAuto(true);
      await loadBets(); setTab('manage');
    } else {
      setMsg('Error saving.');
    }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  }

  function confirmDelete(id: string) {
    setConfirm({
      title: 'Delete bet?',
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      confirmColor: '#ef4444',
      onConfirm: async () => {
        setConfirm(null);
        await fetch(`/api/bets/${id}`, { method: 'DELETE', headers: { 'x-admin-key': ADMIN_KEY } });
        await loadBets();
      },
    });
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
      isBoosted:   bet.isBoosted ?? false,
      stake:       String(bet.stake),
      result:      bet.result,
      returns:     bet.returns ? String(bet.returns) : '',
      notes:       bet.notes ?? '',
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
      confirmColor: '#ef4444',
      onConfirm: () => { setConfirm(null); setEditingId(null); setForm(emptyForm()); setTitleAuto(true); },
    });
  }

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (!authed) {
    const PIN_LEN = ADMIN_KEY.length;
    const PAD = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ width: '100%', maxWidth: 280, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#475569', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 28 }}>
            ENTER PIN
          </div>

          {/* Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 36 }}>
            {Array.from({ length: PIN_LEN }).map((_, i) => {
              const filled = i < pin.length;
              return (
                <div key={i} style={{
                  width: 14, height: 14, borderRadius: '50%',
                  background: pinError ? '#ef4444' : filled ? '#7c3aed' : 'transparent',
                  border: `2px solid ${pinError ? '#ef4444' : filled ? '#7c3aed' : '#2a2a52'}`,
                  transition: 'all 0.15s',
                }} />
              );
            })}
          </div>

          {/* Keypad */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {PAD.map((key, i) => {
              if (key === '') return <div key={i} />;
              const isBack = key === '⌫';
              return (
                <button
                  key={i}
                  onClick={() => isBack ? handlePinBack() : handlePinDigit(key)}
                  disabled={!isBack && pin.length >= PIN_LEN}
                  style={{
                    background: isBack ? 'transparent' : '#16162e',
                    border: `1px solid ${isBack ? 'transparent' : '#2a2a52'}`,
                    borderRadius: 12,
                    color: isBack ? '#475569' : '#f1f5f9',
                    fontSize: isBack ? 20 : 22,
                    fontWeight: 600,
                    height: 64,
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                    opacity: (!isBack && pin.length >= PIN_LEN) ? 0.3 : 1,
                  }}
                  onMouseEnter={e => { if (!isBack) e.currentTarget.style.background = '#1e1e42'; e.currentTarget.style.borderColor = '#4a4a8a'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = isBack ? 'transparent' : '#16162e'; e.currentTarget.style.borderColor = isBack ? 'transparent' : '#2a2a52'; }}
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
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Preview Slip</h3>
              <p style={{ fontSize: 12, color: '#475569' }}>Check your bet before adding it.</p>
            </div>
            <BetCard bet={previewBet} fmt="decimal" />
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                onClick={() => setPreviewBet(null)}
                style={{
                  flex: 1, background: 'transparent', border: '1px solid #2a2a52',
                  borderRadius: 10, color: '#64748b', fontSize: 14, fontWeight: 600,
                  padding: 12, cursor: 'pointer',
                }}
              >
                ← Keep Editing
              </button>
              <button
                onClick={async () => { setPreviewBet(null); await doSave(); }}
                disabled={saving}
                style={{
                  flex: 1, background: '#7c3aed', border: 'none',
                  borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700,
                  padding: 12, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Adding…' : 'Confirm & Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: CONTENT_WIDTH, margin: '0 auto', padding: '16px 20px 64px' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>Admin</h1>
          {msg && <span style={{ fontSize: 12, color: msg.startsWith('Error') ? '#ef4444' : '#10b981', fontWeight: 600 }}>{msg}</span>}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['add', 'manage'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: tab === t ? '#7c3aed' : 'transparent',
              border: `1px solid ${tab === t ? '#7c3aed' : '#2a2a52'}`,
              borderRadius: 20, color: tab === t ? '#fff' : '#64748b',
              fontSize: 12, fontWeight: tab === t ? 700 : 400,
              padding: '5px 16px', cursor: 'pointer',
            }}>
              {t === 'add' ? (editingId ? '✏️ Edit Bet' : '+ Add Bet') : `📋 Manage (${bets.length})`}
            </button>
          ))}
        </div>

        {/* ── ADD / EDIT FORM ── */}
        {tab === 'add' && (
          <form onSubmit={handleSubmit}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 4 }}>
                <div>
                  {/* Label: "Total Odds" normally; "Base Odds" when boosted */}
                  <label style={LABEL}>{form.isBoosted ? 'Base Odds' : 'Total Odds'}</label>
                  <div style={{ position: 'relative' }}>
                    {form.oddsAutoCalc ? (
                      <input readOnly value={form.odds} style={{ ...INPUT, paddingRight: 88, opacity: 0.85 }} />
                    ) : (
                      <NumberKeypadInput value={form.odds} onChange={odds => setForm(f => ({
                        ...f, odds, legs: f.legs.map(l => l.oddsTouched ? l : { ...l, odds }),
                      }))} style={{ paddingRight: 88 }} />
                    )}
                    <label style={{
                      position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                      display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#a78bfa',
                      cursor: 'pointer', userSelect: 'none',
                    }}>
                      <input type="checkbox" checked={form.oddsAutoCalc} onChange={e => {
                        const on = e.target.checked;
                        setForm(f => ({ ...f, oddsAutoCalc: on, odds: on ? computeOddsFromLegs(f.legs) : f.odds }));
                      }} />
                      Auto-calc
                    </label>
                  </div>
                  <PresetChips values={ODDS_PRESETS} prefix="@" onPick={v => setForm(f => ({
                    ...f, odds: v, legs: f.legs.map(l => l.oddsTouched ? l : { ...l, odds: v }),
                  }))} />
                </div>
                <div>
                  <label style={LABEL}>Stake (£)</label>
                  <NumberKeypadInput value={form.stake} onChange={v => setForm(f => ({ ...f, stake: v }))} />
                  <PresetChips values={STAKE_PRESETS} prefix="£" onPick={v => setForm(f => ({ ...f, stake: v }))} />
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

              {form.result === 'won' && (
                <div style={FIELD}>
                  <label style={LABEL}>Returns (£)</label>
                  <input type="number" step="0.01" min="0" inputMode="decimal" value={form.returns}
                    onChange={e => setForm(f => ({ ...f, returns: e.target.value }))} style={INPUT} />
                </div>
              )}

              {/* Boosted toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, color: '#94a3b8' }}>
                  <input type="checkbox" checked={form.isBoosted}
                    onChange={e => setForm(f => ({ ...f, isBoosted: e.target.checked, boostedOdds: '' }))} />
                  🚀 Boosted odds
                </label>
                {form.isBoosted && (
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <label style={LABEL}>Boosted Odds</label>
                    <NumberKeypadInput value={form.boostedOdds} onChange={v => setForm(f => ({ ...f, boostedOdds: v }))}
                      placeholder="e.g. 5.50" />
                  </div>
                )}
              </div>
            </div>

            {/* Legs */}
            <div style={SECTION}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={{ ...SECTION_TITLE, margin: 0 }}>LEGS ({form.legs.length})</p>
                <button type="button" onClick={addLeg} style={{
                  background: 'transparent', border: '1px solid #2a2a52', borderRadius: 6,
                  color: '#a78bfa', fontSize: 12, padding: '4px 10px', cursor: 'pointer',
                }}>
                  + Leg
                </button>
              </div>

              {form.legs.map((leg, i) => (
                <div key={i} style={{ background: '#0f0f22', border: '1px solid #1a1a38', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 10, color: '#334155', fontWeight: 700, letterSpacing: '0.06em' }}>LEG {i + 1}</span>
                    {form.legs.length > 1 && (
                      <button type="button" onClick={() => removeLeg(i)} style={{
                        background: 'transparent', border: 'none', color: '#ef444460', fontSize: 12, cursor: 'pointer', padding: 0,
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
                        {SPORTS.map(s => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
                      </select>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: '#64748b', paddingBottom: 9 }}>
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
                      <PresetChips values={ODDS_PRESETS} prefix="@" onPick={v => updateLegOdds(i, { odds: v, oddsTouched: true })} />
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
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: '#64748b' }}>
                      <input type="checkbox" checked={leg.isBoosted}
                        onChange={e => updateLegOdds(i, { isBoosted: e.target.checked })} />
                      🚀 Boosted
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
                  <div style={{ borderTop: '1px solid #1a1a38', marginTop: 10, paddingTop: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: '#64748b', marginBottom: 10 }}>
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
                flex: 1, background: '#7c3aed', border: 'none', borderRadius: 10,
                color: '#fff', fontSize: 14, fontWeight: 700, padding: 12,
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
              }}>
                {editingId ? 'Update Bet' : 'Preview & Add'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancelEdit} style={{
                  background: 'transparent', border: '1px solid #2a2a52', borderRadius: 10,
                  color: '#64748b', fontSize: 14, padding: '12px 16px', cursor: 'pointer',
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
              <p style={{ textAlign: 'center', color: '#334155', padding: '40px 0', fontSize: 14 }}>No bets yet. Add one!</p>
            )}
            {bets.map(bet => (
              <div key={bet.id} style={{
                background: '#16162e', border: '1px solid #1a1a38', borderRadius: 12,
                padding: '11px 0', marginBottom: 10, display: 'flex', alignItems: 'center',
              }}>
                {/* Info */}
                <div style={{ flex: 1, padding: '0 14px' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{bet.title}</span>
                  <span style={{ fontSize: 11, color: '#334155', display: 'block', marginTop: 2 }}>
                    {new Date(bet.date).toLocaleDateString('en-GB')} · {bet.legs.length} leg{bet.legs.length !== 1 ? 's' : ''} · @{bet.totalOdds} · £{bet.stake}
                  </span>
                </div>

                {/* Result */}
                <div style={{ padding: '0 14px', flexShrink: 0 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5,
                    background: `${RESULT_COLORS[bet.result]}15`,
                    color: RESULT_COLORS[bet.result],
                    border: `1px solid ${RESULT_COLORS[bet.result]}30`,
                  }}>
                    {bet.result.toUpperCase()}
                  </span>
                </div>

                {/* Divider */}
                <div style={{ width: 1, alignSelf: 'stretch', background: '#1e1e3e', flexShrink: 0 }} />

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, padding: '0 14px', flexShrink: 0 }}>
                  <button onClick={() => handleEdit(bet)} style={{
                    background: 'transparent', border: '1px solid #2a2a52', borderRadius: 6,
                    color: '#a78bfa', fontSize: 11, padding: '4px 10px', cursor: 'pointer',
                  }}>Edit</button>
                  <button onClick={() => confirmDelete(bet.id)} style={{
                    background: 'transparent', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 6,
                    color: '#ef4444', fontSize: 11, padding: '4px 10px', cursor: 'pointer',
                  }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
