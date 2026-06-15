import { type AdDetection } from '~/shared/types';

const KEY = 'kab.detections.v1';
const MAX = 15;
const DEDUP_WINDOW_MS = 60_000;

export async function addDetection(d: AdDetection): Promise<number> {
  const raw = await chrome.storage.local.get(KEY);
  const list = (raw[KEY] as AdDetection[] | undefined) ?? [];
  const dominated = list.some(
    (e) => e.kind === d.kind && e.channel === d.channel && Math.abs(e.ts - d.ts) < DEDUP_WINDOW_MS,
  );
  if (dominated) return list.length;
  list.unshift(d);
  if (list.length > MAX) list.length = MAX;
  await chrome.storage.local.set({ [KEY]: list });
  return list.length;
}

export async function listDetections(): Promise<AdDetection[]> {
  const raw = await chrome.storage.local.get(KEY);
  return (raw[KEY] as AdDetection[] | undefined) ?? [];
}

export async function detectionCount(): Promise<number> {
  return (await listDetections()).length;
}

export async function clearDetections(): Promise<void> {
  await chrome.storage.local.set({ [KEY]: [] });
}
