/**
 * Ad-tech fingerprinting — detects changes in Kick's ad delivery system.
 *
 * Runs periodically and compares the current ad-tech stack against
 * a known baseline. When something changes (new ad SDK, new domains,
 * new player version), it reports to the background worker which
 * can notify the user via badge/popup.
 *
 * This is the "early warning" system — if Kick changes their ad tech,
 * we know about it before users start seeing ads again.
 */
import { rootLogger } from '~/shared/logger';

const log = rootLogger.child('fingerprint');

/** Known ad-tech baseline — updated each time we confirm the stack. */
export interface AdTechFingerprint {
  /** IVS player version (e.g. "1.52.0") */
  ivsVersion: string | null;
  /** Is googletag (GPT) present? */
  hasGpt: boolean;
  /** Is Google IMA SDK present (non-stub)? */
  hasIma: boolean;
  /** Ad-related domains contacted */
  adDomains: string[];
  /** Unknown ad-related scripts (new SDKs we haven't seen) */
  unknownAdScripts: string[];
  /** Player technology (MediaSourceHandle, MediaSource, HLS, etc.) */
  playerTech: string;
  /** Timestamp */
  ts: number;
}

/** Domains we expect and already handle */
const KNOWN_AD_DOMAINS = new Set([
  'securepubads.g.doubleclick.net',
  'pagead2.googlesyndication.com',
  'googleadservices.com',
  'tpc.googlesyndication.com',
  'imasdk.googleapis.com',
  'ad.doubleclick.net',
  'cm.g.doubleclick.net',
  'kickproduction.api.useinsider.com',
  'adservice.google.com',
  'www.googletagmanager.com',
]);

/** Domains that are NOT ad-related (stream, assets, chat, etc.) */
const SAFE_DOMAINS = new Set([
  'kick.com',
  'web.kick.com',
  'files.kick.com',
  'assets.kick.com',
  'flags.kick.com',
  'websockets.kick.com',
  'cdn.jsdelivr.net',
  'js.stripe.com',
  'www.datadoghq-browser-agent.com',
]);

/** Patterns that suggest a resource is ad-related */
const AD_PATTERNS = [
  /ad[sv]?[_.-]?(server|manager|tag|loader|sdk)/i,
  /prebid/i,
  /vast/i,
  /vpaid/i,
  /ima[_.-]?sdk/i,
  /sponsor/i,
  /doubleclick/i,
  /googlesyndication/i,
  /adswizz/i,
  /adform/i,
  /criteo/i,
  /taboola/i,
  /outbrain/i,
  /amazon-adsystem/i,
  /moat/i,
  /adnxs/i,
];

export function captureFingerprint(): AdTechFingerprint {
  const fp: AdTechFingerprint = {
    ivsVersion: null,
    hasGpt: false,
    hasIma: false,
    adDomains: [],
    unknownAdScripts: [],
    playerTech: 'unknown',
    ts: Date.now(),
  };

  // 1. IVS version
  const ivsEntry = performance.getEntriesByType('resource')
    .find(e => e.name.includes('amazon-ivs'));
  if (ivsEntry) {
    const match = ivsEntry.name.match(/ivs\/([0-9.]+)\//);
    fp.ivsVersion = match?.[1] ?? 'unknown';
  }

  // 2. GPT presence (real, not our stub)
  const w = window as any;
  fp.hasGpt = !!(w.googletag && !w.__kab_stubbed);

  // 3. IMA presence (real, not our stub)
  fp.hasIma = !!(w.google?.ima && w.google.ima.VERSION !== '0.0.0-kab-stub');

  // 4. Player tech
  const video = document.querySelector('video');
  if (video) {
    const srcObj = video.srcObject;
    if (srcObj?.constructor?.name === 'MediaSourceHandle') {
      fp.playerTech = 'MediaSourceHandle (Worker)';
    } else if (srcObj?.constructor?.name === 'MediaStream') {
      fp.playerTech = 'MediaStream (WebRTC)';
    } else if (srcObj?.constructor?.name === 'MediaSource') {
      fp.playerTech = 'MediaSource (MSE)';
    } else if (video.src) {
      fp.playerTech = video.src.includes('.m3u8') ? 'HLS (native)' : 'Direct URL';
    }
  }

  // 5. Scan all loaded resources for ad domains
  const seen = new Set<string>();
  for (const entry of performance.getEntriesByType('resource')) {
    let hostname: string;
    try { hostname = new URL(entry.name).hostname; } catch { continue; }

    if (SAFE_DOMAINS.has(hostname)) continue;
    // Check for litix subdomain pattern
    if (hostname.endsWith('.litix.io')) continue;

    if (KNOWN_AD_DOMAINS.has(hostname)) {
      if (!seen.has(hostname)) {
        fp.adDomains.push(hostname);
        seen.add(hostname);
      }
      continue;
    }

    // Check for unknown ad-related resources
    const url = entry.name;
    for (const pattern of AD_PATTERNS) {
      if (pattern.test(url) && !seen.has(hostname)) {
        fp.unknownAdScripts.push(`${hostname}: ${new URL(url).pathname.slice(0, 80)}`);
        seen.add(hostname);
        break;
      }
    }
  }

  return fp;
}

/** Compare current fingerprint against baseline, return list of changes. */
export function diffFingerprint(
  baseline: AdTechFingerprint,
  current: AdTechFingerprint,
): string[] {
  const changes: string[] = [];

  if (baseline.ivsVersion !== current.ivsVersion) {
    changes.push(`IVS player: ${baseline.ivsVersion} -> ${current.ivsVersion}`);
  }
  if (baseline.playerTech !== current.playerTech) {
    changes.push(`Player tech: ${baseline.playerTech} -> ${current.playerTech}`);
  }
  if (!baseline.hasIma && current.hasIma) {
    changes.push('Google IMA SDK detected (was not present before)');
  }
  if (current.unknownAdScripts.length > 0) {
    changes.push(`New ad scripts: ${current.unknownAdScripts.join(', ')}`);
  }

  // Check for new ad domains we haven't seen
  const baselineDomains = new Set(baseline.adDomains);
  for (const d of current.adDomains) {
    if (!baselineDomains.has(d)) {
      changes.push(`New ad domain: ${d}`);
    }
  }

  return changes;
}

/** Current known baseline from our diagnostic (2026-06-01). */
export const BASELINE: AdTechFingerprint = {
  ivsVersion: '1.52.0',
  hasGpt: false, // false because our stub takes over
  hasIma: false, // false because our stub takes over
  adDomains: [
    'securepubads.g.doubleclick.net',
    'kickproduction.api.useinsider.com',
  ],
  unknownAdScripts: [],
  playerTech: 'MediaSourceHandle (Worker)',
  ts: 1748736000000, // 2026-06-01
};

/** Run fingerprint check and log changes. */
export function checkForChanges(): string[] {
  const current = captureFingerprint();
  const changes = diffFingerprint(BASELINE, current);

  if (changes.length > 0) {
    log.warn('Ad-tech changes detected:', changes);
  } else {
    log.debug('Fingerprint matches baseline — no changes');
  }

  return changes;
}
