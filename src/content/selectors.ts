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
  // Anchored to avoid matching benign classes like "video-adaptive"
  '[class~="video-ad"]',
  '[class*="video-ad-"]',
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

/**
 * Selectors specific to Kick's own ad-state UI overlays (VideoJS + Kick SPA).
 * These appear when the Kick player enters an ad break — even when the actual
 * ad segments have been scrubbed from the HLS manifest by hls-proxy.js.
 */
export const KICK_AD_OVERLAY_SELECTORS: readonly string[] = [
  // VideoJS ad-state classes
  '.vjs-ad-loading',
  '.vjs-ad-playing',
  '[class*="vjs-ad"]',
  // Kick SPA overlay elements
  '[class*="StreamAd"]',
  '[class*="stream-ad"]',
  '[class*="AdOverlay"]',
  '[class*="ad-overlay"]',
  '[class*="preroll-overlay"]',
  // Generic loading/spinner that covers the player during ad break
  '[class*="player-overlay"][class*="ad"]',
  '[data-ad-break]',
  '[data-testid*="-ad-"]',
  '[data-testid^="ad-"]',
  '[data-testid$="-ad"]',
  '[data-testid="ad"]',
  // Kick logo placeholder shown during SSAI break
  '[class*="KickLogoPlaceholder"]',
  '[class*="kick-logo-placeholder"]',
  '[class*="AdBreakOverlay"]',
  '[class*="ad-break-overlay"]',
];

export const KICK_AD_OVERLAY_SELECTOR_ALL = KICK_AD_OVERLAY_SELECTORS.join(', ');
