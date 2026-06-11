import { rootLogger } from '~/shared/logger';
import { AD_SELECTOR_ALL } from './selectors';
import { AD_MAX_DURATION_SEC, AD_VIDEO_SRC_PATTERNS, CATEGORY_URL_PATTERNS } from '~/shared/constants';

const log = rootLogger.child('video');

const AD_VIDEO_MARKER = 'data-kab-video-ad';

function isCategoryPage(): boolean {
  return CATEGORY_URL_PATTERNS.some((re) => re.test(location.href));
}

function isAdVideo(video: HTMLVideoElement): boolean {
  const src = video.src || video.currentSrc || '';

  if (src && AD_VIDEO_SRC_PATTERNS.some((re) => re.test(src))) return true;

  // Duration heuristic only on category/browse pages, and only for finite short
  // clips — live streams report Infinity/NaN and must never be skipped.
  if (isCategoryPage() && Number.isFinite(video.duration) && video.duration > 0 && video.duration < AD_MAX_DURATION_SEC) return true;

  // Parent element matches a known ad overlay selector
  try {
    const parent = video.closest(AD_SELECTOR_ALL);
    if (parent) return true;
  } catch { /* invalid selector edge case */ }

  return false;
}

export interface VideoAdDetail {
  src: string;
  duration: number;
}

export class VideoAdSkipper {
  private observer: MutationObserver | null = null;
  private skippedCount = 0;
  private onBlock: (detail: VideoAdDetail) => void;
  private attached = new WeakSet<HTMLVideoElement>();

  constructor(onBlock: (detail: VideoAdDetail) => void) {
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
    // loadedmetadata can fire repeatedly on src changes — count each ad once.
    if (video.hasAttribute(AD_VIDEO_MARKER)) return;
    if (!isAdVideo(video)) return;

    video.setAttribute(AD_VIDEO_MARKER, 'pending');
    const src = video.src || video.currentSrc || '';
    const duration = video.duration;
    log.info('Ad video detected, skipping', src);
    if (Number.isFinite(duration)) video.currentTime = duration;

    setTimeout(() => {
      // If the element is still in the DOM after the skip, hide it
      if (document.contains(video)) {
        video.style.setProperty('display', 'none', 'important');
        log.debug('Ad video element hidden after persist');
      }
      this.skippedCount++;
      this.onBlock({ src: src.replace(/\?[^\s]*/g, '?<redacted>').slice(0, 200), duration });
    }, 500);
  }
}
