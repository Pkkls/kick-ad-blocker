export function injectHlsProxy(): void {
  // Guard in isolated world — MAIN world guard is inside hls-proxy.js itself.
  if ((window as Window & { __kab_hls_proxy?: boolean }).__kab_hls_proxy) return;

  // Load as extension file (not inline) so Kick's CSP header doesn't block it.
  // Same pattern as googletag-stub.js injection in injectStub().
  const script = document.createElement('script');
  const url = chrome.runtime.getURL('hls-proxy.js');
  script.src = url;
  script.onload = () => script.remove();
  script.onerror = () => {
    // eslint-disable-next-line no-console
    console.warn('[KAB] hls-proxy.js failed to load');
    script.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}
