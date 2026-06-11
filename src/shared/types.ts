export interface BlockStats {
  networkBlocked: number;
  domHidden: number;
  videoAdsBlocked: number;
  sessionStart: number;
  todayKey: string; // YYYY-MM-DD
}

/** A captured ad-delivery event — forensic evidence recorded autonomously the
 *  first time Kick actually serves an ad, so the real format can be analysed. */
export interface AdDetection {
  /** playback = IVS ad flags were enabled; manifest = SCTE-35 ad break in a
   *  main-thread playlist; video = a client-side ad video was skipped. */
  kind: 'playback' | 'manifest' | 'video';
  ts: number;
  channel: string;
  /** Short human-readable summary shown in the popup. */
  summary: string;
  /** Redacted forensic payload (no tokens / URLs with query strings). */
  data: Record<string, unknown>;
}

export function emptyStats(): BlockStats {
  return {
    networkBlocked: 0,
    domHidden: 0,
    videoAdsBlocked: 0,
    sessionStart: Date.now(),
    todayKey: new Date().toISOString().slice(0, 10),
  };
}
