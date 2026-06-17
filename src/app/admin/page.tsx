'use client';

import { useEffect, useState } from 'react';
import BetCard from '@/components/BetCard';
import { Bet, BetLeg, BetResult, BetSubLeg, BetType, SportOutcome, SportType } from '@/lib/types';

const ADMIN_KEY = 'saucyslips';
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
  { value: 'single',      label: 'Single' },
  { value: 'double',      label: 'Double' },
  { value: 'treble',      label: 'Treble' },
  { value: 'acca',        label: 'Accumulator' },
  { value: 'bet_builder', label: 'Bet Builder' },
  { value: 'each_way',    label: 'Each Way' },
  { value: 'outright',    label: 'Outright' },
  { value: 'system',      label: 'System Bet' },
  { value: 'lucky15',     label: 'Lucky 15' },
  { value: 'lucky31',     label: 'Lucky 31' },
  { value: 'lucky63',     label: 'Lucky 63' },
];

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
  { value: 'other',        emoji: '🎯', label: 'Other' },
];

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
  const set = (key: keyof SportOutcome, val: string | number) => onChange({ ...outcome, [key]: val });

  if (sport === 'tennis') return (
    <div style={FIELD}>
      <label style={LABEL}>Sets Score</label>
      <input value={outcome.sets ?? ''} onChange={e => set('sets', e.target.value)}
        placeholder="e.g. 6-4, 7-5, 3-6, 6-2" style={INPUT} />
    </div>
  );
  if (sport === 'horse_racing') return (
    <div style={FIELD}>
      <label style={LABEL}>Finish Position</label>
      <select value={outcome.finishPosition ?? ''} onChange={e => set('finishPosition', e.target.value)} style={SELECT}>
        <option value="">Select…</option>
        {['1st','2nd','3rd','4th','5th','6th+','NR','Fell','PU'].map(p => <option key={p} value={p}>{p}</option>)}
      </select>
    </div>
  );
  if (sport === 'golf') return (
    <div style={FIELD}>
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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
      <div>
        <label style={LABEL}>Home Score</label>
        <input type="number" min="0" value={outcome.homeScore ?? ''} onChange={e => set('homeScore', parseInt(e.target.value))} style={INPUT} />
      </div>
      <div>
        <label style={LABEL}>Away Score</label>
        <input type="number" min="0" value={outcome.awayScore ?? ''} onChange={e => set('awayScore', parseInt(e.target.value))} style={INPUT} />
      </div>
      <div>
        <label style={LABEL}>Status</label>
        <select value={outcome.matchStatus ?? 'FT'} onChange={e => set('matchStatus', e.target.value)} style={SELECT}>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
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
        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
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
      ))}
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
type LegForm = {
  selection: string; market: string; matchup: string;
  odds: string;          // base odds (always shown)
  boostedOdds: string;   // effective boosted odds (shown when isBoosted)
  isBoosted: boolean;
  result: BetResult; sport: SportType;
  isBetBuilder: boolean; subLegs: Omit<BetSubLeg, 'id'>[];
  outcomeDecided: boolean; outcome: SportOutcome;
};

type BetForm = {
  date: string; title: string; type: BetType;
  odds: string;          // base odds (always shown) — "Total Odds" / "Base Odds"
  boostedOdds: string;   // effective boosted odds (shown when isBoosted) — "Boosted Odds"
  isBoosted: boolean;
  stake: string; result: BetResult; returns: string; notes: string;
  legs: LegForm[];
};

function emptyLeg(): LegForm {
  return {
    selection: '', market: '', matchup: '', odds: '1.50', boostedOdds: '',
    isBoosted: false, result: 'pending', sport: 'football',
    isBetBuilder: false, subLegs: [], outcomeDecided: false, outcome: {},
  };
}

function emptyForm(): BetForm {
  return {
    date: new Date().toISOString().slice(0, 16),
    title: '', type: 'acca',
    odds: '2.00', boostedOdds: '', isBoosted: false,
    stake: '10', result: 'pending', returns: '', notes: '',
    legs: [emptyLeg()],
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
      const effectiveOdds = l.isBoosted && l.boostedOdds
        ? parseFloat(l.boostedOdds) : parseFloat(l.odds) || 1;
      const baseOdds = l.isBoosted && l.odds ? parseFloat(l.odds) : undefined;
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
  const [pw, setPw]               = useState('');
  const [pwError, setPwError]     = useState('');
  const [bets, setBets]           = useState<Bet[]>([]);
  const [form, setForm]           = useState<BetForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [tab, setTab]             = useState<'add' | 'manage'>('add');
  const [msg, setMsg]             = useState('');

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

  function handlePwSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw === ADMIN_KEY) { sessionStorage.setItem('admin', btoa(ADMIN_KEY)); setAuthed(true); }
    else setPwError('Wrong password');
  }

  function updateLeg<K extends keyof LegForm>(i: number, field: K, val: LegForm[K]) {
    const legs = [...form.legs];
    legs[i] = { ...legs[i], [field]: val };
    setForm(f => ({ ...f, legs }));
  }
  function addLeg()         { setForm(f => ({ ...f, legs: [...f.legs, emptyLeg()] })); }
  function removeLeg(i: number) { setForm(f => ({ ...f, legs: f.legs.filter((_, j) => j !== i) })); }

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
      setForm(emptyForm()); setEditingId(null);
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
    setForm({
      date:        new Date(bet.date).toISOString().slice(0, 16),
      title:       bet.title,
      type:        bet.type,
      // If boosted: base goes into odds, boosted goes into boostedOdds
      odds:        bet.baseTotalOdds ? String(bet.baseTotalOdds) : String(bet.totalOdds),
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
      onConfirm: () => { setConfirm(null); setEditingId(null); setForm(emptyForm()); },
    });
  }

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (!authed) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#16162e', border: '1px solid #2a2a52', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 320 }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Admin Panel</h1>
        <p style={{ fontSize: 12, color: '#475569', marginBottom: 20 }}>Enter password to manage bets</p>
        <form onSubmit={handlePwSubmit}>
          <input type="password" value={pw} onChange={e => { setPw(e.target.value); setPwError(''); }}
            placeholder="Password" autoFocus
            style={{ ...INPUT, marginBottom: 8, border: `1px solid ${pwError ? '#ef4444' : '#2a2a52'}` }} />
          {pwError && <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 8 }}>{pwError}</p>}
          <button type="submit" style={{ width: '100%', background: '#7c3aed', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, padding: 10, cursor: 'pointer', marginTop: 4 }}>
            Enter
          </button>
        </form>
      </div>
    </div>
  );

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
                  <label style={LABEL}>Date & Time</label>
                  <input type="datetime-local" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={INPUT} required />
                </div>
                <div>
                  <label style={LABEL}>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as BetType }))} style={SELECT}>
                    {BET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div style={FIELD}>
                <label style={LABEL}>Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. 4 Fold Acca" style={INPUT} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  {/* Label: "Total Odds" normally; "Base Odds" when boosted */}
                  <label style={LABEL}>{form.isBoosted ? 'Base Odds' : 'Total Odds'}</label>
                  <input type="number" step="0.01" min="1" inputMode="decimal" value={form.odds}
                    onChange={e => setForm(f => ({ ...f, odds: e.target.value }))} style={INPUT} required />
                </div>
                <div>
                  <label style={LABEL}>Stake (£)</label>
                  <input type="number" step="0.01" min="0" inputMode="decimal" value={form.stake}
                    onChange={e => setForm(f => ({ ...f, stake: e.target.value }))} style={INPUT} required />
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
                    <input type="number" step="0.01" min="1" inputMode="decimal" value={form.boostedOdds}
                      onChange={e => setForm(f => ({ ...f, boostedOdds: e.target.value }))}
                      placeholder="e.g. 5.50" style={INPUT} />
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
                      <select value={leg.sport} onChange={e => updateLeg(i, 'sport', e.target.value as SportType)} style={SELECT}>
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
                      {/* Label changes to "Base Odds" when boosted */}
                      <label style={LABEL}>{leg.isBoosted ? 'Base Odds' : 'Odds'}</label>
                      <input type="number" step="0.01" min="1" inputMode="decimal" value={leg.odds}
                        onChange={e => updateLeg(i, 'odds', e.target.value)} style={INPUT} required />
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
                        onChange={e => updateLeg(i, 'isBoosted', e.target.checked)} />
                      🚀 Boosted
                    </label>
                    {leg.isBoosted && (
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <label style={LABEL}>Boosted Odds</label>
                        <input type="number" step="0.01" min="1" inputMode="decimal" value={leg.boostedOdds}
                          onChange={e => updateLeg(i, 'boostedOdds', e.target.value)}
                          placeholder="e.g. 1.25" style={INPUT} />
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
