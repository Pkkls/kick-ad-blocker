/* Minimal googletag + IMA stub — Firefox inline fallback.
   Mirrors public/googletag-stub.js but minified for inline injection. */
(function () {
  if (window.__kab_stubbed) return;
  window.__kab_stubbed = true;

  var n = function () {};
  var r = function (v) { return function () { return v; }; };
  var t = function () { return this; };

  var slot = { addService: t, defineSizeMapping: t, setTargeting: t,
    setCollapseEmptyDiv: t, getSlotElementId: r(''), getAdUnitPath: r('') };

  var pubads = { addEventListener: n, enableSingleRequest: n, enableVideoAds: n,
    collapseEmptyDivs: n, refresh: n, getSlots: r([]), setTargeting: t,
    disableInitialLoad: n, enableAsyncRendering: n, enableLazyLoad: n, display: n };

  var gt = { apiReady: true, pubadsReady: true, cmd: [], pubads: r(pubads),
    defineSlot: r(slot), enableServices: n, display: n, destroySlots: n,
    companionAds: r({ addEventListener: n }),
    sizeMapping: r({ addSize: t, build: r(null) }),
    setConfig: n, setAdIframeTitle: n, disablePublisherConsole: n };

  gt.cmd = new Proxy(gt.cmd, {
    set: function (target, prop, value) {
      target[prop] = value;
      if (typeof value === 'function') try { value(); } catch (e) {}
      return true;
    }
  });
  Object.defineProperty(window, 'googletag', { value: gt, writable: false, configurable: false });

  var ima = {
    AdDisplayContainer: function () { this.initialize = n; this.destroy = n; },
    AdsLoader: function () { this.addEventListener = n; this.requestAds = n; this.destroy = n; this.contentComplete = n; },
    AdsRenderingSettings: function () {}, AdsRequest: function () {},
    AdErrorEvent: { Type: { AD_ERROR: 'adError' } },
    AdEvent: { Type: { ALL_ADS_COMPLETED: 'allAdsCompleted', CONTENT_PAUSE_REQUESTED: 'contentPauseRequested',
      CONTENT_RESUME_REQUESTED: 'contentResumeRequested', LOADED: 'loaded', STARTED: 'started',
      COMPLETE: 'complete', SKIPPED: 'skipped' } },
    AdsManagerLoadedEvent: { Type: { ADS_MANAGER_LOADED: 'adsManagerLoaded' } },
    ViewMode: { NORMAL: 'normal', FULLSCREEN: 'fullscreen' }, VERSION: '0.0.0-kab'
  };
  var g = window.google || {};
  g.ima = ima;
  Object.defineProperty(window, 'google', { value: g, writable: false, configurable: false });
  window.dispatchEvent(new CustomEvent('kab-stub-ready'));
})();
