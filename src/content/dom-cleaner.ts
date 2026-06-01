import { AD_SELECTOR_ALL, isAdElement } from './selectors';
import { rootLogger } from '~/shared/logger';

const log = rootLogger.child('dom');
const MARKER = 'data-kab-hidden';

export class DomAdCleaner {
  private observer: MutationObserver | null = null;
  private hiddenCount = 0;
  private onBlock: (count: number) => void;

  constructor(onBlock: (count: number) => void) {
    this.onBlock = onBlock;
  }

  start(): void {
    // Initial sweep
    this.sweep(document);

    // Watch for new ad elements
    this.observer = new MutationObserver((mutations) => {
      let found = 0;
      for (const mut of mutations) {
        for (const node of mut.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (isAdElement(node) && this.hideElement(node)) found++;
          // Also check children
          try {
            const children = node.querySelectorAll(AD_SELECTOR_ALL);
            for (const child of children) {
              if (child instanceof HTMLElement && this.hideElement(child)) found++;
            }
          } catch { /* invalid selector edge case */ }
        }
      }
      if (found > 0) {
        this.onBlock(found);
      }
    });

    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    log.debug('DOM cleaner started');
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
    log.debug('DOM cleaner stopped');
  }

  get stats(): number {
    return this.hiddenCount;
  }

  private sweep(root: ParentNode): void {
    let found = 0;
    try {
      const elements = root.querySelectorAll(AD_SELECTOR_ALL);
      for (const el of elements) {
        if (el instanceof HTMLElement && this.hideElement(el)) found++;
      }
    } catch { /* ignore */ }
    if (found > 0) {
      log.info(`Initial sweep: hid ${found} ad elements`);
      this.onBlock(found);
    }
  }

  private hideElement(el: HTMLElement): boolean {
    if (el.hasAttribute(MARKER)) return false; // already hidden
    el.setAttribute(MARKER, '1');
    el.style.setProperty('display', 'none', 'important');
    el.style.setProperty('visibility', 'hidden', 'important');
    el.style.setProperty('pointer-events', 'none', 'important');
    el.style.setProperty('height', '0', 'important');
    el.style.setProperty('overflow', 'hidden', 'important');
    this.hiddenCount++;
    log.debug('Hidden ad element:', el.tagName, el.id || el.className);
    return true;
  }
}
