/**
 * googletag stub — injected into MAIN world at document_start.
 *
 * Creates a fake `window.googletag` that silently swallows all GPT calls.
 * This prevents errors when gpt.js is blocked by declarativeNetRequest,
 * and also prevents ads if gpt.js somehow loads before the block kicks in.
 *
 * Also stubs `google.ima` (IMA SDK) to block video pre-roll ads.
 */
(function () {
  'use strict';

  // Skip if already stubbed
  if ((window as any).__kab_stubbed) return;
  (window as any).__kab_stubbed = true;

  const noop = () => {};
  const noopReturn = (v: any) => () => v;
  const noopThis = function (this: any) { return this; };

  // ── googletag stub ──

  const slot = {
    addService: noopThis,
    clearCategoryExclusions: noopThis,
    clearTargeting: noopThis,
    defineSizeMapping: noopThis,
    get: noopReturn(null),
    getAdUnitPath: noopReturn(''),
    getAttributeKeys: noopReturn([]),
    getCategoryExclusions: noopReturn([]),
    getDomId: noopReturn(''),
    getName: noopReturn(''),
    getResponseInformation: noopReturn(null),
    getSlotElementId: noopReturn(''),
    getTargeting: noopReturn([]),
    getTargetingKeys: noopReturn([]),
    set: noopThis,
    setCategoryExclusion: noopThis,
    setClickUrl: noopThis,
    setCollapseEmptyDiv: noopThis,
    setForceSafeFrame: noopThis,
    setSafeFrameConfig: noopThis,
    setTargeting: noopThis,
    updateTargetingFromMap: noopThis,
  };

  const pubads = {
    addEventListener: noop,
    clearCategoryExclusions: noopThis,
    clearTargeting: noopThis,
    collapseEmptyDivs: noop,
    disableInitialLoad: noop,
    display: noop,
    enableAsyncRendering: noop,
    enableLazyLoad: noop,
    enableSingleRequest: noop,
    enableVideoAds: noop,
    get: noopReturn(null),
    getAttributeKeys: noopReturn([]),
    getSlots: noopReturn([]),
    getTargeting: noopReturn([]),
    getTargetingKeys: noopReturn([]),
    isInitialLoadDisabled: noopReturn(false),
    refresh: noop,
    set: noopThis,
    setCategoryExclusion: noopThis,
    setCentering: noop,
    setForceSafeFrame: noop,
    setLocation: noop,
    setPrivacySettings: noopThis,
    setPublisherProvidedId: noop,
    setRequestNonPersonalizedAds: noop,
    setSafeFrameConfig: noop,
    setTargeting: noopThis,
    setVideoContent: noop,
    updateCorrelator: noop,
  };

  const companionAds = {
    addEventListener: noop,
    enableSyncLoading: noop,
    setRefreshUnfilledSlots: noop,
  };

  const sizeMappingBuilder = {
    addSize: noopThis,
    build: noopReturn(null),
  };

  const gt = {
    apiReady: true,
    pubadsReady: true,
    cmd: [] as Array<() => void>,
    companionAds: noopReturn(companionAds),
    content: noopReturn({}),
    defineOutOfPageSlot: noopReturn(slot),
    defineSlot: noopReturn(slot),
    destroySlots: noop,
    disablePublisherConsole: noop,
    display: noop,
    enableServices: noop,
    getVersion: noopReturn(''),
    openConsole: noop,
    pubads: noopReturn(pubads),
    setAdIframeTitle: noop,
    setConfig: noop,
    sizeMapping: noopReturn(sizeMappingBuilder),
  };

  // Process queued commands immediately
  const processCmd = () => {
    while (gt.cmd.length) {
      try { gt.cmd.shift()!(); } catch { /* swallow */ }
    }
  };

  // Proxy cmd.push to auto-execute
  gt.cmd = new Proxy(gt.cmd, {
    set(target, prop, value) {
      if (prop === 'length') {
        target.length = value as number;
        return true;
      }
      target[prop as any] = value;
      if (typeof value === 'function') {
        try { (value as () => void)(); } catch { /* swallow */ }
      }
      return true;
    },
  });

  // Freeze to prevent gpt.js from overwriting our stub
  Object.defineProperty(window, 'googletag', {
    value: gt,
    writable: false,
    configurable: false,
  });

  // ── Google IMA SDK stub ──

  const AdError = class {
    getErrorCode() { return 0; }
    getInnerError() { return null; }
    getMessage() { return ''; }
    getType() { return ''; }
    getVastErrorCode() { return 0; }
    toString() { return ''; }
  };

  const ima = {
    AdDisplayContainer: class { initialize() {} destroy() {} },
    AdError,
    AdErrorEvent: { Type: { AD_ERROR: 'adError' } },
    AdEvent: {
      Type: {
        AD_BREAK_READY: 'adBreakReady',
        AD_METADATA: 'adMetadata',
        ALL_ADS_COMPLETED: 'allAdsCompleted',
        CLICK: 'click',
        COMPLETE: 'complete',
        CONTENT_PAUSE_REQUESTED: 'contentPauseRequested',
        CONTENT_RESUME_REQUESTED: 'contentResumeRequested',
        FIRST_QUARTILE: 'firstQuartile',
        IMPRESSION: 'impression',
        LOADED: 'loaded',
        LOG: 'log',
        MIDPOINT: 'midpoint',
        PAUSED: 'paused',
        RESUMED: 'resumed',
        SKIPPED: 'skipped',
        STARTED: 'started',
        THIRD_QUARTILE: 'thirdQuartile',
        USER_CLOSE: 'userClose',
        VOLUME_CHANGED: 'volumeChanged',
      },
    },
    AdsLoader: class {
      addEventListener() {}
      removeEventListener() {}
      requestAds() {}
      destroy() {}
      getSettings() { return {}; }
      contentComplete() {}
    },
    AdsManager: class {},
    AdsManagerLoadedEvent: { Type: { ADS_MANAGER_LOADED: 'adsManagerLoaded' } },
    AdsRenderingSettings: class {},
    AdsRequest: class {},
    CompanionAdSelectionSettings: class {},
    ImaSdkSettings: class {
      setAutoPlayAdBreaks() {}
      setCompanionBackfill() {}
      setDisableCustomPlaybackForIOS10Plus() {}
      setLocale() {}
      setNumRedirects() {}
      setPlayerType() {}
      setPlayerVersion() {}
      setVpaidMode() {}
      getCompanionBackfill() { return ''; }
      getDisableCustomPlaybackForIOS10Plus() { return false; }
      getLocale() { return ''; }
      getNumRedirects() { return 0; }
      getPlayerType() { return ''; }
      getPlayerVersion() { return ''; }
    },
    OmidAccessMode: {},
    UiElements: {},
    ViewMode: { NORMAL: 'normal', FULLSCREEN: 'fullscreen' },
    VERSION: '0.0.0-kab-stub',
    settings: new (class {
      setAutoPlayAdBreaks() {}
      setCompanionBackfill() {}
      setLocale() {}
      setNumRedirects() {}
      setVpaidMode() {}
    })(),
  };

  // Ensure google.ima is our stub
  const g = (window as any).google || {};
  g.ima = ima;
  Object.defineProperty(window, 'google', {
    value: g,
    writable: false,
    configurable: false,
  });

  // Signal to content script that stub is active
  window.dispatchEvent(new CustomEvent('kab-stub-ready'));
})();
