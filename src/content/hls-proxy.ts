// Injected into MAIN world — no imports possible, all code must be self-contained inline.
const HLS_PROXY_SCRIPT = /* js */`
(function () {
  if (window.__kab_hls_proxy) return;
  window.__kab_hls_proxy = true;

  function scrubHlsManifest(text) {
    // Only process if there are discontinuities at all
    if (!text.includes('#EXT-X-DISCONTINUITY')) return text;

    var hasAdMarker = (
      text.includes('#EXT-X-CUE-OUT') ||
      text.includes('SCTE35') ||
      text.includes('#EXT-X-DATERANGE')
    );

    // Also detect short segments inside a discontinuity block
    if (!hasAdMarker) {
      var inDisc = false;
      var lines = text.split('\\n');
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line === '#EXT-X-DISCONTINUITY') { inDisc = true; continue; }
        if (inDisc && line.startsWith('#EXTINF:')) {
          var dur = parseFloat(line.slice(8));
          if (!isNaN(dur) && dur < 4) { hasAdMarker = true; break; }
        }
        if (inDisc && (line === '' || line.startsWith('#EXT-X-DISCONTINUITY')) && !line.startsWith('#EXTINF:')) {
          inDisc = false;
        }
      }
    }

    if (!hasAdMarker) return text;

    // Remove ad blocks: from CUE-OUT or first DISCONTINUITY of the pair to CUE-IN or next DISCONTINUITY
    var result = [];
    var lines = text.split('\\n');
    var skipping = false;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var trimmed = line.trim();

      if (!skipping && (trimmed === '#EXT-X-CUE-OUT' || trimmed.startsWith('#EXT-X-CUE-OUT:'))) {
        skipping = true;
        // Also drop the DISCONTINUITY that precedes CUE-OUT (last emitted line)
        if (result.length > 0 && result[result.length - 1].trim() === '#EXT-X-DISCONTINUITY') {
          result.pop();
        }
        continue;
      }

      // DISCONTINUITY without a preceding CUE-OUT — start of an ad block detected by short segments
      if (!skipping && trimmed === '#EXT-X-DISCONTINUITY' && hasAdMarker) {
        // Peek ahead: if next EXTINF is < 4s, skip this block
        for (var j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          var peek = lines[j].trim();
          if (peek.startsWith('#EXTINF:')) {
            var peekDur = parseFloat(peek.slice(8));
            if (!isNaN(peekDur) && peekDur < 4) {
              skipping = true;
              break;
            } else {
              break;
            }
          }
        }
        if (skipping) continue;
      }

      if (skipping) {
        if (trimmed === '#EXT-X-CUE-IN' || trimmed === '#EXT-X-DISCONTINUITY') {
          skipping = false;
          // Keep the closing DISCONTINUITY (signals stream resume to player)
          if (trimmed === '#EXT-X-DISCONTINUITY') result.push(line);
        }
        continue;
      }

      result.push(line);
    }

    return result.join('\\n');
  }

  // --- fetch wrapper ---
  var origFetch = window.fetch;
  window.fetch = function (input, init) {
    return origFetch.call(this, input, init).then(function (response) {
      var url = response.url || (typeof input === 'string' ? input : '');
      if (!url.includes('.m3u8')) return response;
      return response.text().then(function (text) {
        var scrubbed = scrubHlsManifest(text);
        return new Response(scrubbed, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      });
    });
  };

  // --- XHR wrapper ---
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
      if (this.__kab_url && this.__kab_url.includes('.m3u8')) {
        return scrubHlsManifest(orig);
      }
      return orig;
    },
    configurable: true,
  });

  // --- Worker wrapper ---
  // Kick streams via MediaSourceHandle (Worker-based MSE). We wrap the Worker
  // constructor to prepend our fetch+XHR patch into every spawned worker so
  // HLS manifests fetched inside the worker are scrubbed before the player sees them.
  var OrigWorker = window.Worker;
  window.Worker = function KabWorker(scriptUrl, opts) {
    var isModule = opts && opts.type === 'module';
    // For module workers we cannot use importScripts — fall back to original.
    if (isModule) {
      return new OrigWorker(scriptUrl, opts);
    }
    // Build a blob worker that patches fetch/XHR then loads the original script.
    var patchCode = '(' + scrubHlsManifest.toString() + ');\n' +
      'var _kf=self.fetch;self.fetch=function(i,o){return _kf.call(this,i,o).then(function(r){' +
      'var u=r.url||(typeof i==="string"?i:"");if(!u.includes(".m3u8"))return r;' +
      'return r.text().then(function(t){var s=scrubHlsManifest(t);' +
      'return new Response(s,{status:r.status,statusText:r.statusText,headers:r.headers});});});};' +
      'importScripts(' + JSON.stringify(scriptUrl) + ');';
    var blob = new Blob([patchCode], { type: 'application/javascript' });
    var blobUrl = URL.createObjectURL(blob);
    var worker = new OrigWorker(blobUrl, opts);
    // Release blob URL after worker starts
    setTimeout(function() { URL.revokeObjectURL(blobUrl); }, 5000);
    return worker;
  };
  window.Worker.prototype = OrigWorker.prototype;
})();
`;

export function injectHlsProxy(): void {
  if ((window as Window & { __kab_hls_proxy?: boolean }).__kab_hls_proxy) return;

  const script = document.createElement('script');
  script.textContent = HLS_PROXY_SCRIPT;
  (document.head || document.documentElement).appendChild(script);
  script.remove();
}
