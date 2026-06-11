import { DomAdCleaner } from './dom-cleaner';
import { VideoAdSkipper } from './video-ad-skipper';
import { injectHlsProxy } from './hls-proxy';
import { mountReportButton, unmountReportButton } from './report-button';
import { loadSettings, watchSettings } from '~/shared/settings';
import { send } from '~/shared/messages';
import { rootLogger } from '~/shared/logger';
import INLINE_STUB from './inline-stub?raw';

const log = rootLogger.child('content');

/* ── MAIN world stub injection ── */

function injectStub(): void {
  try {
    const script = document.createElement('script');
    const url = chrome.runtime.getURL('googletag-stub.js');
    script.src = url;
    script.onload = () => script.remove();
    script.onerror = () => {
      log.warn('Falling back to inline stub injection');
      const el = document.createElement('script');
      el.textContent = INLINE_STUB;
      (document.head || document.documentElement).appendChild(el);
      el.remove();
    };
    (document.head || document.documentElement).appendChild(script);
    log.debug('Stub injected');
  } catch (err) {
    log.error('Stub injection failed:', err);
  }
}

/* ── DOM cleaner ── */

let cleaner: DomAdCleaner | null = null;

function startCleaner(): void {
  if (cleaner) return;
  cleaner = new DomAdCleaner((count) => {
    send({ type: 'stats.domBlocked', payload: { count } }).catch(() => {});
  });
  cleaner.start();
}

function stopCleaner(): void {
  cleaner?.stop();
  cleaner = null;
}

/* ── Video ad skipper ── */

let skipper: VideoAdSkipper | null = null;

function startSkipper(): void {
  if (skipper) return;
  skipper = new VideoAdSkipper((count) => {
    send({ type: 'stats.videoAdBlocked', payload: { count } }).catch(() => {});
  });
  skipper.start();
}

function stopSkipper(): void {
  skipper?.stop();
  skipper = null;
}

/* ── Bootstrap ── */

async function main(): Promise<void> {
  const settings = await loadSettings();
  log.setEnabled(settings.debug);

  if (!settings.enabled) {
    log.info('Disabled by user');
    return;
  }

  injectStub();
  injectHlsProxy();

  if (settings.blockDom) {
    if (document.body) startCleaner();
    else document.addEventListener('DOMContentLoaded', startCleaner, { once: true });
  }

  if (settings.blockVideoAds) {
    if (document.body) startSkipper();
    else document.addEventListener('DOMContentLoaded', startSkipper, { once: true });
  }

  // Inject in-page report button (next to viewer count)
  mountReportButton();

  // Re-mount on SPA navigation (Kick uses pushState)
  const origPush = history.pushState.bind(history);
  history.pushState = (...args) => {
    origPush(...args);
    setTimeout(mountReportButton, 2_000);
  };
  window.addEventListener('popstate', () => setTimeout(mountReportButton, 2_000));

  watchSettings((next) => {
    log.setEnabled(next.debug);
    if (!next.enabled) { stopCleaner(); stopSkipper(); unmountReportButton(); return; }
    if (next.blockDom && !cleaner) startCleaner();
    if (!next.blockDom && cleaner) stopCleaner();
    if (next.blockVideoAds && !skipper) startSkipper();
    if (!next.blockVideoAds && skipper) stopSkipper();
    mountReportButton();
  });

  log.info('Active');
}

main().catch((err) => log.error('Init failed:', err));
