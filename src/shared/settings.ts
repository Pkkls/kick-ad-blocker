import { z } from 'zod';
import { STORAGE_KEY_SETTINGS } from './constants';

export const SettingsSchema = z.object({
  enabled: z.boolean().default(true),
  blockNetwork: z.boolean().default(true),
  blockDom: z.boolean().default(true),

  // Optional domain blocking (off by default)
  blockGtm: z.boolean().default(false),
  blockAnalytics: z.boolean().default(false),
  blockDatadog: z.boolean().default(false),

  // User-added custom blocked domains
  customDomains: z.array(z.string()).default([]),

  showBadge: z.boolean().default(true),
  debug: z.boolean().default(false),
});

export type Settings = z.infer<typeof SettingsSchema>;

const DEFAULTS: Settings = SettingsSchema.parse({});

export function defaultSettings(): Settings {
  return { ...DEFAULTS, customDomains: [...DEFAULTS.customDomains] };
}

export async function loadSettings(): Promise<Settings> {
  const raw = await chrome.storage.sync.get(STORAGE_KEY_SETTINGS);
  const candidate = raw[STORAGE_KEY_SETTINGS];
  if (!candidate) return defaultSettings();
  const parsed = SettingsSchema.safeParse(candidate);
  return parsed.success ? parsed.data : defaultSettings();
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await loadSettings();
  const next = SettingsSchema.parse({ ...current, ...patch });
  await chrome.storage.sync.set({ [STORAGE_KEY_SETTINGS]: next });
  return next;
}

export async function resetSettings(): Promise<Settings> {
  const fresh = defaultSettings();
  await chrome.storage.sync.set({ [STORAGE_KEY_SETTINGS]: fresh });
  return fresh;
}

export async function exportSettings(): Promise<string> {
  const s = await loadSettings();
  return JSON.stringify(s, null, 2);
}

export async function importSettings(json: string): Promise<Settings> {
  const raw: unknown = JSON.parse(json);
  const parsed = SettingsSchema.safeParse(raw);
  if (!parsed.success) throw new Error('Invalid settings JSON');
  await chrome.storage.sync.set({ [STORAGE_KEY_SETTINGS]: parsed.data });
  return parsed.data;
}

export function watchSettings(cb: (next: Settings) => void): () => void {
  const handler = (
    changes: { [key: string]: chrome.storage.StorageChange },
    area: chrome.storage.AreaName,
  ): void => {
    if (area !== 'sync') return;
    const change = changes[STORAGE_KEY_SETTINGS];
    if (!change) return;
    const parsed = SettingsSchema.safeParse(change.newValue);
    if (parsed.success) cb(parsed.data);
  };
  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
}
