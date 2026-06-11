import type { BlockStats } from './types';
import type { Settings } from './settings';

export interface AdReport {
  url: string;
  channel: string;
  timestamp: string;
  fingerprint: string[];
  adDomains: string[];
  adElements: string[];
  playerTech: string;
  extensionVersion: string;
}

export type RuntimeMessage =
  | { type: 'settings.get' }
  | { type: 'settings.set'; payload: Partial<Settings> }
  | { type: 'settings.reset' }
  | { type: 'stats.get' }
  | { type: 'stats.reset' }
  | { type: 'stats.domBlocked'; payload: { count: number } }
  | { type: 'stats.videoAdBlocked'; payload: { count: number } }
  | { type: 'fingerprint.changed'; payload: { changes: string[] } }
  | { type: 'fingerprint.get' }
  | { type: 'report.capture' }
  | { type: 'open.options' }
  | { type: 'ping' };

export type RuntimeResponse =
  | { type: 'settings'; payload: Settings }
  | { type: 'stats'; payload: BlockStats }
  | { type: 'fingerprint'; payload: { changes: string[]; lastCheck: number } }
  | { type: 'report'; payload: AdReport }
  | { type: 'ack' }
  | { type: 'error'; payload: { message: string } };

export function send(msg: RuntimeMessage): Promise<RuntimeResponse> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (res: RuntimeResponse | undefined) => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
        return;
      }
      if (!res) {
        reject(new Error('No response'));
        return;
      }
      resolve(res);
    });
  });
}

type HandlerResult = RuntimeResponse | void;

export function onMessage(
  handler: (
    msg: RuntimeMessage,
    sender: chrome.runtime.MessageSender,
  ) => Promise<HandlerResult> | HandlerResult,
): void {
  chrome.runtime.onMessage.addListener((msg: RuntimeMessage, sender, sendResponse) => {
    const result = handler(msg, sender);
    if (result instanceof Promise) {
      result
        .then((r) => {
          if (r) sendResponse(r);
        })
        .catch((err: unknown) =>
          sendResponse({
            type: 'error',
            payload: { message: err instanceof Error ? err.message : String(err) },
          } satisfies RuntimeResponse),
        );
      return true;
    }
    if (result) sendResponse(result);
    return false;
  });
}
