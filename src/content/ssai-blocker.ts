import { rootLogger } from '~/shared/logger';
import { KICK_AD_OVERLAY_SELECTOR_ALL, AD_SELECTOR_ALL } from './selectors';

const log = rootLogger.child('ssai-blocker');
const SWEEP_INTERVAL_MS = 400;
const SEEK_INTERVAL_MS = 250;
const LIVE_EDGE_MARGIN = 0.5;
const EDGE_LAG_THRESHOLD = 1.5;
const MIN_BREAK_S = 20;
const BREAK_BUFFER_S = 3;

let sweepTimer: ReturnType<typeof setInterval> | null = null;
let seekTimer: ReturnType<typeof setInterval> | null = null;
let cleanupTimer: ReturnType<typeof setTimeout> | null = null;
let blockedVideo: HTMLVideoElement | null = null;
let weMuted = false;

function getLiveVideo(): HTMLVideoElement | null {
  let best: HTMLVideoElement | null = null;
  let bestArea = 0;
  for (const v of Array.from(document.querySelectorAll('video'))) {
    if (!(v instanceof HTMLVideoElement)) continue;
    if (v.readyState <= 0) continue;
    if (!v.seekable || v.seekable.length === 0) continue;
    const area = v.clientWidth * v.clientHeight;
    if (area >= bestArea) { bestArea = area; best = v; }
  }
  return best;
}

function seekToLiveEdge(): void {
  const v = getLiveVideo();
  if (!v) return;
  const sk = v.seekable;
  if (!sk || sk.length === 0) return;
  try {
    const end = sk.end(sk.length - 1);
    const target = end - LIVE_EDGE_MARGIN;
    if (target > v.currentTime + EDGE_LAG_THRESHOLD) v.currentTime = target;
    if (v.paused) void v.play().catch(() => {});
  } catch { /* InvalidStateError during rebuffer */ }
}

function muteVideo(): void {
  const v = getLiveVideo();
  if (!v) return;
  blockedVideo = v;
  if (!v.muted) { v.muted = true; weMuted = true; v.setAttribute('data-kab-muted', '1'); }
}

function restoreVideo(): void {
  const v = blockedVideo;
  blockedVideo = null;
  if (!v) { weMuted = false; return; }
  try {
    v.playbackRate = 1;
    if (weMuted && v.getAttribute('data-kab-muted') === '1') v.muted = false;
    v.removeAttribute('data-kab-muted');
  } catch { /* ignore */ }
  weMuted = false;
}

function sweepKickAdOverlays(): void {
  // Hide Kick's own ad-state overlays (logo, spinner, ad-break UI)
  try {
    const els = document.querySelectorAll(KICK_AD_OVERLAY_SELECTOR_ALL);
    for (const el of els) {
      if (el instanceof HTMLElement && !el.hasAttribute('data-kab') && !el.hasAttribute('data-kab-hidden')) {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
        el.setAttribute('data-kab-ad-hidden', '1');
      }
    }
  } catch { /* selector edge case */ }

  try {
    const els = document.querySelectorAll(AD_SELECTOR_ALL);
    for (const el of els) {
      if (el instanceof HTMLElement && !el.hasAttribute('data-kab') && !el.hasAttribute('data-kab-hidden')) {
        el.style.setProperty('display', 'none', 'important');
        el.setAttribute('data-kab-ad-hidden', '1');
      }
    }
  } catch { /* ignore */ }
}

function restoreKickAdOverlays(): void {
  try {
    const els = document.querySelectorAll('[data-kab-ad-hidden], [data-kab-cover-hidden]');
    for (const el of els) {
      if (el instanceof HTMLElement) {
        el.style.removeProperty('display');
        el.style.removeProperty('visibility');
        el.removeAttribute('data-kab-ad-hidden');
        el.removeAttribute('data-kab-cover-hidden');
      }
    }
  } catch { /* ignore */ }
}

// Selector-independent fallback: Kick renames its ad/logo-placeholder classes,
// so during a known ad break we also hide any element stacked ABOVE the video
// that covers most of it — whatever it is called. Restored on stopSsaiBlock().
function describe(el: HTMLElement): string {
  const cls = typeof el.className === 'string' ? el.className.trim().replace(/\s+/g, '.') : '';
  return el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + (cls ? `.${cls}` : '');
}

function hideCoveringOverlays(): number {
  let hidden = 0;
  try {
    const v = getLiveVideo();
    if (!v) return 0;
    const r = v.getBoundingClientRect();
    if (r.width < 40 || r.height < 40) return 0;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const vArea = r.width * r.height;
    const stack = document.elementsFromPoint(cx, cy);
    for (const el of stack) {
      if (el === v) break; // reached the video: anything below is behind it
      if (!(el instanceof HTMLElement)) continue;
      if (el.contains(v)) continue; // a wrapper of the video, not an overlay
      if (el.hasAttribute('data-kab') || el.hasAttribute('data-kab-cover-hidden')) continue;
      const er = el.getBoundingClientRect();
      // Only hide things that genuinely cover the player (not small badges/controls).
      if (er.width * er.height < vArea * 0.5) continue;
      el.style.setProperty('display', 'none', 'important');
      el.setAttribute('data-kab-cover-hidden', '1');
      log.info(`Hid covering overlay: ${describe(el)}`);
      hidden++;
    }
  } catch { /* layout/cross-origin edge case */ }
  return hidden;
}

// Runtime self-check the user can watch during a real midroll: after suppression,
// is the player surface clear (topmost element at video center is the video or our
// own marker)? Logs a definitive PASS/STILL-COVERED line + the offending element.
function reportSuppressionState(): void {
  try {
    const v = getLiveVideo();
    if (!v) return;
    const r = v.getBoundingClientRect();
    if (r.width < 40 || r.height < 40) return;
    const hits = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    if (!hits.length) return;
    const top = hits[0];
    if (top === v || (top instanceof HTMLElement && top.contains(v))) {
      log.info('Suppression PASS — player surface is clear (no overlay covering the video)');
    } else if (top instanceof HTMLElement) {
      log.warn(`Suppression STILL-COVERED by: ${describe(top)} — add this to KICK_AD_OVERLAY_SELECTORS`);
    }
  } catch { /* ignore */ }
}

export function startSsaiBlock(duration: number, rollType: string): void {
  log.info(`SSAI block start: ${rollType} ${duration}s`);

  // Suppress Kick's own ad UI / logo, mute so no ad audio leaks, ride the live edge.
  sweepKickAdOverlays();
  hideCoveringOverlays();
  muteVideo();
  seekToLiveEdge();
  // Runtime self-check (visible in the page console) so a real midroll confirms
  // whether the logo actually went away — or names what still covers the player.
  reportSuppressionState();

  // Re-entrant: a repeat ssai.block re-arms timers and extends the window.
  if (sweepTimer !== null) clearInterval(sweepTimer);
  if (seekTimer !== null) clearInterval(seekTimer);
  if (cleanupTimer !== null) clearTimeout(cleanupTimer);

  sweepTimer = setInterval(() => { sweepKickAdOverlays(); hideCoveringOverlays(); }, SWEEP_INTERVAL_MS);
  seekTimer = setInterval(seekToLiveEdge, SEEK_INTERVAL_MS);

  // A single LL-HLS snapshot can under-report the break (sliding window),
  // so treat parsed duration as a lower bound: max(parsed, MIN_BREAK_S) + buffer.
  const windowS = Math.max(duration, MIN_BREAK_S) + BREAK_BUFFER_S;
  cleanupTimer = setTimeout(() => { stopSsaiBlock(); }, windowS * 1000);
}

export function stopSsaiBlock(): void {
  if (sweepTimer !== null) { clearInterval(sweepTimer); sweepTimer = null; }
  if (seekTimer !== null) { clearInterval(seekTimer); seekTimer = null; }
  if (cleanupTimer !== null) { clearTimeout(cleanupTimer); cleanupTimer = null; }
  restoreVideo();
  restoreKickAdOverlays();
  log.debug('SSAI block ended');
}
