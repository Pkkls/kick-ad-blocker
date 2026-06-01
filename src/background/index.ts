import { onMessage, type RuntimeResponse } from '~/shared/messages';
import { loadSettings, saveSettings, resetSettings } from '~/shared/settings';
import { installKeepalive } from './keepalive';
import { getStats, addDomHidden, resetStats } from './stats';
import { rootLogger } from '~/shared/logger';

const log = rootLogger.child('sw');

/* ── Fingerprint state ── */

let lastFingerprintChanges: string[] = [];
let lastFingerprintCheck = 0;

/* ── Init ── */

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    log.info('Extension installed');
    await loadSettings(); // ensure defaults written
  }
});

installKeepalive();

/* ── Badge ── */

async function updateBadge(): Promise<void> {
  const settings = await loadSettings();
  if (!settings.showBadge || !settings.enabled) {
    await chrome.action.setBadgeText({ text: '' });
    return;
  }
  const stats = await getStats();
  const total = stats.networkBlocked + stats.domHidden;
  const text = total > 0 ? (total > 999 ? `${Math.floor(total / 1000)}k` : String(total)) : '';
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color: '#53fc18' });
}

// Update badge periodically
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'kab.keepalive') {
    await updateBadge();
  }
});

/* ── Messages ── */

onMessage(async (msg): Promise<RuntimeResponse | void> => {
  switch (msg.type) {
    case 'settings.get': {
      const s = await loadSettings();
      return { type: 'settings', payload: s };
    }
    case 'settings.set': {
      const s = await saveSettings(msg.payload);
      await updateBadge();
      return { type: 'settings', payload: s };
    }
    case 'settings.reset': {
      const s = await resetSettings();
      await updateBadge();
      return { type: 'settings', payload: s };
    }
    case 'stats.get': {
      const stats = await getStats();
      // Also try to get declarativeNetRequest matched rules count
      try {
        const matched = await chrome.declarativeNetRequest.getMatchedRules();
        stats.networkBlocked = matched.rulesMatchedInfo.length;
      } catch {
        // declarativeNetRequestFeedback might not be available
      }
      return { type: 'stats', payload: stats };
    }
    case 'stats.reset': {
      const stats = await resetStats();
      await updateBadge();
      return { type: 'stats', payload: stats };
    }
    case 'stats.domBlocked': {
      await addDomHidden(msg.payload.count);
      await updateBadge();
      return { type: 'ack' };
    }
    case 'fingerprint.changed': {
      lastFingerprintChanges = msg.payload.changes;
      lastFingerprintCheck = Date.now();
      if (msg.payload.changes.length > 0) {
        log.warn('Ad-tech changes detected:', msg.payload.changes);
        // Show warning badge
        await chrome.action.setBadgeText({ text: '!' });
        await chrome.action.setBadgeBackgroundColor({ color: '#ff4444' });
      }
      return { type: 'ack' };
    }
    case 'fingerprint.get': {
      return {
        type: 'fingerprint',
        payload: { changes: lastFingerprintChanges, lastCheck: lastFingerprintCheck },
      };
    }
    case 'open.options': {
      await chrome.runtime.openOptionsPage();
      return { type: 'ack' };
    }
    case 'ping':
      return { type: 'ack' };
    default:
      return undefined;
  }
});

log.info('Service worker ready');
