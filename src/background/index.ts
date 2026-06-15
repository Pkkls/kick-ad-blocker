import { onMessage, type RuntimeResponse } from '~/shared/messages';
import { loadSettings, saveSettings, resetSettings } from '~/shared/settings';
import { installKeepalive } from './keepalive';
import { getStats, addDomHidden, addVideoAdBlocked, resetStats } from './stats';
import { addDetection, listDetections, detectionCount, clearDetections } from './detections';
import { installSsaiWatcher } from './ssai-watcher';
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
installSsaiWatcher();

/* ── Badge ── */

async function updateBadge(): Promise<void> {
  const settings = await loadSettings();
  if (!settings.enabled) {
    await chrome.action.setBadgeText({ text: '' });
    return;
  }
  // A real ad detection takes priority — surface it as a red alert so the user
  // notices Kick has started serving ads, regardless of the showBadge setting.
  if (await detectionCount() > 0) {
    await chrome.action.setBadgeText({ text: '!' });
    await chrome.action.setBadgeBackgroundColor({ color: '#ff4444' });
    return;
  }
  if (!settings.showBadge) {
    await chrome.action.setBadgeText({ text: '' });
    return;
  }
  const stats = await getStats();
  const total = stats.networkBlocked + stats.domHidden + stats.videoAdsBlocked;
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
    case 'stats.videoAdBlocked': {
      await addVideoAdBlocked(msg.payload.count);
      await updateBadge();
      return { type: 'ack' };
    }
    case 'detection.add': {
      // A real ad was served and neutralized — record forensics and count it.
      await addDetection(msg.payload);
      await addVideoAdBlocked(1);
      log.warn('Ad detected:', msg.payload.kind, msg.payload.summary);
      if (msg.payload.kind === 'manifest' || msg.payload.kind === 'video') {
        const stats = await getStats();
        await chrome.action.setBadgeText({ text: String(stats.videoAdsBlocked) });
        await chrome.action.setBadgeBackgroundColor({ color: '#53fc18' });
      } else {
        await updateBadge();
      }
      return { type: 'ack' };
    }
    case 'detection.list': {
      return { type: 'detections', payload: await listDetections() };
    }
    case 'detection.clear': {
      await clearDetections();
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
