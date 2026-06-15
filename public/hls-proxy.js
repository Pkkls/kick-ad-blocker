(function () {
  if (window.__kab_hls_proxy) return;
  window.__kab_hls_proxy = true;

  var PLAYBACK_RE = /\/api\/v\d+\/stream\/[0-9a-f-]+\/playback/i;
  var seenBreakIds = new Set();

  function report(kind, summary, data) {
    try {
      window.postMessage({ source: 'kab', type: 'adDetected', kind: kind, summary: summary, data: data }, '*');
    } catch (e) { /* ignore */ }
  }

  function emitSkip(breakId, duration, rollType) {
    try {
      window.postMessage({ source: 'kab', type: 'ssai.skip', breakId: breakId, duration: duration, rollType: rollType }, '*');
    } catch (e) { /* ignore */ }
  }

  function reportAndSkip(meta, removed) {
    var m = meta || {};
    report('manifest', m.rollType + ' ' + m.duration + 's scrubbed', {
      sample: removed, duration: m.duration, rollType: m.rollType, breakId: m.breakId,
    });
    if (m.breakId && !seenBreakIds.has(m.breakId)) {
      seenBreakIds.add(m.breakId);
      emitSkip(m.breakId, m.duration, m.rollType);
    }
  }

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
    return line.replace(/\?[^\s]*/g, '?<redacted>').slice(0, 200);
  }

  function parseSsaiMeta(lines) {
    var dur = 0;
    var rollType = '';
    var breakId = '';
    for (var i = 0; i < lines.length; i++) {
      var m;
      if (!dur) {
        m = lines[i].match(/^#EXT-X-CUE-OUT:DURATION=([\d.]+)/);
        if (m) dur = parseFloat(m[1]);
      }
      if (!dur) {
        m = lines[i].match(/DURATION=([\d.]+)/);
        if (m) dur = parseFloat(m[1]);
      }
      if (!dur) {
        m = lines[i].match(/stitched-ad-\w+-\d+-(\d+)/);
        if (m) { var ns = parseInt(m[1], 10); if (ns > 0 && ns < 300e9) dur = ns / 1e9; }
      }
      if (!rollType) {
        m = lines[i].match(/AD-ROLL-TYPE="([^"]*)"/);
        if (m) rollType = m[1];
      }
      if (!breakId) {
        m = lines[i].match(/AD-BREAK-ID="([^"]*)"/);
        if (m) breakId = m[1];
      }
    }
    return { duration: dur || 30, rollType: rollType || 'unknown', breakId: breakId };
  }

  function scrubHlsManifest(text) {
    if (text.indexOf('#EXT-X-CUE-OUT') === -1 && text.indexOf('stitched-ad') === -1) {
      return { text: text, removed: null };
    }
    var lines = text.split('\n');
    var result = [];
    var removed = [];
    var skipping = false;
    var changed = false;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var trimmed = line.trim();
      if (!skipping) {
        if (trimmed === '#EXT-X-CUE-OUT' || trimmed.indexOf('#EXT-X-CUE-OUT:') === 0) {
          skipping = 'cue';
          changed = true;
          if (result.length > 0 && result[result.length - 1].trim() === '#EXT-X-DISCONTINUITY') result.pop();
          if (removed.length < 25) removed.push(redactLine(trimmed));
          continue;
        }
        if (trimmed.indexOf('#EXT-X-DATERANGE') === 0 && trimmed.indexOf('stitched-ad-break-start') !== -1) {
          skipping = 'ssai';
          changed = true;
          if (result.length > 0 && result[result.length - 1].trim() === '#EXT-X-DISCONTINUITY') result.pop();
          if (removed.length < 25) removed.push(redactLine(trimmed));
          continue;
        }
        result.push(line);
      } else {
        if (removed.length < 25 && trimmed) removed.push(redactLine(trimmed));
        if (skipping === 'cue' && trimmed === '#EXT-X-CUE-IN') {
          skipping = false;
        } else if (skipping === 'ssai' && trimmed.indexOf('stitched-ad-break-end') !== -1) {
          if (i + 1 < lines.length && lines[i + 1].trim() === '#EXT-X-DISCONTINUITY') {
            if (removed.length < 25) removed.push('#EXT-X-DISCONTINUITY');
            i++;
          }
          skipping = false;
        }
      }
    }
    if (!changed) return { text: text, removed: null };
    var meta = parseSsaiMeta(removed);
    return { text: result.join('\n'), removed: removed, meta: meta };
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

  window.fetch = function (input, init) {
    return origFetch.call(this, input, init).then(function (response) {
      var url = response.url || (typeof input === 'string' ? input : (input && input.url) || '');

      if (PLAYBACK_RE.test(url)) {
        return response.clone().json().then(function (json) {
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
          reportAndSkip(r.meta, r.removed);
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

  var origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__kab_url = typeof url === 'string' ? url : String(url);
    this.__kab_scrubbed = null;
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
          if (handlePlayback(json)) return JSON.stringify(json);
        } catch (e) { /* not JSON yet */ }
        return orig;
      }
      if (u.indexOf('.m3u8') !== -1) {
        // Return cached scrub result if we already processed this response body.
        // The player may read responseText multiple times (progressive readyState
        // updates), but we must only scrub+report once per distinct body.
        if (this.__kab_scrubbed !== null && this.__kab_scrubbed.orig === orig) {
          return this.__kab_scrubbed.text;
        }
        var r = scrubHlsManifest(orig);
        if (r.removed) {
          reportAndSkip(r.meta, r.removed);
        }
        this.__kab_scrubbed = { orig: orig, text: r.text };
        return r.text;
      }
      return orig;
    },
    configurable: true,
  });
})();