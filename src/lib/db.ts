import { promises as fs } from 'fs';
import path from 'path';
import { BetsData, Bet } from './types';

const LOCAL_FILE = path.join(process.cwd(), 'data', 'bets.json');
const KV_KEY = 'bets';

async function getKV() {
  if (!process.env.KV_REST_API_URL) return null;
  const { kv } = await import('@vercel/kv');
  return kv;
}

export async function readBets(): Promise<BetsData> {
  const kv = await getKV();
  if (kv) {
    const bets = await kv.get<Bet[]>(KV_KEY);
    return { bets: bets ?? [] };
  }
  try {
    const raw = await fs.readFile(LOCAL_FILE, 'utf-8');
    return JSON.parse(raw) as BetsData;
  } catch {
    return { bets: [] };
  }
}

export async function writeBets(data: BetsData): Promise<void> {
  const kv = await getKV();
  if (kv) {
    await kv.set(KV_KEY, data.bets);
    return;
  }
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await fs.writeFile(LOCAL_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function addBet(bet: Bet): Promise<Bet> {
  const data = await readBets();
  data.bets.unshift(bet);
  await writeBets(data);
  return bet;
}

export async function updateBet(id: string, updates: Partial<Bet>): Promise<Bet | null> {
  const data = await readBets();
  const idx = data.bets.findIndex(b => b.id === id);
  if (idx === -1) return null;
  data.bets[idx] = { ...data.bets[idx], ...updates };
  await writeBets(data);
  return data.bets[idx];
}

export async function deleteBet(id: string): Promise<boolean> {
  const data = await readBets();
  const idx = data.bets.findIndex(b => b.id === id);
  if (idx === -1) return false;
  data.bets.splice(idx, 1);
  await writeBets(data);
  return true;
}
