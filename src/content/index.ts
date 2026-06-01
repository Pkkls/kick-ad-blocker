import { DomAdCleaner } from './dom-cleaner';
import { loadSettings, watchSettings } from '~/shared/settings';
import { send } from '~/shared/messages';
import { rootLogger } from '~/shared/logger';

const log = rootLogger.child('content');

/* ── MAIN world stub injection ── */

function injectStub(): void {
  try {
    const script = document.createElement('script');
    // In Chrome: use web_accessible_resources URL.
    // In Firefox: inline the stub (no MAIN world support in manifest).
    const url = chrome.runtime.getURL('googletag-stub.js');
    script.src = url;
    script.onload = () => script.remove();
    script.onerror = () => {
      // Fallback: inline injection for Firefox or if resource URL fails
      log.warn('Resource URL injection failed, using inline fallback');
      const inlineScript = document.createElement('script');
      inlineScript.textContent = getInlineStub();
      (document.head || document.documentElement).appendChild(inlineScript);
      inlineScript.remove();
    };
    (document.head || document.documentElement).appendChild(script);
    log.debug('googletag stub injected');
  } catch (err) {
    log.error('Failed to inject stub:', err);
  }
}

function getInlineStub(): string {
  // Minimal inline stub if resource URL fails
  return `(function(){
    if(window.__kab_stubbed)return;window.__kab_stubbed=true;
    var n=function(){},r=function(v){return function(){return v}},t=function(){return this};
    var s={addService:t,defineSizeMapping:t,setTargeting:t,setCollapseEmptyDiv:t,
      getSlotElementId:r(''),getAdUnitPath:r('')};
    var p={addEventListener:n,enableSingleRequest:n,enableVideoAds:n,
      collapseEmptyDivs:n,refresh:n,getSlots:r([]),setTargeting:t,
      disableInitialLoad:n,enableAsyncRendering:n,enableLazyLoad:n,display:n};
    var g={apiReady:true,pubadsReady:true,cmd:[],pubads:r(p),
      defineSlot:r(s),enableServices:n,display:n,destroySlots:n,
      companionAds:r({addEventListener:n}),sizeMapping:r({addSize:t,build:r(null)}),
      setConfig:n,setAdIframeTitle:n,disablePublisherConsole:n};
    g.cmd=new Proxy(g.cmd,{set:function(t,p,v){t[p]=v;
      if(typeof v==='function')try{v()}catch(e){}return true}});
    Object.defineProperty(window,'googletag',{value:g,writable:false,configurable:false});
    var ima={AdDisplayContainer:function(){this.initialize=n;this.destroy=n},
      AdsLoader:function(){this.addEventListener=n;this.requestAds=n;this.destroy=n;this.contentComplete=n},
      AdsRenderingSettings:function(){},AdsRequest:function(){},
      AdErrorEvent:{Type:{AD_ERROR:'adError'}},
      AdEvent:{Type:{ALL_ADS_COMPLETED:'allAdsCompleted',CONTENT_PAUSE_REQUESTED:'contentPauseRequested',
        CONTENT_RESUME_REQUESTED:'contentResumeRequested',LOADED:'loaded',STARTED:'started',
        COMPLETE:'complete',SKIPPED:'skipped'}},
      AdsManagerLoadedEvent:{Type:{ADS_MANAGER_LOADED:'adsManagerLoaded'}},
      ViewMode:{NORMAL:'normal',FULLSCREEN:'fullscreen'},VERSION:'0.0.0-kab'};
    var gg=window.google||{};gg.ima=ima;
    Object.defineProperty(window,'google',{value:gg,writable:false,configurable:false});
    window.dispatchEvent(new CustomEvent('kab-stub-ready'));
  })();`;
}

/* ── DOM cleaner ── */

let cleaner: DomAdCleaner | null = null;

function startCleaner(): void {
  if (cleaner) return;
  cleaner = new DomAdCleaner((count) => {
    // Relay DOM block stats to background
    send({ type: 'stats.domBlocked', payload: { count } }).catch(() => {});
  });
  cleaner.start();
}

function stopCleaner(): void {
  cleaner?.stop();
  cleaner = null;
}

/* ── Bootstrap ── */

async function main(): Promise<void> {
  const settings = await loadSettings();
  log.setEnabled(settings.debug);

  if (!settings.enabled) {
    log.info('Extension disabled');
    return;
  }

  // Inject googletag stub ASAP (MAIN world)
  injectStub();

  // Start DOM cleaner
  if (settings.blockDom) {
    // Wait for body to be available
    if (document.body) {
      startCleaner();
    } else {
      document.addEventListener('DOMContentLoaded', () => startCleaner(), { once: true });
    }
  }

  // Watch for settings changes
  watchSettings((next) => {
    log.setEnabled(next.debug);
    if (!next.enabled) {
      stopCleaner();
      return;
    }
    if (next.blockDom && !cleaner) startCleaner();
    if (!next.blockDom && cleaner) stopCleaner();
  });

  log.info('Kick Ad Blocker active');
}

main().catch((err) => log.error('Init failed:', err));
