(function () {
  if (window.__kab_hls_proxy) return;
  window.__kab_hls_proxy = true;

  // Remove SCTE-35 ad blocks from an HLS media playlist.
  // Only acts on explicit ad signalling (CUE-OUT/CUE-IN). Returns the original
  // string unchanged when nothing was removed, so callers can skip rebuilding.
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
        // Drop the DISCONTINUITY that opens the ad break (last emitted line).
        if (result.length > 0 && result[result.length - 1].trim() === '#EXT-X-DISCONTINUITY') {
          result.pop();
        }
        continue;
      }

      if (skipping) {
        if (trimmed === '#EXT-X-CUE-IN') {
          skipping = false;
        }
        continue;
      }

      result.push(line);
    }

    return changed ? result.join('\n') : text;
  }

  // --- fetch wrapper (main thread) ---
  var origFetch = window.fetch;
  window.fetch = function (input, init) {
    return origFetch.call(this, input, init).then(function (response) {
      var url = response.url || (typeof input === 'string' ? input : '');
      if (url.indexOf('.m3u8') === -1) return response;
      return response.text().then(function (text) {
        var scrubbed = scrubHlsManifest(text);
        if (scrubbed === text) {
          return new Response(text, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
        }
        return new Response(scrubbed, {
          status: response.status,
          statusText: response.statusText,
        });
      });
    });
  };

  // --- XHR wrapper (main thread) ---
  var origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__kab_url = typeof url === 'string' ? url : String(url);
    return origOpen.apply(this, arguments);
  };

  var origResponseTextDesc = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, 'responseText');
  Object.defineProperty(XMLHttpRequest.prototype, 'responseText', {
    get: function () {
      var orig = origResponseTextDesc && origResponseTextDesc.get
        ? origResponseTextDesc.get.call(this)
        : '';
      if (this.__kab_url && this.__kab_url.indexOf('.m3u8') !== -1) {
        return scrubHlsManifest(orig);
      }
      return orig;
    },
    configurable: true,
  });
})();
