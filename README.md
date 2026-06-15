# Kick Ad Blocker

Lightweight browser extension that blocks ads on [Kick.com](https://kick.com). Works on Chrome, Brave, Edge and Firefox.

Kick serves ads via Google Publisher Tags (GPT) and Google IMA SDK. This extension neutralizes both at the network and script level, so pre-roll and overlay ads never play.

## Install

### Chrome, Brave, or Edge — easiest method (no build required)

The `dist/` folder in this repo is the ready-to-load extension. You don't need to install Node.js or run any commands.

**Step 1 — Download the repo**

Click the green **Code** button on this page → **Download ZIP** → unzip it anywhere on your computer.

**Step 2 — Open the extensions page**

- Chrome: paste `chrome://extensions` in your address bar and press Enter
- Brave: paste `brave://extensions`
- Edge: paste `edge://extensions`

**Step 3 — Enable Developer mode**

In the top-right corner of the extensions page, toggle **Developer mode** ON. A new toolbar will appear.

**Step 4 — Load the extension**

Click **Load unpacked** → navigate to the folder you unzipped → open the `dist` folder inside it → click **Select Folder**.

That's it. A green shield icon will appear in your toolbar. Open any Kick stream — ads are blocked.

> **Important:** always select the `dist` folder, not the root folder of the repo. The root folder contains source code and has no `manifest.json` — Chrome will show an error if you load it.

---

### Firefox

1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Navigate into the unzipped folder → open `dist` → select `manifest.json`
4. Open any Kick stream — ads are blocked

> Note: Firefox temporary add-ons are removed when the browser closes. A permanent install requires the extension to be signed by Mozilla.

## Build from source

```bash
git clone https://github.com/Pkkls/kick-ad-blocker.git
cd kick-ad-blocker
npm install
npm run build        # Chrome / Brave / Edge
# npm run build:firefox  # Firefox
```

The built extension is in `dist/`. Load it as described above.

### Other commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev mode with HMR |
| `npm run typecheck` | TypeScript type check |
| `npm run test` | Run tests |
| `npm run icons` | Regenerate PNG icons from SVG |
| `npm run pack` | Package `dist/` into a zip |

## How it works

### Layer 1 — Network blocking (`declarativeNetRequest`)

Static rules block requests to ad-serving and tracking domains before they reach the page:

- `securepubads.g.doubleclick.net` (Google GPT)
- `pagead2.googlesyndication.com`
- `imasdk.googleapis.com` (Google IMA SDK)
- `googleadservices.com`, `adservice.google.com`
- `kickproduction.api.useinsider.com` (Insider marketing)
- and more — see [`rules/ad-domains.json`](rules/ad-domains.json)

### Layer 2 — Script stubs (MAIN world)

Even if a blocked script loads from browser cache, our stubs take priority. At `document_start`, we inject a script into the page's JS context that creates fake `window.googletag` and `window.google.ima` objects. These stubs silently swallow all GPT/IMA calls so ads never initialize.

The stubs are frozen with `Object.defineProperty({ writable: false })` — the real scripts cannot overwrite them.

### Layer 3 — DOM cleanup (`MutationObserver`)

A `MutationObserver` watches for ad-related DOM elements (GPT containers, IMA overlays, ad iframes) and hides them instantly. This is a safety net in case a new ad delivery method bypasses the first two layers.

### Fingerprinting (diagnostic tool)

`src/content/fingerprint.ts` can scan Kick's current ad-tech stack and compare it against a known baseline. This helps detect when Kick changes their ad system (new SDK, new domains, new player version). It does **not** run automatically — use it as a diagnostic tool when needed.

## Permissions

| Permission | Why |
|------------|-----|
| `storage` | Save settings and stats |
| `alarms` | Keep service worker alive |
| `declarativeNetRequest` | Block ad domains at the network level |
| `declarativeNetRequestFeedback` | Count blocked requests for the badge |
| Host: `kick.com` | Inject content script on Kick pages |

## Tech stack

- [Vite](https://vite.dev) + [@crxjs/vite-plugin](https://crxjs.dev) — MV3 extension bundling
- [Preact](https://preactjs.com) — popup and options UI (3 KB)
- [Tailwind CSS](https://tailwindcss.com) — styling
- [TypeScript](https://www.typescriptlang.org) — type safety
- [Zod](https://zod.dev) — settings validation

## License

[MIT](LICENSE)
