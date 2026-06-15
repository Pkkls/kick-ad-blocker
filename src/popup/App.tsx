import { useState, useEffect, useCallback } from 'preact/hooks';
import { send } from '~/shared/messages';
import type { Settings } from '~/shared/settings';
import type { BlockStats, AdDetection } from '~/shared/types';

export function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [stats, setStats] = useState<BlockStats | null>(null);
  const [fpChanges, setFpChanges] = useState<string[]>([]);
  const [detections, setDetections] = useState<AdDetection[]>([]);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    const [sRes, stRes, fpRes, dRes] = await Promise.all([
      send({ type: 'settings.get' }),
      send({ type: 'stats.get' }),
      send({ type: 'fingerprint.get' }),
      send({ type: 'detection.list' }),
    ]);
    if (sRes.type === 'settings') setSettings(sRes.payload);
    if (stRes.type === 'stats') setStats(stRes.payload);
    if (fpRes.type === 'fingerprint') setFpChanges(fpRes.payload.changes);
    if (dRes.type === 'detections') setDetections(dRes.payload);
  }, []);

  useEffect(() => { refresh().catch(() => {}); }, [refresh]);

  const toggle = async () => {
    if (!settings) return;
    const res = await send({ type: 'settings.set', payload: { enabled: !settings.enabled } });
    if (res.type === 'settings') setSettings(res.payload);
  };

  const copyDiagnostic = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(detections, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked */ }
  };

  const clearDetections = async () => {
    await send({ type: 'detection.clear' });
    setDetections([]);
  };

  const openOptions = () => { send({ type: 'open.options' }).catch(() => {}); };

  const total = stats ? stats.networkBlocked + stats.domHidden + stats.videoAdsBlocked : 0;

  return (
    <div class="p-4 space-y-3">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <svg class="w-6 h-6 text-kick-primary" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z" />
          </svg>
          <span class="font-bold text-lg">KAB</span>
          <span class="text-xs text-kick-muted">v{chrome.runtime.getManifest().version}</span>
        </div>
        <button
          onClick={toggle}
          class={`relative w-11 h-6 rounded-full transition-colors ${
            settings?.enabled ? 'bg-kick-primary' : 'bg-kick-border'
          }`}
        >
          <span
            class={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              settings?.enabled ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </div>

      {/* Stats */}
      {settings?.enabled && (
        <div class="bg-kick-surface rounded-lg p-4 text-center">
          <div class="text-3xl font-bold text-kick-primary">{total}</div>
          <div class="text-sm text-kick-muted mt-1">ads blocked today</div>
          {stats && (
            <div class="flex justify-center gap-4 mt-3 text-xs text-kick-muted">
              <span>{stats.networkBlocked} network</span>
              <span>{stats.domHidden} DOM</span>
              <span>{stats.videoAdsBlocked} video</span>
            </div>
          )}
        </div>
      )}

      {detections.length > 0 && (
        <div class="bg-red-900/30 border border-red-500/40 rounded-lg p-3 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-red-400">
              {detections.length} detection{detections.length > 1 ? 's' : ''}
            </span>
          </div>
          <div class="max-h-20 overflow-y-auto space-y-1">
            {detections.slice(0, 3).map((d, i) => (
              <div key={i} class="text-xs text-red-300">
                <span class="text-red-500">[{d.kind}]</span> {d.channel} — {d.summary}
              </div>
            ))}
          </div>
          <div class="flex gap-2">
            <button
              onClick={copyDiagnostic}
              class="flex-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded py-1 transition-colors"
            >
              {copied ? 'Copied' : 'Copy diagnostic'}
            </button>
            <button
              onClick={clearDetections}
              class="text-xs bg-kick-surface hover:bg-kick-border text-kick-muted rounded py-1 px-3 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Fingerprint alert */}
      {fpChanges.length > 0 && (
        <div class="bg-red-900/30 border border-red-500/40 rounded-lg p-3">
          <div class="text-xs font-bold text-red-400 mb-1">Ad-tech change detected</div>
          {fpChanges.map((c, i) => (
            <div key={i} class="text-xs text-red-300">{c}</div>
          ))}
        </div>
      )}

      {/* Disabled state */}
      {settings && !settings.enabled && (
        <div class="bg-kick-surface rounded-lg p-4 text-center text-kick-muted">
          Ad blocker disabled
        </div>
      )}

      {/* Footer */}
      <button
        onClick={openOptions}
        class="w-full text-center text-xs text-kick-muted hover:text-kick-text transition-colors py-1"
      >
        Options
      </button>
    </div>
  );
}
