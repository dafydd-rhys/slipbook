'use client';

// The "Add / Edit Bet" tab body — composes import, template picker, the core
// detail fields, the leg list, notes, and the submit row.
import { Dispatch, SetStateAction } from 'react';
import { BetTemplate } from '@/lib/types';
import { BetForm, LegForm } from '@/lib/betForm';
import { INPUT, SECTION, SECTION_TITLE } from '../adminPanelStyles';
import ImportSlipSection from './ImportSlipSection';
import TemplatePickerSection from './TemplatePickerSection';
import BetDetailsFields from './BetDetailsFields';
import LegsSection from './LegsSection';

interface BetFormPanelProps {
  editingId: string | null;
  aiEnabled: boolean | null;
  importMode: 'screenshot' | 'text';
  onImportModeChange: (mode: 'screenshot' | 'text') => void;
  nlText: string;
  onNlTextChange: (value: string) => void;
  parsingText: boolean;
  onParseText: () => void;
  parseError: string;
  dragOver: boolean;
  onDragOverChange: (dragOver: boolean) => void;
  parsingSlip: boolean;
  batchProgress: { done: number; total: number };
  onSlipFiles: (files: FileList | File[]) => void;
  templates: BetTemplate[];
  templatePick: string;
  onTemplatePick: (id: string) => void;
  onDeletePickedTemplate: () => void;
  form: BetForm;
  setForm: Dispatch<SetStateAction<BetForm>>;
  titleAuto: boolean;
  setTitleAuto: Dispatch<SetStateAction<boolean>>;
  bookmakerOptions: string[];
  tagOptions: string[];
  savingTemplate: boolean;
  onSaveTemplate: () => void;
  onAddLeg: () => void;
  onUpdateLeg: <K extends keyof LegForm>(index: number, field: K, value: LegForm[K]) => void;
  onUpdateLegOdds: (index: number, patch: Partial<LegForm>) => void;
  onRemoveLeg: (index: number) => void;
  saving: boolean;
  onSubmit: (event: React.FormEvent) => void;
  onCancelEdit: () => void;
}

export default function BetFormPanel(props: BetFormPanelProps) {
  const { editingId, form, setForm } = props;

  return (
    <form onSubmit={props.onSubmit}>
      {!editingId && (
        <ImportSlipSection
          aiEnabled={props.aiEnabled}
          importMode={props.importMode}
          onImportModeChange={props.onImportModeChange}
          nlText={props.nlText}
          onNlTextChange={props.onNlTextChange}
          parsingText={props.parsingText}
          onParseText={props.onParseText}
          parseError={props.parseError}
          dragOver={props.dragOver}
          onDragOverChange={props.onDragOverChange}
          parsingSlip={props.parsingSlip}
          batchProgress={props.batchProgress}
          onSlipFiles={props.onSlipFiles}
        />
      )}

      {!editingId && props.templates.length > 0 && (
        <TemplatePickerSection
          templates={props.templates}
          templatePick={props.templatePick}
          onPick={props.onTemplatePick}
          onDeletePicked={props.onDeletePickedTemplate}
        />
      )}

      <BetDetailsFields
        form={form}
        setForm={setForm}
        titleAuto={props.titleAuto}
        setTitleAuto={props.setTitleAuto}
        bookmakerOptions={props.bookmakerOptions}
        tagOptions={props.tagOptions}
      />

      <LegsSection
        legs={form.legs}
        formOdds={form.odds}
        savingTemplate={props.savingTemplate}
        onSaveTemplate={props.onSaveTemplate}
        onAddLeg={props.onAddLeg}
        onUpdateLeg={props.onUpdateLeg}
        onUpdateLegOdds={props.onUpdateLegOdds}
        onRemoveLeg={props.onRemoveLeg}
      />

      <div style={SECTION}>
        <p style={SECTION_TITLE}>NOTES (OPTIONAL)</p>
        <textarea value={form.notes} onChange={(event) => setForm((currentForm) => ({ ...currentForm, notes: event.target.value }))}
          placeholder="Any notes about this bet…" rows={2}
          style={{ ...INPUT, resize: 'vertical' as const }} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={props.saving} style={{
          flex: 1, background: 'var(--accent)', border: 'none', borderRadius: 10,
          color: 'var(--accent-contrast)', fontSize: 14, fontWeight: 700, padding: 12,
          cursor: props.saving ? 'not-allowed' : 'pointer', opacity: props.saving ? 0.6 : 1,
        }}>
          {editingId ? 'Update Bet' : 'Preview & Add'}
        </button>
        {editingId && (
          <button type="button" onClick={props.onCancelEdit} style={{
            background: 'transparent', border: '1px solid var(--border)', borderRadius: 10,
            color: 'var(--text-muted)', fontSize: 14, padding: '12px 16px', cursor: 'pointer',
          }}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
