'use client';

// Result-entry fields, shaped differently per sport (score, sets, finish position, etc.)
// Falls back to free text either when the sport has no structured shape (cricket, other)
// or when "Use text instead" is ticked.
import { SportOutcome, SportType } from '@/lib/types';
import { FIELD, INPUT, LABEL, SELECT } from '../adminPanelStyles';
import ScoreStepper from './ScoreStepper';

const FINISH_POSITIONS = ['1st', '2nd', '3rd', '4th', '5th', '6th+', 'NR', 'Fell', 'PU'];

// Which match-status options make sense for a given sport (e.g. no penalties in esports).
function statusesForSport(sport: SportType): string[] {
  if (sport === 'basketball') {
    return ['FT', 'OT', '2OT'];
  }

  if (sport === 'esports') {
    return ['FT', 'GG'];
  }

  if (sport === 'rugby') {
    return ['FT', 'AET'];
  }

  return ['FT', 'AET', 'Pens'];
}

// "Use text instead" checkbox shown above every sport's structured outcome fields.
function UseTextToggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      Use text instead
    </label>
  );
}

export default function OutcomeFields({ sport, outcome, onChange }: {
  sport: SportType; outcome: SportOutcome; onChange: (outcome: SportOutcome) => void;
}) {
  const set = (key: keyof SportOutcome, value: string | number | boolean) => onChange({ ...outcome, [key]: value });
  const textToggle = <UseTextToggle checked={!!outcome.useText} onChange={(checked) => set('useText', checked)} />;

  if (outcome.useText) {
    return (
      <div style={FIELD}>
        {textToggle}
        <label style={LABEL}>Result</label>
        <input value={outcome.resultText ?? ''} onChange={(event) => set('resultText', event.target.value)}
          placeholder="e.g. Away Won" style={INPUT} />
      </div>
    );
  }

  if (sport === 'tennis' || sport === 'darts') {
    return (
      <div style={FIELD}>
        {textToggle}
        <label style={LABEL}>{sport === 'tennis' ? 'Sets Score' : 'Sets/Legs Score'}</label>
        <input value={outcome.sets ?? ''} onChange={(event) => set('sets', event.target.value)}
          placeholder={sport === 'tennis' ? 'e.g. 6-4, 7-5, 3-6, 6-2' : 'e.g. 3-1 (sets)'} style={INPUT} />
      </div>
    );
  }

  if (sport === 'horse_racing') {
    return (
      <div style={FIELD}>
        {textToggle}
        <label style={LABEL}>Finish Position</label>
        <select value={outcome.finishPosition ?? ''} onChange={(event) => set('finishPosition', event.target.value)} style={SELECT}>
          <option value="">Select…</option>
          {FINISH_POSITIONS.map((position) => <option key={position} value={position}>{position}</option>)}
        </select>
      </div>
    );
  }

  if (sport === 'golf') {
    return (
      <div style={FIELD}>
        {textToggle}
        <label style={LABEL}>Score to Par</label>
        <input value={outcome.scoreToPar ?? ''} onChange={(event) => set('scoreToPar', event.target.value)}
          placeholder="e.g. -12 or +3" style={INPUT} />
      </div>
    );
  }

  if (sport === 'cricket') {
    return (
      <div style={FIELD}>
        <label style={LABEL}>Result</label>
        <input value={outcome.resultText ?? ''} onChange={(event) => set('resultText', event.target.value)}
          placeholder="e.g. Won by 8 wickets" style={INPUT} />
      </div>
    );
  }

  const statuses = statusesForSport(sport);

  return (
    <div>
      {textToggle}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <ScoreStepper label="Home Score" value={outcome.homeScore} onChange={(value) => set('homeScore', value)} />
        <ScoreStepper label="Away Score" value={outcome.awayScore} onChange={(value) => set('awayScore', value)} />
        <div>
          <label style={LABEL}>Status</label>
          <select value={outcome.matchStatus ?? 'FT'} onChange={(event) => set('matchStatus', event.target.value)} style={SELECT}>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>
      </div>
      {outcome.matchStatus === 'Pens' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
          <ScoreStepper label="Pens (Home)" value={outcome.penaltyHomeScore} onChange={(value) => set('penaltyHomeScore', value)} />
          <ScoreStepper label="Pens (Away)" value={outcome.penaltyAwayScore} onChange={(value) => set('penaltyAwayScore', value)} />
        </div>
      )}
    </div>
  );
}
