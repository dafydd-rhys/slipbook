'use client';

// "Add Bet" import panel — screenshot drop-zone or plain-English description,
// both of which hand off to the AI parse endpoints and prefill the form.
import { useEffect } from 'react';
import AiGate from '../AiGate';
import { INPUT, SECTION, SECTION_TITLE } from '../adminPanelStyles';
import Spinner from '@/components/Spinner';
import { SCREENSHOT_COST_ESTIMATE, TEXT_PARSE_COST_ESTIMATE } from '@/lib/aiCostEstimates';

interface ImportSlipSectionProps {
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
}

export default function ImportSlipSection(props: ImportSlipSectionProps) {
  const {
    aiEnabled, importMode, onImportModeChange, nlText, onNlTextChange, parsingText, onParseText,
    parseError, dragOver, onDragOverChange, parsingSlip, batchProgress, onSlipFiles,
  } = props;

  // Lets a screenshot be pasted (Ctrl/Cmd+V) anywhere on the page while this
  // mode is active. Only intercepts the paste when the clipboard actually
  // holds an image — pasting text elsewhere on the form is left untouched.
  useEffect(() => {
    if (importMode !== 'screenshot' || parsingSlip) {
      return;
    }

    function handlePaste(event: ClipboardEvent) {
      const items = event.clipboardData?.items;

      if (!items) {
        return;
      }

      const imageFiles = Array.from(items)
        .filter((item) => item.type.startsWith('image/'))
        .map((item) => item.getAsFile())
        .filter((file): file is File => file !== null);

      if (imageFiles.length === 0) {
        return;
      }

      event.preventDefault();
      onSlipFiles(imageFiles);
    }

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [importMode, parsingSlip, onSlipFiles]);

  return (
    <AiGate enabled={aiEnabled} anchor="import">
      <div style={SECTION}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ ...SECTION_TITLE, margin: 0 }}>IMPORT</p>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['screenshot', 'text'] as const).map((mode) => (
              <button key={mode} type="button" onClick={() => onImportModeChange(mode)} style={{
                background: importMode === mode ? 'var(--accent-soft)' : 'transparent',
                border: `1px solid ${importMode === mode ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 14, color: importMode === mode ? 'var(--accent)' : 'var(--text-faint)',
                fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, padding: '4px 10px', cursor: 'pointer',
              }}>
                {mode === 'screenshot' ? 'Screenshot' : 'Describe it'}
              </button>
            ))}
          </div>
        </div>

        {importMode === 'text' ? (
          <div>
            <textarea
              value={nlText}
              onChange={(event) => onNlTextChange(event.target.value)}
              placeholder="e.g. £10 acca, Arsenal to win vs Chelsea at 1.80 and Man City over 2.5 goals at 1.65, placed today"
              rows={3}
              disabled={parsingText}
              style={{ ...INPUT, resize: 'vertical' as const, marginBottom: 8 }}
            />
            <button
              type="button"
              onClick={onParseText}
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
                <Spinner
                  size={13}
                  style={{ border: '2px solid color-mix(in srgb, var(--accent-contrast) 40%, transparent)', borderTopColor: 'var(--accent-contrast)' }}
                />
              )}
              {parsingText ? 'Reading…' : 'Parse Description'}
            </button>
            <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8 }}>~{TEXT_PARSE_COST_ESTIMATE} in AI usage per description.</p>
            {parseError && <p style={{ fontSize: 12, color: 'var(--lost)', marginTop: 8 }}>{parseError}</p>}
          </div>
        ) : (
          <>
            <label
              onDragOver={(event) => {
                event.preventDefault();

                if (!parsingSlip) {
                  onDragOverChange(true);
                }
              }}
              onDragLeave={() => onDragOverChange(false)}
              onDrop={(event) => {
                event.preventDefault();
                onDragOverChange(false);

                if (parsingSlip) {
                  return;
                }

                if (event.dataTransfer.files?.length) {
                  onSlipFiles(event.dataTransfer.files);
                }
              }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 8, textAlign: 'center', cursor: 'pointer',
                border: `1.5px dashed ${(dragOver || parsingSlip) ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 10,
                padding: '24px 18px', background: (dragOver || parsingSlip) ? 'var(--accent-soft)' : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              <input
                type="file" accept="image/*" multiple style={{ display: 'none' }} disabled={parsingSlip}
                onChange={(event) => {
                  if (event.target.files?.length) {
                    onSlipFiles(event.target.files);
                  }

                  event.target.value = '';
                }}
              />

              {parsingSlip ? (
                <Spinner size={32} style={{ display: 'block' }} />
              ) : (
                <span aria-hidden style={{ width: 36, height: 24, border: '2px solid var(--accent)', borderRadius: 5, position: 'relative', display: 'block' }}>
                  <span style={{ position: 'absolute', left: 4, right: 4, top: '50%', height: 1.5, background: 'var(--accent)', opacity: 0.6 }} />
                </span>
              )}

              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }} aria-live="polite">
                {parsingSlip
                  ? (batchProgress.total > 1 ? `Reading screenshot ${batchProgress.done + 1} of ${batchProgress.total}…` : 'Reading screenshot…')
                  : 'Drop, paste, or click to choose one or more betslip screenshots'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-faint)', maxWidth: 320 }}>
                {parsingSlip
                  ? 'Extracting selections, odds, sport and result — this can take a few seconds per slip'
                  : `Fills in date, selections, market, matchup, odds, sport, result and stake — review before adding. Ctrl/Cmd+V works too. ~${SCREENSHOT_COST_ESTIMATE} per screenshot in AI usage.`}
              </span>

              {parsingSlip && (
                <span style={{ width: '100%', maxWidth: 200, height: 3, borderRadius: 2, background: 'var(--border)', overflow: 'hidden', marginTop: 2, position: 'relative' }}>
                  <span className="scan-sweep" style={{
                    position: 'absolute', top: 0, bottom: 0, width: '40%',
                    background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
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
  );
}
