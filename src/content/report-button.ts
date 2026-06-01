/**
 * Injects a "Report Ad" flag button into the Kick page,
 * to the LEFT of the viewer count.
 */
const REPO = 'Pkkls/kick-ad-blocker';
const BTN_ID = 'kab-report-btn';
const VC_SELECTOR = '[data-testid="viewer-count"]';

function createSvgIcon(): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');

  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z');
  const line = document.createElementNS(ns, 'line');
  line.setAttribute('x1', '4');
  line.setAttribute('y1', '22');
  line.setAttribute('x2', '4');
  line.setAttribute('y2', '15');

  svg.appendChild(path);
  svg.appendChild(line);
  return svg;
}

function createButton(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.id = BTN_ID;
  btn.type = 'button';
  btn.title = 'Report an ad to Kick Ad Blocker';
  btn.appendChild(createSvgIcon());

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
    // Strip query params to avoid leaking tracking data
    const cleanUrl = location.origin + location.pathname;

    const ok = confirm(
      `Report an ad on "${channel}"?\n\n` +
      `This will open a public GitHub issue with:\n` +
      `• Channel: ${channel}\n` +
      `• URL: ${cleanUrl}\n\n` +
      `No personal data is included.`,
    );
    if (!ok) return;

    const title = encodeURIComponent(`Ad report: ${channel}`);
    const body = encodeURIComponent(
      `## Ad Report\n\n**Channel:** ${channel}\n**URL:** ${cleanUrl}\n\n` +
      `### What I saw\n_Describe the ad (pre-roll, banner, overlay):_\n\n---\n_Kick Ad Blocker_`,
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
  return true;
}

export function mountReportButton(): void {
  if (tryInject()) return;

  let attempts = 0;
  const poll = setInterval(() => {
    if (tryInject() || ++attempts >= 30) clearInterval(poll);
  }, 2_000);
}

export function unmountReportButton(): void {
  document.getElementById(BTN_ID)?.remove();
}
