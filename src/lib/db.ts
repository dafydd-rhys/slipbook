import { promises as fs } from 'fs';
import path from 'path';
import { BetsData, Bet, BetLeg, BankrollData, BankrollEntry, BetTemplatesData, BetTemplate, Goal } from './types';
import { FilterPresetsData } from './filters';

// Guards against NaN/Infinity ever reaching JSON.stringify (Response.json()
// throws "Value is not JSON serializable" for non-finite numbers) — a bad
// stake/odds computed client-side (e.g. from an empty/invalid boosted-odds
// field) would otherwise get persisted and then 500 every future read.
function finite(n: number | undefined, fallback: number): number {
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}
function finiteOrUndefined(n: number | undefined): number | undefined {
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
}
function sanitizeLeg(leg: BetLeg): BetLeg {
  return { ...leg, odds: finite(leg.odds, 1), baseOdds: finiteOrUndefined(leg.baseOdds) };
}
function sanitizeBet(bet: Bet): Bet {
  return {
    ...bet,
    totalOdds: finite(bet.totalOdds, 1),
    baseTotalOdds: finiteOrUndefined(bet.baseTotalOdds),
    stake: finite(bet.stake, 0),
    returns: finiteOrUndefined(bet.returns),
    legs: bet.legs.map(sanitizeLeg),
  };
}

async function getRedis() {
  const url   = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const { Redis } = await import('@upstash/redis');
  return new Redis({ url, token });
}

// Generic Redis-key + local-JSON-file backed store for a single blob of data.
// Mirrors the original bets-only implementation, generalized for reuse.
function createStore<T>(redisKey: string, localFileName: string, empty: T) {
  const localFile = path.join(process.cwd(), 'data', localFileName);

  async function read(): Promise<T> {
    const redis = await getRedis();
    if (redis) {
      const data = await redis.get<T>(redisKey);
      return data ?? empty;
    }
    try {
      return JSON.parse(await fs.readFile(localFile, 'utf-8')) as T;
    } catch {
      return empty;
    }
  }

  async function write(data: T): Promise<void> {
    const redis = await getRedis();
    if (redis) {
      await redis.set(redisKey, data);
      return;
    }
    await fs.mkdir(path.dirname(localFile), { recursive: true });
    await fs.writeFile(localFile, JSON.stringify(data, null, 2), 'utf-8');
  }

  return { read, write };
}

// ── Bets ─────────────────────────────────────────────────────────────────────
const betsStore = createStore<BetsData>('bets', 'bets.json', { bets: [] });
const TRASH_RETENTION_DAYS = 30;

function isExpiredTrash(bet: Bet): boolean {
  if (!bet.deletedAt) return false;
  const ageMs = Date.now() - new Date(bet.deletedAt).getTime();
  return ageMs > TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
}

// Sanitized + shape-normalized on every read (see sanitizeBet/legacy-array
// comment history), and lazily purges any trash past its retention window —
// writes back only when something was actually purged, so a normal read
// stays a single round-trip.
async function readAllBets(): Promise<BetsData> {
  const raw = await betsStore.read();
  const bets = (Array.isArray(raw) ? raw : (raw.bets ?? [])).map(sanitizeBet);
  const kept = bets.filter(b => !isExpiredTrash(b));
  if (kept.length !== bets.length) await writeBets({ bets: kept });
  return { bets: kept };
}

// Active (non-deleted) bets only — what every public route and the normal
// admin bet list should see. Soft-deleted bets live in readTrash() instead.
export async function readBets(): Promise<BetsData> {
  const { bets } = await readAllBets();
  return { bets: bets.filter(b => !b.deletedAt) };
}
export async function readTrash(): Promise<BetsData> {
  const { bets } = await readAllBets();
  return { bets: bets.filter(b => !!b.deletedAt) };
}
export const writeBets = betsStore.write;

export async function addBet(bet: Bet): Promise<Bet> {
  const clean = sanitizeBet(bet);
  const data = await readAllBets();
  data.bets.unshift(clean);
  await writeBets(data);
  return clean;
}

// Bulk insert for CSV/JSON import — a single read-modify-write instead of one per bet.
export async function addBets(bets: Bet[]): Promise<number> {
  const clean = bets.map(sanitizeBet);
  const data = await readAllBets();
  data.bets.unshift(...clean);
  await writeBets(data);
  return clean.length;
}

export async function updateBet(id: string, updates: Partial<Bet>): Promise<Bet | null> {
  const data = await readAllBets();
  const idx = data.bets.findIndex(b => b.id === id);
  if (idx === -1) return null;
  data.bets[idx] = sanitizeBet({ ...data.bets[idx], ...updates, id: data.bets[idx].id });
  await writeBets(data);
  return data.bets[idx];
}

// Soft-delete: marks the bet instead of removing it, recoverable via
// restoreBet() within TRASH_RETENTION_DAYS (readAllBets purges it after that).
export async function deleteBet(id: string): Promise<boolean> {
  const data = await readAllBets();
  const idx = data.bets.findIndex(b => b.id === id);
  if (idx === -1) return false;
  data.bets[idx] = { ...data.bets[idx], deletedAt: new Date().toISOString() };
  await writeBets(data);
  return true;
}

export async function restoreBet(id: string): Promise<boolean> {
  const data = await readAllBets();
  const idx = data.bets.findIndex(b => b.id === id);
  if (idx === -1 || !data.bets[idx].deletedAt) return false;
  const restored: Bet = { ...data.bets[idx] };
  delete restored.deletedAt;
  data.bets[idx] = restored;
  await writeBets(data);
  return true;
}

// Hard delete — permanently removes a bet already in the trash.
export async function purgeBet(id: string): Promise<boolean> {
  const data = await readAllBets();
  const idx = data.bets.findIndex(b => b.id === id && !!b.deletedAt);
  if (idx === -1) return false;
  data.bets.splice(idx, 1);
  await writeBets(data);
  return true;
}

// ── Bankroll ─────────────────────────────────────────────────────────────────
const bankrollStore = createStore<BankrollData>('bankroll', 'bankroll.json', { entries: [] });

export const readBankroll = bankrollStore.read;
export const writeBankroll = bankrollStore.write;

export async function addBankrollEntry(entry: BankrollEntry): Promise<BankrollEntry> {
  const data = await readBankroll();
  data.entries.unshift(entry);
  await writeBankroll(data);
  return entry;
}

export async function deleteBankrollEntry(id: string): Promise<boolean> {
  const data = await readBankroll();
  const idx = data.entries.findIndex(e => e.id === id);
  if (idx === -1) return false;
  data.entries.splice(idx, 1);
  await writeBankroll(data);
  return true;
}

// ── Bet templates ────────────────────────────────────────────────────────────
const templatesStore = createStore<BetTemplatesData>('templates', 'templates.json', { templates: [] });

export const readTemplates = templatesStore.read;
export const writeTemplates = templatesStore.write;

export async function addTemplate(template: BetTemplate): Promise<BetTemplate> {
  const data = await readTemplates();
  data.templates.unshift(template);
  await writeTemplates(data);
  return template;
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const data = await readTemplates();
  const idx = data.templates.findIndex(t => t.id === id);
  if (idx === -1) return false;
  data.templates.splice(idx, 1);
  await writeTemplates(data);
  return true;
}

// ── AI summary cache ─────────────────────────────────────────────────────────
export interface StoredSummary {
  text: string;
  period: string; // e.g. "Last 30 days", "August 2026"
  generatedAt: string;
}
const summaryStore = createStore<StoredSummary | null>('ai_summary', 'ai-summary.json', null);
export const readSummary = summaryStore.read;
export const writeSummary = summaryStore.write;

// ── Saved filter presets ─────────────────────────────────────────────────────
const presetsStore = createStore<FilterPresetsData>('filter_presets', 'filter-presets.json', { presets: [] });
export const readPresets = presetsStore.read;
export const writePresets = presetsStore.write;

export async function addPreset(preset: FilterPresetsData['presets'][number]): Promise<FilterPresetsData['presets'][number]> {
  const data = await readPresets();
  data.presets.unshift(preset);
  await writePresets(data);
  return preset;
}

export async function deletePreset(id: string): Promise<boolean> {
  const data = await readPresets();
  const idx = data.presets.findIndex(p => p.id === id);
  if (idx === -1) return false;
  data.presets.splice(idx, 1);
  await writePresets(data);
  return true;
}

// ── Goal ─────────────────────────────────────────────────────────────────────
const goalStore = createStore<Goal | null>('goal', 'goal.json', null);
export const readGoal = goalStore.read;
export const writeGoal = goalStore.write;
