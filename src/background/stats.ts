import { STORAGE_KEY_STATS } from '~/shared/constants';
import { type BlockStats, emptyStats } from '~/shared/types';

let cached: BlockStats | null = null;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

async function load(): Promise<BlockStats> {
  if (cached && cached.todayKey === todayKey()) return cached;
  const raw = await chrome.storage.local.get(STORAGE_KEY_STATS);
  const data = raw[STORAGE_KEY_STATS] as BlockStats | undefined;
  if (data && data.todayKey === todayKey()) {
    cached = data;
    return cached;
  }
  // New day — reset
  cached = emptyStats();
  await save();
  return cached;
}

async function save(): Promise<void> {
  if (!cached) return;
  await chrome.storage.local.set({ [STORAGE_KEY_STATS]: cached });
}

export async function getStats(): Promise<BlockStats> {
  return load();
}

export async function addNetworkBlocked(count: number): Promise<void> {
  const s = await load();
  s.networkBlocked += count;
  await save();
}

export async function addDomHidden(count: number): Promise<void> {
  const s = await load();
  s.domHidden += count;
  await save();
}

export async function resetStats(): Promise<BlockStats> {
  cached = emptyStats();
  await save();
  return cached;
}
