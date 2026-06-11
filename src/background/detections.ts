import { type AdDetection } from '~/shared/types';

const KEY = 'kab.detections.v1';
const MAX = 30;

export async function addDetection(d: AdDetection): Promise<number> {
  const raw = await chrome.storage.local.get(KEY);
  const list = (raw[KEY] as AdDetection[] | undefined) ?? [];
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
