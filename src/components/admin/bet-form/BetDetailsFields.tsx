'use client';

// The core "Bet Details" section: date/time, type/title, bookmaker/tags, odds/stake/result, boosted odds.
import { Dispatch, SetStateAction } from 'react';
import { BetForm, computeBaseOddsFromLegs, computeBoostedOddsFromLegs, computeWinReturns } from '@/lib/betForm';
import { BetResult, BetType } from '@/lib/types';
import { BET_TYPES, STAKE_PRESETS, autoTitle } from '@/lib/betFormOptions';
import { CURRENCY_SYMBOL } from '@/lib/config';
import { FIELD, INPUT, LABEL, RESULT_COLORS, SECTION, SECTION_TITLE, SELECT } from '../adminPanelStyles';
import NumberKeypadInput from './NumberKeypadInput';
import PresetChips from './PresetChips';
import StakeSizer from '../StakeSizer';

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

interface FieldsProps {
  form: BetForm;
  setForm: Dispatch<SetStateAction<BetForm>>;
}

function DateTimeRow({ form, setForm }: FieldsProps) {
  const [datePart, timePart = '00:00'] = form.date.split('T');
  const [hour, minute] = timePart.split(':');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
      <div>
        <label style={LABEL}>Date</label>
        <input type="date" value={datePart}
          onChange={(event) => setForm((currentForm) => ({ ...currentForm, date: `${event.target.value}T${currentForm.date.split('T')[1] ?? '00:00'}` }))}
          style={INPUT} required />
      </div>
      <div>
        <label style={LABEL}>Time</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <select value={hour} onChange={(event) => setForm((currentForm) => ({ ...currentForm, date: `${currentForm.date.split('T')[0]}T${event.target.value}:${minute}` }))} style={SELECT}>
            {HOURS.map((hourOption) => <option key={hourOption} value={hourOption}>{hourOption}</option>)}
          </select>
          <select value={minute} onChange={(event) => setForm((currentForm) => ({ ...currentForm, date: `${currentForm.date.split('T')[0]}T${hour}:${event.target.value}` }))} style={SELECT}>
            {MINUTES.map((minuteOption) => <option key={minuteOption} value={minuteOption}>{minuteOption}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

function OddsStakeResultRow({ form, setForm }: FieldsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 4 }}>
      <div>
        {/* Label: "Total Odds" normally; "Base Odds" when boosted */}
        <label style={LABEL}>{form.isBoosted ? 'Base Odds' : 'Total Odds'}</label>
        <div style={{ position: 'relative' }}>
          {form.oddsAutoCalc ? (
            <input readOnly value={form.odds} style={{ ...INPUT, fontFamily: 'var(--font-mono)', paddingRight: 58, opacity: 0.85 }} />
          ) : (
            <NumberKeypadInput value={form.odds} onChange={(odds) => setForm((currentForm) => ({
              ...currentForm, odds, legs: currentForm.legs.map((leg) => leg.oddsTouched ? leg : { ...leg, odds }),
            }))} style={{ paddingRight: 58 }} />
          )}
          <label style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--accent)',
            cursor: 'pointer', userSelect: 'none',
          }}>
            <input
              type="checkbox"
              checked={form.oddsAutoCalc}
              onChange={(event) => {
                const autoCalcOn = event.target.checked;

                setForm((currentForm) => ({ ...currentForm, oddsAutoCalc: autoCalcOn, odds: autoCalcOn ? computeBaseOddsFromLegs(currentForm.legs) : currentForm.odds }));
              }}
            />
            Auto
          </label>
        </div>
      </div>
      <div>
        <label style={LABEL}>Stake ({CURRENCY_SYMBOL})</label>
        <NumberKeypadInput value={form.stake} onChange={(stake) => setForm((currentForm) => ({ ...currentForm, stake }))} />
        <PresetChips values={STAKE_PRESETS} prefix={CURRENCY_SYMBOL} onPick={(stake) => setForm((currentForm) => ({ ...currentForm, stake }))} />
      </div>
      <div>
        <label style={LABEL}>Result</label>
        <select value={form.result}
          onChange={(event) => setForm((currentForm) => ({ ...currentForm, result: event.target.value as BetResult }))}
          style={{ ...SELECT, color: RESULT_COLORS[form.result] }}>
          <option value="pending">Pending</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
          <option value="void">Void</option>
        </select>
      </div>
    </div>
  );
}

function ReturnsField({ form, setForm }: FieldsProps) {
  if (form.result !== 'won') {
    return null;
  }

  return (
    <div style={FIELD}>
      <label style={LABEL}>Returns ({CURRENCY_SYMBOL})</label>
      {form.cashedOut ? (
        <NumberKeypadInput value={form.returns} placeholder="e.g. 59.86"
          onChange={(returns) => setForm((currentForm) => ({ ...currentForm, returns }))} />
      ) : (
        <input readOnly value={computeWinReturns(form).toFixed(2)} style={{ ...INPUT, fontFamily: 'var(--font-mono)', opacity: 0.85 }} />
      )}
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}>
        <input
          type="checkbox"
          checked={form.cashedOut}
          onChange={(event) => {
            const cashedOut = event.target.checked;

            setForm((currentForm) => ({ ...currentForm, cashedOut, returns: cashedOut ? currentForm.returns : '' }));
          }}
        />
        Cashed out early
      </label>
    </div>
  );
}

function BoostedOddsRow({ form, setForm }: FieldsProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)' }}>
        <input type="checkbox" checked={form.isBoosted}
          onChange={(event) => setForm((currentForm) => ({ ...currentForm, isBoosted: event.target.checked, boostedOdds: '' }))} />
        Boosted odds
      </label>
      {form.isBoosted && (
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={LABEL}>Boosted Odds</label>
          <div style={{ position: 'relative' }}>
            {form.boostedOddsAutoCalc ? (
              <input readOnly value={form.boostedOdds} style={{ ...INPUT, fontFamily: 'var(--font-mono)', paddingRight: 58, opacity: 0.85 }} />
            ) : (
              <NumberKeypadInput value={form.boostedOdds} onChange={(boostedOdds) => setForm((currentForm) => ({ ...currentForm, boostedOdds }))}
                placeholder="e.g. 5.50" style={{ paddingRight: 58 }} />
            )}
            <label style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--accent)',
              cursor: 'pointer', userSelect: 'none',
            }}>
              <input
                type="checkbox"
                checked={form.boostedOddsAutoCalc}
                onChange={(event) => {
                  const autoCalcOn = event.target.checked;

                  setForm((currentForm) => ({ ...currentForm, boostedOddsAutoCalc: autoCalcOn, boostedOdds: autoCalcOn ? computeBoostedOddsFromLegs(currentForm.legs) : currentForm.boostedOdds }));
                }}
              />
              Auto
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

interface BetDetailsFieldsProps extends FieldsProps {
  titleAuto: boolean;
  setTitleAuto: Dispatch<SetStateAction<boolean>>;
  bookmakerAutoDetected: boolean;
  setBookmakerAutoDetected: Dispatch<SetStateAction<boolean>>;
  bookmakerOptions: string[];
  tagOptions: string[];
}

export default function BetDetailsFields({
  form, setForm, titleAuto, setTitleAuto, bookmakerAutoDetected, setBookmakerAutoDetected, bookmakerOptions, tagOptions,
}: BetDetailsFieldsProps) {
  return (
    <div style={SECTION}>
      <p style={SECTION_TITLE}>BET DETAILS</p>

      <DateTimeRow form={form} setForm={setForm} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <label style={LABEL}>Type</label>
          <select
            value={form.type}
            onChange={(event) => {
              const type = event.target.value as BetType;

              setForm((currentForm) => ({ ...currentForm, type, title: titleAuto ? autoTitle(type) : currentForm.title }));
            }}
            style={SELECT}
          >
            {BET_TYPES.map((betType) => <option key={betType.value} value={betType.value}>{betType.label}</option>)}
          </select>
        </div>
        <div>
          <label style={LABEL}>Title</label>
          <input
            value={form.title}
            onChange={(event) => {
              setTitleAuto(false);
              setForm((currentForm) => ({ ...currentForm, title: event.target.value }));
            }}
            placeholder="e.g. 4 Fold Acca" style={INPUT} required
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <label style={LABEL}>Bookmaker</label>
          <input
            value={form.bookmaker}
            onChange={(event) => {
              setBookmakerAutoDetected(false);
              setForm((currentForm) => ({ ...currentForm, bookmaker: event.target.value }));
            }}
            placeholder="e.g. Bet365" style={INPUT} list="bookmaker-options"
          />
          <datalist id="bookmaker-options">
            {bookmakerOptions.map((bookmaker) => <option key={bookmaker} value={bookmaker} />)}
          </datalist>
          {bookmakerAutoDetected && form.bookmaker && (
            <p style={{ fontSize: 10.5, color: 'var(--accent)', marginTop: 4 }}>Detected from screenshot — check it&apos;s correct.</p>
          )}
        </div>
        <div>
          <label style={LABEL}>Tags</label>
          <input value={form.tags} onChange={(event) => setForm((currentForm) => ({ ...currentForm, tags: event.target.value }))}
            placeholder="comma separated, e.g. value, in-play" style={INPUT} list="tag-options" />
          <datalist id="tag-options">
            {tagOptions.map((tag) => <option key={tag} value={tag} />)}
          </datalist>
        </div>
      </div>

      <OddsStakeResultRow form={form} setForm={setForm} />
      <StakeSizer odds={form.odds} onApply={(stake) => setForm((currentForm) => ({ ...currentForm, stake }))} />
      <ReturnsField form={form} setForm={setForm} />
      <BoostedOddsRow form={form} setForm={setForm} />
    </div>
  );
}
