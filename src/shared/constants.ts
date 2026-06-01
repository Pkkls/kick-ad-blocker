export const EXT_NAME = 'Kick Ad Blocker';
export const EXT_PREFIX = '[KAB]';

export const KEEPALIVE_INTERVAL_SEC = 25;

export const STORAGE_KEY_SETTINGS = 'kab.settings.v1';
export const STORAGE_KEY_STATS = 'kab.stats.v1';

/** CSS selectors for known ad containers on Kick. */
export const AD_SELECTORS = [
  '[id^="google_ads"]',
  '[id^="div-gpt-ad"]',
  '[class*="gpt-ad"]',
  '[data-google-query-id]',
  '[id*="ad-slot"]',
  'iframe[src*="doubleclick"]',
  'iframe[src*="googlesyndication"]',
  'iframe[src*="imasdk"]',
  '[class*="ad-overlay"]',
  '[class*="preroll"]',
  '[class*="ad-container"]',
  '[class*="ad_container"]',
  '[class*="advertisement"]',
  '[class*="video-ad"]',
  '[class*="ima-ad"]',
] as const;

/** Domains blocked by declarativeNetRequest (static rules). */
export const BLOCKED_DOMAINS = [
  'securepubads.g.doubleclick.net',
  'pagead2.googlesyndication.com',
  'googleadservices.com',
  'tpc.googlesyndication.com',
  'imasdk.googleapis.com',
  'ad.doubleclick.net',
  'cm.g.doubleclick.net',
  'kickproduction.api.useinsider.com',
  'adservice.google.com',
  'googlesyndication.com',
] as const;

/** Optional domains — user can toggle these in settings. */
export const OPTIONAL_DOMAINS = [
  { domain: 'www.googletagmanager.com', label: 'Google Tag Manager', default: false },
  { domain: 'litix.io', label: 'Mux Analytics', default: false },
  { domain: 'www.datadoghq-browser-agent.com', label: 'Datadog RUM', default: false },
] as const;

/** Dynamic rule IDs start from this offset. */
export const DYNAMIC_RULE_ID_START = 10_000;
