# Changelog

## [1.3.0] - 2026-06-15

### Fixed

- **MV3 service worker stability**: replaced `setTimeout` with `chrome.alarms` for badge reset after SSAI ad breaks — prevents badge staying stuck when the SW is suspended before the timeout fires
- **SSAI handler missing**: added `ssai.skip` case in the background `onMessage` switch; the message was previously silently dropped with no acknowledgement
- **XHR double-scrub**: added `__kab_scrubbed` cache on XHR instances so `scrubHlsManifest` only runs once per response; fixes duplicate `adDetected` postMessages when the IVS player reads `responseText` multiple times
- **`chrome.tabs.get` async**: migrated from callback form to promise-based API; detection could be silently dropped if the SW was suspended between `handledBreaks.set` and the callback

### Improved

- **SSAI postMessage typing**: replaced `(d as any)` casts in content script with a proper `MainWorldSsaiPayload` type covering `breakId`, `duration`, and `rollType`; `rollType` was always `undefined` at runtime, always falling back to `'midroll'`
- **`handledBreaks` eviction**: moved from O(n) scan on every ad-break event to lazy eviction at lookup time, reducing overhead with many open tabs
- **Duration fallback logging**: `parseSsaiMeta` now warns when it falls back to the 30 s default from segment-filename heuristic, making silent fallbacks observable
- **`chrome.tabs.get` errors**: removed silent `catch(() => {})` — detection errors now propagate for observability

### Removed

- **Dead `report.capture` type**: removed from `RuntimeMessage` discriminated union — no handler existed and no sender referenced it

### Notes

- `webRequest` permission on MV3 Chrome is observation-only (no blocking). A comment was added to `manifest.config.ts` to prevent contributor confusion.
- SSAI SW re-fetch (`fetch(details.url)` every 3 s) is a known duplicate-request risk; primary detection path remains the MAIN-world `hls-proxy.js` relay. See `ssai-watcher.ts` for context.

## [1.2.0] - previous

See git log.
