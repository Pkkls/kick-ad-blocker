import { describe, it, expect, afterEach, vi } from 'vitest';
import { startSsaiBlock, stopSsaiBlock } from './ssai-blocker';

// happy-dom has no layout engine, so the geometry fallback (getBoundingClientRect
// returns zeros) is exercised as a safe no-op here; these tests cover the
// deterministic selector-based logo/ad-UI suppression and the audio mute that
// make a detected midroll break stop interrupting the viewer.

function makeSeekableVideo(): HTMLVideoElement {
  const v = document.createElement('video');
  Object.defineProperty(v, 'readyState', { value: 2, configurable: true });
  Object.defineProperty(v, 'clientWidth', { value: 1280, configurable: true });
  Object.defineProperty(v, 'clientHeight', { value: 720, configurable: true });
  Object.defineProperty(v, 'seekable', {
    value: { length: 1, start: () => 0, end: () => 1000 } as unknown as TimeRanges,
    configurable: true,
  });
  return v;
}

afterEach(() => {
  stopSsaiBlock();
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('startSsaiBlock', () => {
  it("hides Kick's own ad-state / logo overlay during the break and restores it after", () => {
    vi.useFakeTimers();
    const logo = document.createElement('div');
    logo.className = 'StreamAdLogoPlaceholder'; // matches [class*="StreamAd"]
    document.body.appendChild(logo);

    startSsaiBlock(30, 'midroll');
    expect(logo.style.display).toBe('none');
    expect(logo.getAttribute('data-kab-ad-hidden')).toBe('1');

    stopSsaiBlock();
    expect(logo.style.display).toBe('');
    expect(logo.hasAttribute('data-kab-ad-hidden')).toBe(false);
  });

  it('does not touch unrelated, non-ad page elements', () => {
    vi.useFakeTimers();
    const chat = document.createElement('div');
    chat.className = 'chat-message';
    document.body.appendChild(chat);

    startSsaiBlock(30, 'midroll');
    expect(chat.style.display).toBe('');
    expect(chat.hasAttribute('data-kab-ad-hidden')).toBe(false);
  });

  it('mutes the live video during the break and unmutes it on stop', () => {
    vi.useFakeTimers();
    const v = makeSeekableVideo();
    v.muted = false;
    document.body.appendChild(v);

    startSsaiBlock(30, 'midroll');
    expect(v.muted).toBe(true);
    expect(v.getAttribute('data-kab-muted')).toBe('1');

    stopSsaiBlock();
    expect(v.muted).toBe(false);
    expect(v.hasAttribute('data-kab-muted')).toBe(false);
  });

  it('seeks the live video toward the live edge to skip past the stitched ad', () => {
    vi.useFakeTimers();
    const v = makeSeekableVideo();
    Object.defineProperty(v, 'currentTime', { value: 0, writable: true, configurable: true });
    document.body.appendChild(v);

    startSsaiBlock(30, 'midroll');
    // Live edge is end(1000) - 0.5 margin; we were at 0, well past the 1.5s lag gate.
    expect(v.currentTime).toBe(999.5);
  });

  it('leaves a video the user already muted muted after the break', () => {
    vi.useFakeTimers();
    const v = makeSeekableVideo();
    v.muted = true; // user's own choice
    document.body.appendChild(v);

    startSsaiBlock(30, 'midroll');
    stopSsaiBlock();
    expect(v.muted).toBe(true);
  });
});
