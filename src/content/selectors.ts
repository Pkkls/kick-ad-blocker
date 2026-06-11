/** CSS selectors for ad elements on Kick.com.
 *  Centralised here so they're easy to update when Kick changes its DOM. */

export const AD_SELECTORS: readonly string[] = [
  // Google Publisher Tags containers
  '[id^="google_ads"]',
  '[id^="div-gpt-ad"]',
  '[class*="gpt-ad"]',
  '[data-google-query-id]',

  // Google IMA SDK (video pre-roll)
  '[class*="ima-ad"]',
  '[id*="ima-ad"]',
  '.ima-ad-container',

  // Generic ad containers
  '[id*="ad-slot"]',
  '[class*="ad-overlay"]',
  '[class*="ad-container"]',
  '[class*="ad_container"]',
  '[class*="advertisement"]',
  '[class*="video-ad"]',
  '[class*="preroll"]',
  '[class*="midroll"]',

  // Ad iframes
  'iframe[src*="doubleclick"]',
  'iframe[src*="googlesyndication"]',
  'iframe[src*="imasdk"]',
  'iframe[src*="googleadservices"]',
];

/** Combined selector string for querySelectorAll. */
export const AD_SELECTOR_ALL = AD_SELECTORS.join(', ');

/** Check if an element matches any ad selector. */
export function isAdElement(el: Element): boolean {
  try {
    return el.matches(AD_SELECTOR_ALL);
  } catch {
    return false;
  }
}

export const CATEGORY_AD_SELECTORS: readonly string[] = [
  '[class*="ad-overlay"]',
  '[class*="preroll-overlay"]',
  '[class*="channel-preview-ad"]',
  '[data-ad-slot]',
  '[class*="video-ad-overlay"]',
  '[class*="ad-banner"]',
  '[class*="kick-ad"]',
  '[class*="category-ad"]',
];

export const CATEGORY_AD_SELECTOR_ALL = CATEGORY_AD_SELECTORS.join(', ');

export const AD_OVERLAY_PATTERNS: readonly RegExp[] = [
  /ad[-_]?container/i,
  /preroll/i,
  /video[-_]?ad/i,
  /ad[-_]?overlay/i,
  /sponsor/i,
];
