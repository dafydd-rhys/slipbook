'use client';

// "Legs" section — header actions (save as template / add leg) plus one LegEditor per leg.
import { LegForm } from '@/lib/betForm';
import { SECTION, SECTION_TITLE } from '../adminPanelStyles';
import LegEditor from './LegEditor';

interface LegsSectionProps {
  legs: LegForm[];
  formOdds: string;
  savingTemplate: boolean;
  onSaveTemplate: () => void;
  onAddLeg: () => void;
  onUpdateLeg: <K extends keyof LegForm>(index: number, field: K, value: LegForm[K]) => void;
  onUpdateLegOdds: (index: number, patch: Partial<LegForm>) => void;
  onRemoveLeg: (index: number) => void;
}

export default function LegsSection({
  legs, formOdds, savingTemplate, onSaveTemplate, onAddLeg, onUpdateLeg, onUpdateLegOdds, onRemoveLeg,
}: LegsSectionProps) {
  return (
    <div style={SECTION}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ ...SECTION_TITLE, margin: 0 }}>LEGS ({legs.length})</p>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={onSaveTemplate} disabled={savingTemplate} style={{
            background: 'transparent', border: '1px solid var(--border)', borderRadius: 6,
            color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12, padding: '4px 10px',
            cursor: savingTemplate ? 'not-allowed' : 'pointer', opacity: savingTemplate ? 0.6 : 1,
          }}>
            ☆ Save as Template
          </button>
          <button type="button" onClick={onAddLeg} style={{
            background: 'transparent', border: '1px solid var(--border)', borderRadius: 6,
            color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 12, padding: '4px 10px', cursor: 'pointer',
          }}>
            + Leg
          </button>
        </div>
      </div>

      {legs.map((leg, index) => (
        <LegEditor
          key={index}
          leg={leg}
          index={index}
          formOdds={formOdds}
          canRemove={legs.length > 1}
          onUpdate={(field, value) => onUpdateLeg(index, field, value)}
          onUpdateOdds={(patch) => onUpdateLegOdds(index, patch)}
          onRemove={() => onRemoveLeg(index)}
        />
      ))}
    </div>
  );
}
