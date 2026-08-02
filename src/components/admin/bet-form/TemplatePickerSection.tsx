'use client';

// "Start from a template" — only rendered when saved templates exist and no edit is in progress.
import { BetTemplate } from '@/lib/types';
import { SECTION, SECTION_TITLE, SELECT } from '../adminPanelStyles';

interface TemplatePickerSectionProps {
  templates: BetTemplate[];
  templatePick: string;
  onPick: (id: string) => void;
  onDeletePicked: () => void;
}

export default function TemplatePickerSection({ templates, templatePick, onPick, onDeletePicked }: TemplatePickerSectionProps) {
  return (
    <div style={SECTION}>
      <p style={SECTION_TITLE}>START FROM A TEMPLATE</p>
      <select value={templatePick} onChange={(event) => onPick(event.target.value)} style={SELECT}>
        <option value="">Select a saved template…</option>
        {templates.map((template) => <option key={template.id} value={template.id}>{template.name} ({template.legs.length} leg{template.legs.length !== 1 ? 's' : ''})</option>)}
      </select>
      {templatePick && (
        <button type="button" onClick={onDeletePicked} style={{
          marginTop: 8, background: 'transparent', border: '1px solid color-mix(in srgb, var(--lost) 30%, transparent)',
          borderRadius: 6, color: 'var(--lost)', fontSize: 11, padding: '4px 10px', cursor: 'pointer',
        }}>
          Delete selected template
        </button>
      )}
    </div>
  );
}
