/**
 * Injects a "Report Ad" flag button into the Kick page,
 * to the LEFT of the viewer count.
 */
const REPO = 'Pkkls/kick-ad-blocker';
const BTN_ID = 'kab-report-btn';
const VC_SELECTOR = '[data-testid="viewer-count"]';

function createButton(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.id = BTN_ID;
  btn.type = 'button';
  btn.title = 'Report an ad to Kick Ad Blocker';
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
    <line x1="4" y1="22" x2="4" y2="15"/></svg>`;

  btn.style.cssText = `
    display:inline-flex;align-items:center;justify-content:center;
    background:transparent;border:none;color:#6b7888;
    cursor:pointer;padding:4px;border-radius:4px;
    margin-right:8px;flex-shrink:0;transition:color .15s,background .15s;
  `;

  btn.onmouseenter = () => { btn.style.color = '#ff4444'; btn.style.background = 'rgba(255,68,68,.1)'; };
  btn.onmouseleave = () => { btn.style.color = '#6b7888'; btn.style.background = 'transparent'; };

  btn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const channel = location.pathname.replace(/^\//, '').split('/')[0] || 'unknown';
    const title = encodeURIComponent(`Ad report: ${channel}`);
    const body = encodeURIComponent(
      `## Ad Report\n\n**Channel:** ${channel}\n**URL:** ${location.href}\n**Time:** ${new Date().toISOString()}\n\n### What I saw\n_Describe the ad (pre-roll, banner, overlay):_\n\n---\n_Kick Ad Blocker_`,
    );
    window.open(`https://github.com/${REPO}/issues/new?title=${title}&body=${body}&labels=ad-report`, '_blank');
  };

  return btn;
}

function tryInject(): boolean {
  if (document.getElementById(BTN_ID)) return true;
  const vc = document.querySelector(VC_SELECTOR);
  if (!vc?.parentElement) return false;
  vc.parentElement.insertBefore(createButton(), vc);
  console.log('[KAB] Report button injected');
  return true;
}

export function mountReportButton(): void {
  console.log('[KAB] mountReportButton called, vc exists:', !!document.querySelector(VC_SELECTOR));
  if (tryInject()) return;

  let attempts = 0;
  const poll = setInterval(() => {
    if (tryInject() || ++attempts >= 30) {
      clearInterval(poll);
      if (attempts >= 30) console.warn('[KAB] Report button: gave up after 30 attempts');
    }
  }, 2_000);
}

export function unmountReportButton(): void {
  document.getElementById(BTN_ID)?.remove();
}
