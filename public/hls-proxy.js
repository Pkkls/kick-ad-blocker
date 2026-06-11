(function () {
  if (window.__kab_hls_proxy) return;
  window.__kab_hls_proxy = true;

  // Kick streams via Amazon IVS. The /api/v1/stream/{uuid}/playback response
  // carries the server-side ad control flags. When Kick enables ads on a
  // category these flip to true and the IVS player initialises the ad SDK and
  // plays a preroll. We force them back off — the stream URL is untouched, no
  // ad SDK (IMA / PAL) ever initialises, so no preroll is ever requested.
  var PLAYBACK_RE = /\/api\/v\d+\/stream\/[0-9a-f-]+\/playback/i;

  function neutralizeAds(json) {
    if (!json || typeof json !== 'object') return false;
    var changed = false;
    var vp = json.video_player;
    if (vp) {
      ['google_ads_sdk', 'pal_sdk'].forEach(function (k) {
        var sdk = vp[k];
        if (sdk) {
          if (sdk.initiate_sdk) { sdk.initiate_sdk = false; changed = true; }
          if (sdk.sdk_available) { sdk.sdk_available = false; changed = true; }
        }
      });
    }
    var vs = json.video_session;
    if (vs && vs.auto_ads_enabled) { vs.auto_ads_enabled = false; changed = true; }
    return changed;
  }

  function signalBlocked() {
    try { window.postMessage({ source: 'kab', type: 'playbackAdBlocked' }, '*'); } catch (e) {}
  }

  // Remove SCTE-35 ad blocks from an HLS media playlist (secondary defence for
  // any manifest fetched on the main thread). Acts only on explicit CUE-OUT/IN.
  function scrubHlsManifest(text) {
    if (text.indexOf('#EXT-X-CUE-OUT') === -1) return text;
    var lines = text.split('\n');
    var result = [];
    var skipping = false;
    var changed = false;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var trimmed = line.trim();
      if (!skipping && (trimmed === '#EXT-X-CUE-OUT' || trimmed.indexOf('#EXT-X-CUE-OUT:') === 0)) {
        skipping = true;
        changed = true;
        if (result.length > 0 && result[result.length - 1].trim() === '#EXT-X-DISCONTINUITY') {
          result.pop();
        }
        continue;
      }
      if (skipping) {
        if (trimmed === '#EXT-X-CUE-IN') skipping = false;
        continue;
      }
      result.push(line);
    }
    return changed ? result.join('\n') : text;
  }

  function rebuiltHeaders(response) {
    // Drop stale content-length; the body length changed after rewrite.
    var h = new Headers();
    try {
      response.headers.forEach(function (v, k) {
        if (k.toLowerCase() !== 'content-length') h.append(k, v);
      });
    } catch (e) { /* opaque headers — leave empty */ }
    return h;
  }

  // --- fetch wrapper (main thread) ---
  var origFetch = window.fetch;
  window.fetch = function (input, init) {
    return origFetch.call(this, input, init).then(function (response) {
      var url = response.url || (typeof input === 'string' ? input : (input && input.url) || '');

      if (PLAYBACK_RE.test(url)) {
        return response.clone().json().then(function (json) {
          if (!neutralizeAds(json)) return response;
          signalBlocked();
          return new Response(JSON.stringify(json), {
            status: response.status,
            statusText: response.statusText,
            headers: rebuiltHeaders(response),
          });
        }).catch(function () { return response; });
      }

      if (url.indexOf('.m3u8') !== -1) {
        return response.clone().text().then(function (text) {
          var scrubbed = scrubHlsManifest(text);
          if (scrubbed === text) return response;
          signalBlocked();
          return new Response(scrubbed, {
            status: response.status,
            statusText: response.statusText,
            headers: rebuiltHeaders(response),
          });
        }).catch(function () { return response; });
      }

      return response;
    });
  };

  // --- XHR wrapper (main thread) ---
  var origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__kab_url = typeof url === 'string' ? url : String(url);
    return origOpen.apply(this, arguments);
  };

  var origRespText = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, 'responseText');
  Object.defineProperty(XMLHttpRequest.prototype, 'responseText', {
    get: function () {
      var orig = origRespText && origRespText.get ? origRespText.get.call(this) : '';
      var u = this.__kab_url || '';
      if (PLAYBACK_RE.test(u)) {
        try {
          var json = JSON.parse(orig);
          if (neutralizeAds(json)) { signalBlocked(); return JSON.stringify(json); }
        } catch (e) { /* not JSON yet */ }
        return orig;
      }
      if (u.indexOf('.m3u8') !== -1) {
        var scrubbed = scrubHlsManifest(orig);
        if (scrubbed !== orig) signalBlocked();
        return scrubbed;
      }
      return orig;
    },
    configurable: true,
  });
})();
