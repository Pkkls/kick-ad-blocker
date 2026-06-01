/**
 * Content script entry point — runs at document_start on kick.com.
 *
 * 1. Injects the googletag/IMA stub into MAIN world (prevents ad init)
 * 2. Starts a MutationObserver to hide any ad-related DOM elements
 * 3. Watches settings to toggle layers on/off at runtime
 * 4. Handles report.capture requests from the popup
 */
import { DomAdCleaner } from './dom-cleaner';
import { captureFingerprint, diffFingerprint, BASELINE } from './fingerprint';
import { AD_SELECTOR_ALL } from './selectors';
import { loadSettings, watchSettings } from '~/shared/settings';
import { send, type AdReport, type RuntimeResponse } from '~/shared/messages';
import { onMessage } from '~/shared/messages';
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

/* ── Ad report capture ── */

function captureReport(): AdReport {
  const fp = captureFingerprint();
  const changes = diffFingerprint(BASELINE, fp);

  // Collect visible ad-related elements
  const adEls: string[] = [];
  try {
    document.querySelectorAll(AD_SELECTOR_ALL).forEach((el) => {
      const desc = `${el.tagName}#${el.id || ''}${el.className ? '.' + String(el.className).split(' ')[0] : ''}`;
      adEls.push(desc);
    });
  } catch { /* ignore */ }

  // Extract channel from URL
  const channel = location.pathname.replace(/^\//, '').split('/')[0] || 'unknown';

  return {
    url: location.href,
    channel,
    timestamp: new Date().toISOString(),
    fingerprint: changes.length > 0 ? changes : ['No changes from baseline'],
    adDomains: fp.adDomains,
    adElements: adEls.length > 0 ? adEls : ['None detected in DOM'],
    playerTech: fp.playerTech,
    extensionVersion: chrome.runtime.getManifest().version,
  };
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

/* ── Message handler (popup → content) ── */

onMessage(async (msg): Promise<RuntimeResponse | void> => {
  if (msg.type === 'report.capture') {
    const report = captureReport();
    return { type: 'report', payload: report };
  }
  return undefined;
});

/* ── Bootstrap ── */

async function main(): Promise<void> {
  const settings = await loadSettings();
  log.setEnabled(settings.debug);

  if (!settings.enabled) {
    log.info('Disabled by user');
    return;
  }

  injectStub();

  if (settings.blockDom) {
    if (document.body) startCleaner();
    else document.addEventListener('DOMContentLoaded', startCleaner, { once: true });
  }

  watchSettings((next) => {
    log.setEnabled(next.debug);
    if (!next.enabled) { stopCleaner(); return; }
    if (next.blockDom && !cleaner) startCleaner();
    if (!next.blockDom && cleaner) stopCleaner();
  });

  log.info('Active');
}

main().catch((err) => log.error('Init failed:', err));
