(function () {
  if (window.__kab_hls_proxy) return;
  window.__kab_hls_proxy = true;

  // Kick streams via Amazon IVS. The /api/v1/stream/{uuid}/playback response
  // carries the server-side ad control flags. When Kick enables ads on a
  // category these flip to true and the IVS player initialises the ad SDK and
  // plays a preroll. We force them off (the stream URL is untouched, no ad SDK
  // ever initialises) AND record a redacted detection so the real ad rollout
  // can be analysed the moment it happens.
  var PLAYBACK_RE = /\/api\/v\d+\/stream\/[0-9a-f-]+\/playback/i;

  function report(kind, summary, data) {
    try {
      window.postMessage({ source: 'kab', type: 'adDetected', kind: kind, summary: summary, data: data }, '*');
    } catch (e) { /* ignore */ }
  }

  // Mutate ad flags off; return the list of flags that were enabled (empty = none).
  function detectAndNeutralize(json) {
    if (!json || typeof json !== 'object') return [];
    var enabled = [];
    var vp = json.video_player;
    if (vp) {
      ['google_ads_sdk', 'pal_sdk'].forEach(function (k) {
        var sdk = vp[k];
        if (sdk) {
          if (sdk.initiate_sdk) { enabled.push(k + '.initiate_sdk'); sdk.initiate_sdk = false; }
          if (sdk.sdk_available) { enabled.push(k + '.sdk_available'); sdk.sdk_available = false; }
        }
      });
    }
    var vs = json.video_session;
    if (vs && vs.auto_ads_enabled) { enabled.push('auto_ads_enabled'); vs.auto_ads_enabled = false; }
    return enabled;
  }

  function handlePlayback(json) {
    var enabled = detectAndNeutralize(json);
    if (!enabled.length) return false;
    var vp = json.video_player || {};
    report('playback', 'Kick enabled ads: ' + enabled.join(', '), {
      flagsEnabled: enabled,
      player: vp.player ? { name: vp.player.player_name, software: vp.player.player_software } : null,
      hasLiveUrl: !!(json.playback_url && json.playback_url.live),
    });
    return true;
  }

  function redactLine(line) {
    // Strip query strings (tokens) and cap length.
    return line.replace(/\?[^\s]*/g, '?<redacted>').slice(0, 120);
  }

  // Remove SCTE-35 ad blocks from a main-thread HLS playlist; return both the
  // scrubbed text and a redacted sample of what was removed (null if nothing).
  function scrubHlsManifest(text) {
    if (text.indexOf('#EXT-X-CUE-OUT') === -1) return { text: text, removed: null };
    var lines = text.split('\n');
    var result = [];
    var removed = [];
    var skipping = false;
    var changed = false;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var trimmed = line.trim();
      if (!skipping && (trimmed === '#EXT-X-CUE-OUT' || trimmed.indexOf('#EXT-X-CUE-OUT:') === 0)) {
        skipping = true;
        changed = true;
        if (result.length > 0 && result[result.length - 1].trim() === '#EXT-X-DISCONTINUITY') result.pop();
        if (removed.length < 25) removed.push(redactLine(trimmed));
        continue;
      }
      if (skipping) {
        if (removed.length < 25 && trimmed) removed.push(redactLine(trimmed));
        if (trimmed === '#EXT-X-CUE-IN') skipping = false;
        continue;
      }
      result.push(line);
    }
    return { text: changed ? result.join('\n') : text, removed: changed ? removed : null };
  }

  function rebuiltHeaders(response) {
    var h = new Headers();
    try {
      response.headers.forEach(function (v, k) {
        if (k.toLowerCase() !== 'content-length') h.append(k, v);
      });
    } catch (e) { /* opaque */ }
    return h;
  }

  var origFetch = window.fetch;

  // --- SSAI ad-break monitor ---
  // Kick uses Amazon IVS server-side ad insertion: the preroll/midroll is
  // stitched into the HLS stream the worker plays, invisible to a main-thread
  // proxy (and not gated by the playback ad flags). We can't see the worker's
  // fetches, but we CAN fetch the same IVS media playlist ourselves and watch
  // for ad markers — recording the exact format the moment an ad is stitched.
  var KNOWN_DATERANGE_CLASSES = ['timestamp', 'live-video-net-stream-source'];
  var monitorLive = null;
  var monitorGen = 0;
  var monitorSeen = {};

  function adMarkersIn(text) {
    var hits = [];
    var lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var t = lines[i].trim();
      if (t.indexOf('#EXT-X-CUE-OUT') === 0 || t.indexOf('#EXT-X-CUE-IN') === 0 ||
          t.indexOf('#EXT-X-SCTE35') === 0 || t.indexOf('#EXT-OATCLS-SCTE35') === 0 ||
          t.indexOf('#EXT-X-ASSET') === 0 || t === '#EXT-X-DISCONTINUITY') {
        hits.push(t);
      } else if (t.indexOf('#EXT-X-DATERANGE') === 0) {
        var m = t.match(/CLASS="([^"]*)"/);
        if (KNOWN_DATERANGE_CLASSES.indexOf(m ? m[1] : '') === -1) hits.push(t);
      }
    }
    return hits;
  }

  function pollMedia(mediaUrl, gen, left) {
    if (gen !== monitorGen || left <= 0) return;
    var delay = document.visibilityState === 'hidden' ? 6000 : 3000;
    origFetch(mediaUrl).then(function (r) { return r.text(); }).then(function (txt) {
      var hits = adMarkersIn(txt);
      if (hits.length) {
        // Collapse volatile timestamps/epochs so the same ad break dedups to one report.
        var key = hits.join('|').replace(/\d{4}-\d\d-\d\dT[0-9:.Z+-]+/g, '<t>').replace(/\d{9,}/g, '<n>').slice(0, 250);
        if (!monitorSeen[key]) {
          monitorSeen[key] = 1;
          report('manifest', 'SSAI ad markers in IVS playlist (' + hits.length + ')',
            { markers: hits.map(redactLine).slice(0, 20) });
        }
      }
    }).catch(function () {}).then(function () {
      setTimeout(function () { pollMedia(mediaUrl, gen, left - 1); }, delay);
    });
  }

  function startMonitor(liveUrl) {
    if (!liveUrl || liveUrl === monitorLive) return;
    monitorLive = liveUrl;
    monitorSeen = {};
    var gen = ++monitorGen;
    origFetch(liveUrl).then(function (r) { return r.text(); }).then(function (master) {
      if (gen !== monitorGen) return;
      var mediaLine = master.split('\n').find(function (l) { return l.trim() && l.trim()[0] !== '#'; });
      if (!mediaLine) return;
      var mediaUrl;
      try { mediaUrl = new URL(mediaLine.trim(), liveUrl).href; } catch (e) { return; }
      pollMedia(mediaUrl, gen, 200); // ~10 min at 3s
    }).catch(function () {});
  }

  // --- fetch wrapper (main thread) ---
  window.fetch = function (input, init) {
    return origFetch.call(this, input, init).then(function (response) {
      var url = response.url || (typeof input === 'string' ? input : (input && input.url) || '');

      if (PLAYBACK_RE.test(url)) {
        return response.clone().json().then(function (json) {
          if (json.playback_url && json.playback_url.live) startMonitor(json.playback_url.live);
          if (!handlePlayback(json)) return response;
          return new Response(JSON.stringify(json), {
            status: response.status,
            statusText: response.statusText,
            headers: rebuiltHeaders(response),
          });
        }).catch(function () { return response; });
      }

      if (url.indexOf('.m3u8') !== -1) {
        return response.clone().text().then(function (text) {
          var r = scrubHlsManifest(text);
          if (!r.removed) return response;
          report('manifest', 'SCTE-35 ad break removed from playlist', { sample: r.removed });
          return new Response(r.text, {
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
          if (json.playback_url && json.playback_url.live) startMonitor(json.playback_url.live);
          if (handlePlayback(json)) return JSON.stringify(json);
        } catch (e) { /* not JSON yet */ }
        return orig;
      }
      if (u.indexOf('.m3u8') !== -1) {
        var r = scrubHlsManifest(orig);
        if (r.removed) report('manifest', 'SCTE-35 ad break removed from playlist', { sample: r.removed });
        return r.text;
      }
      return orig;
    },
    configurable: true,
  });
})();
