(function () {
  'use strict';

  if (window.__kab_stubbed) return;
  window.__kab_stubbed = true;

  var noop = function () {};
  var noopReturn = function (v) { return function () { return v; }; };
  var noopThis = function () { return this; };

  // googletag stub
  var slot = {
    addService: noopThis, clearCategoryExclusions: noopThis,
    clearTargeting: noopThis, defineSizeMapping: noopThis,
    get: noopReturn(null), getAdUnitPath: noopReturn(''),
    getAttributeKeys: noopReturn([]), getCategoryExclusions: noopReturn([]),
    getDomId: noopReturn(''), getName: noopReturn(''),
    getResponseInformation: noopReturn(null), getSlotElementId: noopReturn(''),
    getTargeting: noopReturn([]), getTargetingKeys: noopReturn([]),
    set: noopThis, setCategoryExclusion: noopThis, setClickUrl: noopThis,
    setCollapseEmptyDiv: noopThis, setForceSafeFrame: noopThis,
    setSafeFrameConfig: noopThis, setTargeting: noopThis,
    updateTargetingFromMap: noopThis,
  };

  var pubads = {
    addEventListener: noop, clearCategoryExclusions: noopThis,
    clearTargeting: noopThis, collapseEmptyDivs: noop,
    disableInitialLoad: noop, display: noop,
    enableAsyncRendering: noop, enableLazyLoad: noop,
    enableSingleRequest: noop, enableVideoAds: noop,
    get: noopReturn(null), getAttributeKeys: noopReturn([]),
    getSlots: noopReturn([]), getTargeting: noopReturn([]),
    getTargetingKeys: noopReturn([]), isInitialLoadDisabled: noopReturn(false),
    refresh: noop, set: noopThis, setCategoryExclusion: noopThis,
    setCentering: noop, setForceSafeFrame: noop, setLocation: noop,
    setPrivacySettings: noopThis, setPublisherProvidedId: noop,
    setRequestNonPersonalizedAds: noop, setSafeFrameConfig: noop,
    setTargeting: noopThis, setVideoContent: noop, updateCorrelator: noop,
  };

  var companionAds = {
    addEventListener: noop, enableSyncLoading: noop,
    setRefreshUnfilledSlots: noop,
  };

  var sizeMappingBuilder = {
    addSize: noopThis, build: noopReturn(null),
  };

  var gt = {
    apiReady: true, pubadsReady: true,
    cmd: [],
    companionAds: noopReturn(companionAds),
    content: noopReturn({}),
    defineOutOfPageSlot: noopReturn(slot),
    defineSlot: noopReturn(slot),
    destroySlots: noop, disablePublisherConsole: noop,
    display: noop, enableServices: noop,
    getVersion: noopReturn(''), openConsole: noop,
    pubads: noopReturn(pubads), setAdIframeTitle: noop,
    setConfig: noop, sizeMapping: noopReturn(sizeMappingBuilder),
  };

  gt.cmd = new Proxy(gt.cmd, {
    set: function (target, prop, value) {
      if (prop === 'length') { target.length = value; return true; }
      target[prop] = value;
      if (typeof value === 'function') {
        try { value(); } catch (e) { /* swallow */ }
      }
      return true;
    },
  });

  Object.defineProperty(window, 'googletag', {
    value: gt, writable: false, configurable: false,
  });

  // Google IMA SDK stub
  var ima = {
    AdDisplayContainer: function () { this.initialize = noop; this.destroy = noop; },
    AdError: function () {},
    AdErrorEvent: { Type: { AD_ERROR: 'adError' } },
    AdEvent: { Type: {
      AD_BREAK_READY: 'adBreakReady', ALL_ADS_COMPLETED: 'allAdsCompleted',
      CLICK: 'click', COMPLETE: 'complete',
      CONTENT_PAUSE_REQUESTED: 'contentPauseRequested',
      CONTENT_RESUME_REQUESTED: 'contentResumeRequested',
      FIRST_QUARTILE: 'firstQuartile', IMPRESSION: 'impression',
      LOADED: 'loaded', LOG: 'log', MIDPOINT: 'midpoint',
      PAUSED: 'paused', RESUMED: 'resumed', SKIPPED: 'skipped',
      STARTED: 'started', THIRD_QUARTILE: 'thirdQuartile',
      VOLUME_CHANGED: 'volumeChanged',
    }},
    AdsLoader: function () {
      this.addEventListener = noop; this.removeEventListener = noop;
      this.requestAds = noop; this.destroy = noop;
      this.getSettings = noopReturn({}); this.contentComplete = noop;
    },
    AdsManagerLoadedEvent: { Type: { ADS_MANAGER_LOADED: 'adsManagerLoaded' } },
    AdsRenderingSettings: function () {},
    AdsRequest: function () {},
    ImaSdkSettings: function () {
      this.setAutoPlayAdBreaks = noop; this.setCompanionBackfill = noop;
      this.setLocale = noop; this.setNumRedirects = noop;
      this.setPlayerType = noop; this.setPlayerVersion = noop;
      this.setVpaidMode = noop;
    },
    ViewMode: { NORMAL: 'normal', FULLSCREEN: 'fullscreen' },
    VERSION: '0.0.0-kab-stub',
  };

  var g = window.google || {};
  g.ima = ima;
  Object.defineProperty(window, 'google', {
    value: g, writable: false, configurable: false,
  });

  window.dispatchEvent(new CustomEvent('kab-stub-ready'));
})();
