'use client';

// Admin panel: PIN-gated bet entry/management plus bankroll, reports, data
// import/export and trash tabs. This file owns all the state and network
// calls; the actual form fields, lists and modals live in
// src/components/admin — this is the wiring between them.
import { useEffect, useState } from 'react';
import { Bet, BetResult, BetTemplate, BetType } from '@/lib/types';
import { uniqueBookmakers, uniqueTags } from '@/lib/filters';
import type { ParsedLeg } from '@/lib/slipParser';
import {
  BetForm, LegForm, buildBet, computeBaseOddsFromLegs, computeBetResult, computeBoostedOddsFromLegs,
  emptyForm, emptyLeg,
} from '@/lib/betForm';
import { autoTitle } from '@/lib/betFormOptions';

import AdminTabs, { AdminTab } from '@/components/admin/AdminTabs';
import PinLogin, { MAX_PIN_LEN } from '@/components/admin/PinLogin';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import BetPreviewModal from '@/components/admin/BetPreviewModal';
import BatchPreviewModal from '@/components/admin/BatchPreviewModal';
import SettleSuggestionModal, { SettleSuggestion } from '@/components/admin/SettleSuggestionModal';
import BetFormPanel from '@/components/admin/bet-form/BetFormPanel';
import BetManageList from '@/components/admin/bet-list/BetManageList';
import BankrollAdmin from '@/components/admin/BankrollAdmin';
import ReportsAdmin from '@/components/admin/ReportsAdmin';
import DataAdmin from '@/components/admin/DataAdmin';
import TrashAdmin from '@/components/admin/TrashAdmin';
import { useAiEnabled } from '@/hooks/useAiEnabled';

const CONTENT_WIDTH = 720;

type ParsedSlipResponse = { date: string; stake: number | null; legs: ParsedLeg[] };

type ConfirmState = {
  title: string; message: string; confirmLabel: string; confirmColor?: string;
  onConfirm: () => void;
} | null;

// Converts an AI-parsed slip response into form state, guessing the bet type from leg count.
function parsedSlipToForm(data: ParsedSlipResponse): BetForm {
  const legs: LegForm[] = data.legs.map((parsedLeg) => ({
    ...emptyLeg(),
    selection: parsedLeg.selection,
    market: parsedLeg.market,
    matchup: parsedLeg.matchup,
    odds: String(parsedLeg.odds),
    oddsTouched: true,
    sport: parsedLeg.sport,
    result: parsedLeg.result,
    isBetBuilder: parsedLeg.isBetBuilder,
    subLegs: parsedLeg.subLegs.map((subLeg) => ({ ...subLeg, result: parsedLeg.result })),
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
    result: computeBetResult(legs.map((leg) => leg.result)),
    stake: data.stake != null ? String(data.stake) : emptyForm().stake,
  };
}

// Uploads one betslip screenshot to the AI parser and returns its parsed shape.
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

  if (!res.ok) {
    throw new Error((data as unknown as { error?: string }).error || 'Failed to read screenshot');
  }

  return data;
}

export default function AdminPage() {
  const [authed, setAuthed]       = useState(false);
  const [pin, setPin]             = useState('');
  const [pinError, setPinError]   = useState(false);
  const [pinSubmitting, setPinSubmitting] = useState(false);
  const [bets, setBets]           = useState<Bet[]>([]);
  const [form, setForm]           = useState<BetForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [tab, setTab]             = useState<AdminTab>('add');
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
  const [settleResult, setSettleResult] = useState<SettleSuggestion | null>(null);
  const [settleError, setSettleError] = useState('');
  const [settleBusy, setSettleBusy] = useState(false);

  const aiEnabled = useAiEnabled();
  const bookmakerOptions = uniqueBookmakers(bets);
  const tagOptions = uniqueTags(bets);

  const [previewBet, setPreviewBet] = useState<Bet | null>(null);
  const [batchPreview, setBatchPreview] = useState<Bet[] | null>(null);
  const [batchErrors, setBatchErrors] = useState<string[]>([]);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });
  const [batchSaving, setBatchSaving] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  // Checks for an existing session cookie on first load.
  useEffect(() => {
    fetch('/api/admin/login').then((response) => response.json()).then((data) => {
      if (data.authed) {
        setAuthed(true);
      }
    });
  }, []);

  // Loads bets/templates as soon as a session is established.
  useEffect(() => {
    if (authed) {
      loadBets();
      loadTemplates();
    }
  }, [authed]);

  async function loadBets() {
    setBets(await fetch('/api/bets').then((response) => response.json()));
  }

  async function loadTemplates() {
    const res = await fetch('/api/templates');

    if (res.ok) {
      setTemplates(await res.json());
    }
  }

  // Fills the form from a parsed slip and opens the preview so it can be checked before saving.
  function applyParsedSlip(data: ParsedSlipResponse) {
    const newForm = parsedSlipToForm(data);

    setForm(newForm);
    setTitleAuto(true);
    setPreviewBet(buildBet(newForm));
  }

  // Handles one or more dropped/selected betslip screenshots — a single file
  // goes straight to the normal preview, multiple files open a batch preview
  // (parsing every one even if some fail, rather than stopping at the first error).
  async function handleSlipFiles(fileList: FileList | File[]) {
    if (parsingSlip) {
      return;
    }

    const files = Array.from(fileList).filter((file) => file.type.startsWith('image/'));

    if (files.length === 0) {
      setParseError('Please drop image files.');
      return;
    }

    setParseError('');

    if (files.length === 1) {
      setParsingSlip(true);

      try {
        applyParsedSlip(await parseSlipImage(files[0]));
      } catch (err) {
        setParseError(err instanceof Error ? err.message : 'Failed to read screenshot');
      } finally {
        setParsingSlip(false);
      }

      return;
    }

    setParsingSlip(true);
    setBatchProgress({ done: 0, total: files.length });

    const built: Bet[] = [];
    const errors: string[] = [];

    for (const [index, file] of files.entries()) {
      try {
        const data = await parseSlipImage(file);

        built.push(buildBet(parsedSlipToForm(data), `batch-${Date.now()}-${index}`));
      } catch (err) {
        errors.push(`${file.name}: ${err instanceof Error ? err.message : 'failed to read'}`);
      }

      setBatchProgress((progress) => ({ ...progress, done: progress.done + 1 }));
    }

    setParsingSlip(false);
    setBatchPreview(built);
    setBatchErrors(errors);
  }

  // Parses the "Describe it" free-text bet description.
  async function handleParseText() {
    if (parsingText || !nlText.trim()) {
      return;
    }

    setParseError('');
    setParsingText(true);

    try {
      const res = await fetch('/api/admin/parse-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: nlText }),
      });
      const data = await res.json() as ParsedSlipResponse;

      if (!res.ok) {
        throw new Error((data as unknown as { error?: string }).error || 'Failed to parse description');
      }

      applyParsedSlip(data);
      setNlText('');
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Failed to parse description');
    } finally {
      setParsingText(false);
    }
  }

  // Loads a saved template into the form, replacing whatever's currently there.
  function applyTemplate(id: string) {
    setTemplatePick(id);

    if (!id) {
      return;
    }

    const template = templates.find((candidate) => candidate.id === id);

    if (!template) {
      return;
    }

    const legs: LegForm[] = template.legs
      .map((templateLeg) => emptyLeg(templateLeg.sport, form.odds))
      .map((leg, index) => ({ ...leg, selection: template.legs[index].selection, market: template.legs[index].market, matchup: template.legs[index].matchup }));

    setForm((currentForm) => ({
      ...emptyForm(),
      type: template.type,
      title: titleAuto ? autoTitle(template.type) : currentForm.title,
      bookmaker: template.bookmaker ?? '',
      legs: legs.length ? legs : currentForm.legs,
    }));
  }

  // Saves the current form's shape (type, bookmaker, legs) as a reusable template.
  async function handleSaveTemplate() {
    const name = window.prompt('Template name?', form.title);

    if (!name) {
      return;
    }

    setSavingTemplate(true);

    try {
      const body = {
        name,
        type: form.type,
        bookmaker: form.bookmaker.trim() || undefined,
        legs: form.legs.map((leg) => ({ selection: leg.selection, market: leg.market, matchup: leg.matchup, sport: leg.sport })),
      };
      const res = await fetch('/api/templates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });

      if (res.ok) {
        await loadTemplates();
        setMsg('Template saved!');
        setTimeout(() => setMsg(''), 2500);
      }
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleDeleteTemplate(id: string) {
    await fetch(`/api/templates/${id}`, { method: 'DELETE' });
    await loadTemplates();
  }

  function handlePinDigit(digit: string) {
    if (pinError) {
      setPin('');
      setPinError(false);
      return;
    }

    if (pin.length >= MAX_PIN_LEN) {
      return;
    }

    setPin(pin + digit);
  }

  async function handlePinSubmit() {
    if (!pin || pinSubmitting) {
      return;
    }

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
      setTimeout(() => {
        setPin('');
        setPinError(false);
      }, 600);
    }
  }

  function handlePinBack() {
    if (pinError) {
      setPin('');
      setPinError(false);
      return;
    }

    setPin((currentPin) => currentPin.slice(0, -1));
  }

  // Recalculates Total/Boosted Odds live (when their Auto-calc is on) after any leg field change —
  // covers odds/boostedOdds/isBoosted edits, and marking a leg void (void legs are excluded).
  function updateLegOdds(index: number, patch: Partial<LegForm>) {
    setForm((currentForm) => {
      const legs = [...currentForm.legs];

      legs[index] = { ...legs[index], ...patch };

      return {
        ...currentForm, legs,
        odds: currentForm.oddsAutoCalc ? computeBaseOddsFromLegs(legs) : currentForm.odds,
        boostedOdds: currentForm.boostedOddsAutoCalc ? computeBoostedOddsFromLegs(legs) : currentForm.boostedOdds,
      };
    });
  }

  function updateLeg<K extends keyof LegForm>(index: number, field: K, value: LegForm[K]) {
    updateLegOdds(index, { [field]: value } as Partial<LegForm>);
  }

  function addLeg() {
    setForm((currentForm) => {
      const legs = [...currentForm.legs, emptyLeg(currentForm.legs[currentForm.legs.length - 1]?.sport, currentForm.odds)];

      return {
        ...currentForm, legs,
        odds: currentForm.oddsAutoCalc ? computeBaseOddsFromLegs(legs) : currentForm.odds,
        boostedOdds: currentForm.boostedOddsAutoCalc ? computeBoostedOddsFromLegs(legs) : currentForm.boostedOdds,
      };
    });
  }

  function removeLeg(index: number) {
    setForm((currentForm) => {
      const legs = currentForm.legs.filter((_, legIndex) => legIndex !== index);

      return {
        ...currentForm, legs,
        odds: currentForm.oddsAutoCalc ? computeBaseOddsFromLegs(legs) : currentForm.odds,
        boostedOdds: currentForm.boostedOddsAutoCalc ? computeBoostedOddsFromLegs(legs) : currentForm.boostedOdds,
      };
    });
  }

  // Submit: show preview for new bet, confirm dialog for edit.
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (editingId) {
      setConfirm({
        title: 'Save changes?',
        message: 'Update this bet with the new details?',
        confirmLabel: 'Save',
        confirmColor: 'var(--accent)',
        onConfirm: () => {
          setConfirm(null);
          doSave();
        },
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
      setForm(emptyForm());
      setEditingId(null);
      setTitleAuto(true);
      await loadBets();
      setTab('manage');
    } else if (res.status === 401) {
      setAuthed(false);
      setMsg('Session expired — please log in again.');
    } else {
      setMsg('Error saving.');
    }

    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  }

  // Imports every bet left in the batch-screenshot preview in one request.
  async function handleAddAllBatch() {
    if (!batchPreview || batchPreview.length === 0 || batchSaving) {
      return;
    }

    setBatchSaving(true);

    const importBets = batchPreview.map((bet) => ({
      date: bet.date, title: bet.title, type: bet.type, totalOdds: bet.totalOdds,
      baseTotalOdds: bet.baseTotalOdds, isBoosted: bet.isBoosted, stake: bet.stake,
      result: bet.result, returns: bet.returns, cashedOut: bet.cashedOut, notes: bet.notes,
      bookmaker: bet.bookmaker, tags: bet.tags,
      legs: bet.legs.map((leg) => ({
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

        if (res.status === 401) {
          setAuthed(false);
          setConfirm(null);
          return;
        }

        await loadBets();
      },
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  async function bulkSetResult(result: BetResult) {
    if (selectedIds.size === 0 || bulkBusy) {
      return;
    }

    setBulkBusy(true);

    try {
      await Promise.all(Array.from(selectedIds).map((id) =>
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
    if (selectedIds.size === 0) {
      return;
    }

    setConfirm({
      title: `Delete ${selectedIds.size} bet${selectedIds.size !== 1 ? 's' : ''}?`,
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      confirmColor: 'var(--lost)',
      onConfirm: async () => {
        setConfirm(null);
        setBulkBusy(true);

        try {
          await Promise.all(Array.from(selectedIds).map((id) => fetch(`/api/bets/${id}`, { method: 'DELETE' })));
          setSelectedIds(new Set());
          await loadBets();
        } finally {
          setBulkBusy(false);
        }
      },
    });
  }

  // Web-searches a pending bet's real-world outcome and opens the suggestion modal.
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
          legs: bet.legs.map((leg) => ({ selection: leg.selection, market: leg.market, matchup: leg.matchup, sport: leg.sport ?? 'other' })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to look up results');
      }

      setSettleResult(data);
    } catch (err) {
      setSettleError(err instanceof Error ? err.message : 'Failed to look up results');
    } finally {
      setSettleBusy(false);
    }
  }

  // Opens the settled bet for editing with the suggested results pre-applied to each leg.
  function applySettleSuggestion() {
    if (!settling || !settleResult) {
      return;
    }

    const bet = settling;

    handleEdit(bet);
    setForm((currentForm) => ({
      ...currentForm,
      legs: currentForm.legs.map((leg, index) => {
        const suggestion = settleResult.legs.find((legSuggestion) => legSuggestion.index === index);

        return suggestion ? { ...leg, result: suggestion.result } : leg;
      }),
    }));
    setForm((currentForm) => ({ ...currentForm, result: computeBetResult(currentForm.legs.map((leg) => leg.result)) }));
    setSettling(null);
    setSettleResult(null);
  }

  // Loads a bet into the form for editing and switches to the Add/Edit tab.
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
      legs: bet.legs.map((leg) => ({
        selection:     leg.selection,
        market:        leg.market,
        matchup:       leg.matchup,
        odds:          leg.baseOdds ? String(leg.baseOdds) : String(leg.odds),
        oddsTouched:   true,
        boostedOdds:   leg.baseOdds ? String(leg.odds) : '',
        isBoosted:     leg.isBoosted ?? false,
        result:        leg.result,
        sport:         leg.sport ?? 'other',
        isBetBuilder:  leg.isBetBuilder ?? false,
        subLegs:       leg.subLegs ?? [],
        outcomeDecided:leg.outcomeDecided ?? false,
        outcome:       leg.outcome ?? {},
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
      onConfirm: () => {
        setConfirm(null);
        setEditingId(null);
        setForm(emptyForm());
        setTitleAuto(true);
      },
    });
  }

  if (!authed) {
    return (
      <PinLogin
        pin={pin} pinError={pinError} pinSubmitting={pinSubmitting}
        onDigit={handlePinDigit} onBack={handlePinBack} onSubmit={handlePinSubmit}
      />
    );
  }

  return (
    <>
      {confirm && <ConfirmDialog {...confirm} onCancel={() => setConfirm(null)} />}

      {previewBet && (
        <BetPreviewModal
          bet={previewBet}
          saving={saving}
          onKeepEditing={() => setPreviewBet(null)}
          onConfirm={async () => {
            setPreviewBet(null);
            await doSave();
          }}
        />
      )}

      {batchPreview && (
        <BatchPreviewModal
          bets={batchPreview}
          errors={batchErrors}
          saving={batchSaving}
          onDiscardAll={() => {
            setBatchPreview(null);
            setBatchErrors([]);
          }}
          onRemoveOne={(index) => setBatchPreview((prev) => prev ? prev.filter((_, batchIndex) => batchIndex !== index) : prev)}
          onAddAll={handleAddAllBatch}
        />
      )}

      <div style={{ maxWidth: CONTENT_WIDTH, margin: '0 auto', padding: '16px 20px 64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: 19, fontWeight: 700, color: 'var(--text)' }}>Admin</h1>
          {msg && <span style={{ fontSize: 12, color: msg.startsWith('Error') ? 'var(--lost)' : 'var(--won)', fontWeight: 600 }}>{msg}</span>}
        </div>

        <AdminTabs tab={tab} editingId={editingId} betCount={bets.length} onChange={setTab} />

        {tab === 'add' && (
          <BetFormPanel
            editingId={editingId}
            aiEnabled={aiEnabled}
            importMode={importMode} onImportModeChange={setImportMode}
            nlText={nlText} onNlTextChange={setNlText}
            parsingText={parsingText} onParseText={handleParseText}
            parseError={parseError}
            dragOver={dragOver} onDragOverChange={setDragOver}
            parsingSlip={parsingSlip} batchProgress={batchProgress} onSlipFiles={handleSlipFiles}
            templates={templates} templatePick={templatePick} onTemplatePick={applyTemplate}
            onDeletePickedTemplate={() => {
              handleDeleteTemplate(templatePick);
              setTemplatePick('');
            }}
            form={form} setForm={setForm} titleAuto={titleAuto} setTitleAuto={setTitleAuto}
            bookmakerOptions={bookmakerOptions} tagOptions={tagOptions}
            savingTemplate={savingTemplate} onSaveTemplate={handleSaveTemplate}
            onAddLeg={addLeg} onUpdateLeg={updateLeg} onUpdateLegOdds={updateLegOdds} onRemoveLeg={removeLeg}
            saving={saving} onSubmit={handleSubmit} onCancelEdit={handleCancelEdit}
          />
        )}

        {tab === 'manage' && (
          <BetManageList
            bets={bets}
            selectedIds={selectedIds}
            bulkBusy={bulkBusy}
            aiEnabled={aiEnabled}
            onToggleSelect={toggleSelect}
            onBulkSetResult={bulkSetResult}
            onBulkDelete={bulkDelete}
            onClearSelection={() => setSelectedIds(new Set())}
            onSuggestResult={openSettleSuggest}
            onEdit={handleEdit}
            onDelete={confirmDelete}
          />
        )}

        {tab === 'bankroll' && <BankrollAdmin />}
        {tab === 'reports' && <ReportsAdmin bets={bets} aiEnabled={aiEnabled} />}
        {tab === 'data' && <DataAdmin bets={bets} onImported={loadBets} />}
        {tab === 'trash' && <TrashAdmin onChanged={loadBets} />}
      </div>

      {settling && (
        <SettleSuggestionModal
          bet={settling}
          result={settleResult}
          error={settleError}
          busy={settleBusy}
          onClose={() => {
            setSettling(null);
            setSettleResult(null);
          }}
          onApply={applySettleSuggestion}
        />
      )}
    </>
  );
}
