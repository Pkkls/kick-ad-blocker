export const EXT_PREFIX = '[KAB]';
export const KEEPALIVE_INTERVAL_SEC = 25;
export const STORAGE_KEY_SETTINGS = 'kab.settings.v1';
export const STORAGE_KEY_STATS = 'kab.stats.v1';

export const AD_MAX_DURATION_SEC = 15;
export const CATEGORY_URL_PATTERNS: readonly RegExp[] = [
  /kick\.com\/browse/,
  /kick\.com\/category\//,
  /kick\.com\/?$/,
];
export const AD_VIDEO_SRC_PATTERNS: readonly RegExp[] = [
  /\/ads?\//i,
  /ad-delivery/i,
  /preroll/i,
  /doubleclick\.net/i,
  /googlesyndication/i,
  /[?&]adunit=/i,
];
