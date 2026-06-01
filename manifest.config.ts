import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json' with { type: 'json' };

const isFirefox = process.env.BROWSER === 'firefox';

export default defineManifest({
  manifest_version: 3,
  name: 'Kick Ad Blocker',
  short_name: 'KAB',
  version: pkg.version,
  description: pkg.description,
  icons: {
    16: 'public/icons/icon16.png',
    32: 'public/icons/icon32.png',
    48: 'public/icons/icon48.png',
    128: 'public/icons/icon128.png',
  },
  action: {
    default_popup: 'src/popup/index.html',
    default_icon: {
      16: 'public/icons/icon16.png',
      32: 'public/icons/icon32.png',
    },
    default_title: 'Kick Ad Blocker',
  },
  options_ui: {
    page: 'src/options/index.html',
    open_in_tab: true,
  },
  background: isFirefox
    ? ({ scripts: ['src/background/index.ts'], type: 'module' } as unknown as { service_worker: string })
    : { service_worker: 'src/background/index.ts', type: 'module' },
  content_scripts: [
    {
      matches: ['https://kick.com/*', 'https://www.kick.com/*'],
      js: ['src/content/index.ts'],
      run_at: 'document_start',
      all_frames: false,
    },
  ],
  permissions: [
    'storage',
    'alarms',
    'declarativeNetRequest',
  ],
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'",
  },
  host_permissions: [
    'https://kick.com/*',
    'https://www.kick.com/*',
  ],
  declarative_net_request: {
    rule_resources: [
      {
        id: 'ad_rules',
        enabled: true,
        path: 'rules/ad-domains.json',
      },
    ],
  },
  web_accessible_resources: [
    {
      resources: ['googletag-stub.js'],
      matches: ['https://kick.com/*', 'https://www.kick.com/*'],
    },
  ],
  ...(isFirefox && {
    browser_specific_settings: {
      gecko: {
        id: 'kick-ad-blocker@pkkls.dev',
        strict_min_version: '109.0',
        data_collection_permissions: { required: ['none'] },
      },
    },
  }),
} as Parameters<typeof defineManifest>[0]);
