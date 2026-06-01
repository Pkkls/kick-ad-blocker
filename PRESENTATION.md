Hey! I built a lightweight ad blocker for Kick.com and I'm looking for testers.

**Kick Ad Blocker** -- open-source browser extension (Chrome, Brave, Edge, Firefox) that blocks pre-roll and overlay ads on Kick streams.

### Background

Kick currently serves ads through Google Publisher Tags (GPT) and Google IMA SDK. The ad infrastructure is live on every stream page -- `gpt.js` loads, `googletag` initializes, IMA SDK is ready to fire. The system is wired up but ads don't seem to roll consistently yet.

I spent 6+ hours testing on top casino streamers (Roshtein, Sliker, Classybeef, etc.) and did not encounter a single ad during that session. However, there's a catch: the Slots & Casino category is geo-blocked in Europe, so I had to use a VPN to access those streams. The VPN may have affected ad targeting and delivery, meaning ads could be rolling for users in the US or other regions where casino content is natively accessible.

The ad delivery architecture has been fully mapped regardless:
- **Player**: Amazon IVS 1.52.0 (WASM Worker, MediaSourceHandle)
- **Ad system**: Google Publisher Tags (client-side, not server-side ad insertion)
- **Ad domains**: `securepubads.g.doubleclick.net`, `imasdk.googleapis.com`, `kickproduction.api.useinsider.com`, and others

The extension is built to block this architecture preemptively, so when Kick rolls ads more broadly -- including on IRL, Just Chatting, or other categories -- the blocker is already in place.

### How it works

Three blocking layers running simultaneously:

1. **Network blocking** (`declarativeNetRequest`) -- blocks 10 ad-serving and tracking domains at the browser level before requests are made. Targets Google GPT, DoubleClick, IMA SDK, Google Syndication, Insider, and more.

2. **Script stubs** (MAIN world, `document_start`) -- injects fake `window.googletag` and `window.google.ima` objects frozen with `Object.defineProperty`. These stubs silently swallow all GPT and IMA SDK calls, so ads never initialize even if the scripts load from browser cache.

3. **DOM cleanup** (`MutationObserver`) -- watches for ad-related DOM elements (GPT containers, IMA overlays, ad iframes) and hides them instantly. Safety net in case a new delivery method bypasses the first two layers.

### Privacy

This extension collects zero personal data.

- No tracking, no telemetry, no analytics, no user identifiers
- Nothing leaves your browser. No external requests are made by the extension
- The only external interaction is a user-initiated "Report Ad" button that opens a GitHub issue. A confirmation dialog shows exactly what will be shared (channel name and clean URL only -- no query parameters, no personal data)
- Permissions are minimal and scoped to kick.com only: `storage` (settings), `alarms` (service worker keepalive), `declarativeNetRequest` (ad blocking)
- Explicit Content Security Policy set in manifest
- Independently audited for security, GDPR compliance, and supply chain risks. Zero critical or warning-level issues

Full source code available for review.

### Install

**From source:**
```
git clone https://github.com/Pkkls/kick-ad-blocker.git
cd kick-ad-blocker
npm install
npm run build
```
Then load `dist/` as unpacked extension:
- Chrome/Brave/Edge: `chrome://extensions` -> Developer mode -> Load unpacked
- Firefox: `about:debugging#/runtime/this-firefox` -> Load Temporary Add-on -> select `manifest.json`

### Report an ad

If an ad gets through, there's a small flag icon next to the viewer count on every stream page. Click it to report -- it captures diagnostic info and opens a pre-filled GitHub issue so the gap can be patched.

This is where I need help the most. Since I couldn't trigger ads myself (VPN + geo-block), I need users in regions where Kick ads are active to confirm whether the blocker works or to report ads that slip through.

### Links

- **GitHub**: https://github.com/Pkkls/kick-ad-blocker
- **License**: MIT
- **Tech stack**: TypeScript, Vite, Preact, Tailwind, MV3
