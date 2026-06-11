import { rootLogger } from '~/shared/logger';
import { AD_SELECTOR_ALL } from './selectors';

const log = rootLogger.child('video');

const AD_MAX_DURATION_SEC = 15;
const AD_VIDEO_MARKER = 'data-kab-video-ad';

const AD_SRC_PATTERNS: readonly RegExp[] = [
  /imasdk\.googleapis\.com/,
  /doubleclick\.net/,
  /googlesyndication\.com/,
  /googleadservices\.com/,
  /\bad[_-]?(video|slot|preroll|midroll)\b/i,
];

function isCategoryPage(): boolean {
  return /^\/categories(\/|$)|\/(browse|category)(\/|$)/.test(location.pathname);
}

function isAdVideo(video: HTMLVideoElement): boolean {
  const src = video.src || video.currentSrc || '';

  if (src && AD_SRC_PATTERNS.some((re) => re.test(src))) return true;

  // Duration heuristic only on category/browse pages to avoid false positives on stream pages
  if (isCategoryPage() && video.duration > 0 && video.duration < AD_MAX_DURATION_SEC) return true;

  // Parent element matches a known ad overlay selector
  try {
    const parent = video.closest(AD_SELECTOR_ALL);
    if (parent) return true;
  } catch { /* invalid selector edge case */ }

  return false;
}

export class VideoAdSkipper {
  private observer: MutationObserver | null = null;
  private skippedCount = 0;
  private onBlock: (count: number) => void;
  private attached = new WeakSet<HTMLVideoElement>();

  constructor(onBlock: (count: number) => void) {
    this.onBlock = onBlock;
  }

  start(): void {
    for (const video of document.querySelectorAll<HTMLVideoElement>('video')) {
      this.attach(video);
    }

    this.observer = new MutationObserver((mutations) => {
      for (const mut of mutations) {
        for (const node of mut.addedNodes) {
          if (node instanceof HTMLVideoElement) {
            this.attach(node);
          } else if (node instanceof HTMLElement) {
            for (const video of node.querySelectorAll<HTMLVideoElement>('video')) {
              this.attach(video);
            }
          }
        }
      }
    });

    this.observer.observe(document.documentElement, { childList: true, subtree: true });
    log.debug('Video ad skipper started');
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
    log.debug('Video ad skipper stopped');
  }

  get stats(): number {
    return this.skippedCount;
  }

  private attach(video: HTMLVideoElement): void {
    if (this.attached.has(video)) return;
    this.attached.add(video);

    video.addEventListener('loadedmetadata', () => this.handleLoaded(video), { once: false });
  }

  private handleLoaded(video: HTMLVideoElement): void {
    if (!isAdVideo(video)) return;

    log.info('Ad video detected, skipping', video.src || video.currentSrc);
    video.currentTime = video.duration;

    setTimeout(() => {
      // If the element is still in the DOM after the skip, hide it
      if (document.contains(video) && !video.hasAttribute(AD_VIDEO_MARKER)) {
        video.setAttribute(AD_VIDEO_MARKER, '1');
        video.style.setProperty('display', 'none', 'important');
        log.debug('Ad video element hidden after persist');
      }
      this.skippedCount++;
      this.onBlock(this.skippedCount);
    }, 500);
  }
}
