import { addDetection } from './detections';
import { rootLogger } from '~/shared/logger';

const log = rootLogger.child('ssai-watcher');

const BADGE_RESET_ALARM_PREFIX = 'kab.ssai.badge-reset.';
const handledBreaks = new Map<string, number>();

export function parseSsai(text: string): { duration: number; rollType: string; breakId: string } | null {
  if (text.indexOf('stitched-ad-break-start') === -1) return null;
  let rollType = '';
  let breakId = '';
  let extinfSum = 0;
  let cueOutDur = 0;
  let inBreak = false;
  for (const line of text.split('\n')) {
    if (line.indexOf('stitched-ad-break-start') !== -1) {
      inBreak = true;
      const r = line.match(/AD-ROLL-TYPE="([^"]*)"/); if (r?.[1]) rollType = r[1];
      const b = line.match(/AD-BREAK-ID="([^"]*)"/); if (b?.[1]) breakId = b[1];
      const c = line.match(/PLANNED-DURATION=([\d.]+)/); if (c?.[1]) cueOutDur = parseFloat(c[1]);
      continue;
    }
    if (line.indexOf('#EXT-X-CUE-OUT') !== -1) {
      const c = line.match(/DURATION[=:]([\d.]+)/); if (c?.[1] && !cueOutDur) cueOutDur = parseFloat(c[1]);
    }
    if (inBreak && (line.indexOf('stitched-ad-break-end') !== -1 || line.indexOf('#EXT-X-CUE-IN') !== -1)) {
      inBreak = false;
      continue;
    }
    if (inBreak && line.startsWith('#EXTINF')) {
      const e = line.match(/#EXTINF:([\d.]+)/); if (e?.[1]) extinfSum += parseFloat(e[1]);
    }
  }
  let duration = extinfSum > 0 ? extinfSum : cueOutDur;
  if (duration <= 0) return null;
  if (duration < 1) duration = 1;
  if (duration > 180) duration = 180;
  duration = Math.round(duration * 10) / 10;
  return { duration, rollType: rollType || 'midroll', breakId };
}

// chrome.webRequest.onCompleted does NOT fire for in-page fetch()/XHR in Chrome
// MV3 service workers — requests made by the IVS player renderer never reach the
// SW network stack via that API. Detection is handled entirely in the MAIN world
// by hls-proxy.js, which posts a 'ssai.skip' window message → content script
// forwards it as a chrome.runtime.sendMessage('ssai.skip'). This watcher listens
// for that message to update the badge and record the forensic detection entry.
export function installSsaiWatcher(): void {
  chrome.runtime.onMessage.addListener((msg, sender) => {
    if (msg?.type !== 'ssai.skip') return;
    const tabId = sender.tab?.id;
    if (tabId === undefined || tabId < 0) return;

    const breakId: string = msg.payload?.breakId || '';
    const duration: number = msg.payload?.duration || 30;
    const rollType: string = msg.payload?.rollType || 'midroll';
    const now = Date.now();

    const bk = breakId || `t${tabId}-${rollType}-${Math.floor(now / 15000)}`;
    if (handledBreaks.has(bk)) return;
    handledBreaks.set(bk, now);

    // Evict stale break IDs to prevent unbounded growth.
    for (const [k, v] of handledBreaks) {
      if (now - v > 120_000) handledBreaks.delete(k);
    }

    log.info(`SSAI break detected: ${rollType} ${duration}s (breakId: ${bk})`);

    chrome.action.setBadgeText({ text: 'AD' }).catch(() => {});
    chrome.action.setBadgeBackgroundColor({ color: '#ff4444' }).catch(() => {});

    const alarmDelayMinutes = (duration + 2) / 60;
    chrome.alarms.create(`${BADGE_RESET_ALARM_PREFIX}${bk}`, {
      delayInMinutes: alarmDelayMinutes,
    });

    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) return;
      const channel = tab?.url
        ? new URL(tab.url).pathname.replace(/^\//, '').split('/')[0] || 'unknown'
        : 'unknown';
      addDetection({
        kind: 'manifest',
        ts: now,
        channel,
        summary: `${rollType} ${duration}s blocked`,
        data: { duration, rollType, breakId },
      }).catch(() => {});
    });
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (!alarm.name.startsWith(BADGE_RESET_ALARM_PREFIX)) return;
    chrome.storage.local.get(['kab.stats.v1'], (result) => {
      const stats = result['kab.stats.v1'] as { videoAdsBlocked?: number } | undefined;
      const count = stats?.videoAdsBlocked ?? 0;
      chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' }).catch(() => {});
      chrome.action.setBadgeBackgroundColor({ color: '#53fc18' }).catch(() => {});
    });
  });
}
