'use client';

// One leg's fields: sport/builder toggle, selection/market/matchup, odds/result,
// boosted odds, optional bet-builder sub-legs, and the optional outcome breakdown.
import { BetResult, SportType } from '@/lib/types';
import { LegForm } from '@/lib/betForm';
import { LAST_SPORT_KEY, SPORTS } from '@/lib/betFormOptions';
import { FIELD, INPUT, LABEL, RESULT_COLORS, SELECT } from '../adminPanelStyles';
import NumberKeypadInput from './NumberKeypadInput';
import MarketQuickPick from './MarketQuickPick';
import SubLegEditor from './SubLegEditor';
import OutcomeFields from './OutcomeFields';

interface LegEditorProps {
  leg: LegForm;
  index: number;
  formOdds: string;
  canRemove: boolean;
  onUpdate: <K extends keyof LegForm>(field: K, value: LegForm[K]) => void;
  onUpdateOdds: (patch: Partial<LegForm>) => void;
  onRemove: () => void;
}

export default function LegEditor({ leg, index, formOdds, canRemove, onUpdate, onUpdateOdds, onRemove }: LegEditorProps) {
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border-soft)', borderRadius: 10, padding: 12, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.06em' }}>LEG {index + 1}</span>
        {canRemove && (
          <button type="button" onClick={onRemove} style={{
            background: 'transparent', border: 'none', color: 'var(--lost)', opacity: 0.7, fontSize: 12, cursor: 'pointer', padding: 0,
          }}>✕ Remove</button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 10, alignItems: 'end' }}>
        <div>
          <label style={LABEL}>Sport</label>
          <select
            value={leg.sport}
            onChange={(event) => {
              const sport = event.target.value as SportType;

              onUpdate('sport', sport);

              if (typeof window !== 'undefined') {
                localStorage.setItem(LAST_SPORT_KEY, sport);
              }
            }}
            style={SELECT}
          >
            {SPORTS.map((sportOption) => <option key={sportOption.value} value={sportOption.value}>{sportOption.code} — {sportOption.label}</option>)}
          </select>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', paddingBottom: 9 }}>
          <input type="checkbox" checked={leg.isBetBuilder} onChange={(event) => onUpdate('isBetBuilder', event.target.checked)} />
          Builder
        </label>
      </div>

      <div style={FIELD}>
        <label style={LABEL}>{leg.isBetBuilder ? 'Builder Name' : 'Selection'}</label>
        <input value={leg.selection} onChange={(event) => onUpdate('selection', event.target.value)}
          placeholder={leg.isBetBuilder ? 'e.g. Arsenal Bet Builder' : 'e.g. Arsenal'} style={INPUT} required />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={LABEL}>Market</label>
          <MarketQuickPick onPick={(value) => onUpdate('market', value)} />
          <input value={leg.market} onChange={(event) => onUpdate('market', event.target.value)}
            placeholder="e.g. Match Result" style={INPUT} required />
        </div>
        <div>
          <label style={LABEL}>Matchup</label>
          <input value={leg.matchup} onChange={(event) => onUpdate('matchup', event.target.value)}
            placeholder="e.g. Arsenal vs Chelsea" style={INPUT} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          {/* Label changes to "Base Odds" when boosted. Optional — mirrors main odds until edited. */}
          <label style={LABEL}>{leg.isBoosted ? 'Base Odds' : 'Odds'}</label>
          <NumberKeypadInput value={leg.odds} placeholder={formOdds}
            onChange={(value) => onUpdateOdds({ odds: value, oddsTouched: true })} />
        </div>
        <div>
          <label style={LABEL}>Result</label>
          <select value={leg.result} onChange={(event) => onUpdate('result', event.target.value as BetResult)}
            style={{ ...SELECT, color: RESULT_COLORS[leg.result] }}>
            <option value="pending">Pending</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
            <option value="void">Void</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}>
          <input type="checkbox" checked={leg.isBoosted} onChange={(event) => onUpdateOdds({ isBoosted: event.target.checked })} />
          Boosted
        </label>
        {leg.isBoosted && (
          <div style={{ flex: 1, minWidth: 120 }}>
            <label style={LABEL}>Boosted Odds</label>
            <NumberKeypadInput value={leg.boostedOdds} placeholder="e.g. 1.25"
              onChange={(value) => onUpdateOdds({ boostedOdds: value })} />
          </div>
        )}
      </div>

      {leg.isBetBuilder && (
        <SubLegEditor subLegs={leg.subLegs} onChange={(subLegs) => onUpdate('subLegs', subLegs)} />
      )}

      <div style={{ borderTop: '1px solid var(--border-soft)', marginTop: 10, paddingTop: 10 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
          <input type="checkbox" checked={leg.outcomeDecided} onChange={(event) => onUpdate('outcomeDecided', event.target.checked)} />
          Outcome decided — enter result
        </label>
        {leg.outcomeDecided && (
          <div style={{ paddingLeft: 4 }}>
            <OutcomeFields sport={leg.sport} outcome={leg.outcome} onChange={(outcome) => onUpdate('outcome', outcome)} />
          </div>
        )}
      </div>
    </div>
  );
}
