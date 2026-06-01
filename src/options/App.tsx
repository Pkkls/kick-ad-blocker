import { useState, useEffect, useCallback } from 'preact/hooks';
import { send } from '~/shared/messages';
import type { Settings } from '~/shared/settings';

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label class="flex items-center justify-between py-2">
      <span class="text-sm">{label}</span>
      <button
        onClick={onChange}
        class={`relative w-10 h-5 rounded-full transition-colors ${
          checked ? 'bg-kick-primary' : 'bg-kick-border'
        }`}
      >
        <span
          class={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </label>
  );
}

export function App() {
  const [settings, setSettings] = useState<Settings | null>(null);

  const refresh = useCallback(async () => {
    const res = await send({ type: 'settings.get' });
    if (res.type === 'settings') setSettings(res.payload);
  }, []);

  useEffect(() => { refresh().catch(() => {}); }, [refresh]);

  const patch = async (p: Partial<Settings>) => {
    const res = await send({ type: 'settings.set', payload: p });
    if (res.type === 'settings') setSettings(res.payload);
  };

  const reset = async () => {
    const res = await send({ type: 'settings.reset' });
    if (res.type === 'settings') setSettings(res.payload);
  };

  if (!settings) return <div class="p-8 text-kick-muted">Loading...</div>;

  return (
    <div class="max-w-lg mx-auto p-8 space-y-6">
      <h1 class="text-2xl font-bold flex items-center gap-2">
        <svg class="w-7 h-7 text-kick-primary" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z" />
        </svg>
        Kick Ad Blocker
      </h1>

      {/* General */}
      <section class="bg-kick-surface rounded-lg p-4 space-y-1">
        <h2 class="font-semibold text-sm text-kick-muted uppercase tracking-wide mb-2">General</h2>
        <Toggle checked={settings.enabled} onChange={() => patch({ enabled: !settings.enabled })} label="Enable ad blocking" />
        <Toggle checked={settings.showBadge} onChange={() => patch({ showBadge: !settings.showBadge })} label="Show badge count" />
        <Toggle checked={settings.debug} onChange={() => patch({ debug: !settings.debug })} label="Debug logging" />
      </section>

      {/* Layers */}
      <section class="bg-kick-surface rounded-lg p-4 space-y-1">
        <h2 class="font-semibold text-sm text-kick-muted uppercase tracking-wide mb-2">Blocking Layers</h2>
        <Toggle checked={settings.blockNetwork} onChange={() => patch({ blockNetwork: !settings.blockNetwork })} label="Network blocking (declarativeNetRequest)" />
        <Toggle checked={settings.blockDom} onChange={() => patch({ blockDom: !settings.blockDom })} label="DOM ad cleanup (MutationObserver)" />
      </section>

      {/* Optional blocks */}
      <section class="bg-kick-surface rounded-lg p-4 space-y-1">
        <h2 class="font-semibold text-sm text-kick-muted uppercase tracking-wide mb-2">Optional Blocking</h2>
        <Toggle checked={settings.blockGtm} onChange={() => patch({ blockGtm: !settings.blockGtm })} label="Google Tag Manager" />
        <Toggle checked={settings.blockAnalytics} onChange={() => patch({ blockAnalytics: !settings.blockAnalytics })} label="Mux Analytics (litix.io)" />
        <Toggle checked={settings.blockDatadog} onChange={() => patch({ blockDatadog: !settings.blockDatadog })} label="Datadog RUM" />
      </section>

      {/* Reset */}
      <div class="flex justify-end">
        <button
          onClick={reset}
          class="text-sm text-kick-muted hover:text-red-400 transition-colors"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
