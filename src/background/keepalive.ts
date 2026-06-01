import { KEEPALIVE_INTERVAL_SEC } from '~/shared/constants';

const ALARM = 'kab.keepalive';

export function installKeepalive(): void {
  void chrome.alarms.create(ALARM, {
    periodInMinutes: KEEPALIVE_INTERVAL_SEC / 60,
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== ALARM) return;
    void chrome.storage.session.set({ 'kab.lastAlarm': Date.now() }).catch(() => undefined);
  });
}
