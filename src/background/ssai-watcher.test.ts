import { describe, it, expect } from 'vitest';
import { parseSsai } from './ssai-watcher';

// Realistic Amazon IVS server-side ad-insertion (SSAI) media playlist excerpt:
// a stitched ad break of six 5s segments = 30s, framed by DATERANGE markers.
const SSAI_MANIFEST = `#EXTM3U
#EXT-X-VERSION:6
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:1200
#EXTINF:6.000,
seg-live-1200.ts
#EXT-X-DATERANGE:ID="ad-1",CLASS="stitched-ad-break-start",AD-ROLL-TYPE="midroll",AD-BREAK-ID="8sAMcZcXrcox",PLANNED-DURATION=30.0
#EXT-X-DISCONTINUITY
#EXTINF:5.000,
ad-seg-0.ts
#EXTINF:5.000,
ad-seg-1.ts
#EXTINF:5.000,
ad-seg-2.ts
#EXTINF:5.000,
ad-seg-3.ts
#EXTINF:5.000,
ad-seg-4.ts
#EXTINF:5.000,
ad-seg-5.ts
#EXT-X-DATERANGE:ID="ad-1",CLASS="stitched-ad-break-end"
#EXT-X-DISCONTINUITY
#EXTINF:6.000,
seg-live-1201.ts
`;

describe('parseSsai', () => {
  it('returns null when there is no stitched ad break', () => {
    expect(parseSsai('#EXTM3U\n#EXTINF:6.0,\nseg.ts\n')).toBeNull();
  });

  it('sums the in-break #EXTINF durations instead of a single segment', () => {
    const r = parseSsai(SSAI_MANIFEST);
    expect(r).not.toBeNull();
    // 6 x 5s = 30s — NOT 3s and NOT a single 5s segment.
    expect(r?.duration).toBe(30);
    expect(r?.rollType).toBe('midroll');
    expect(r?.breakId).toBe('8sAMcZcXrcox');
  });

  it('does not count post-break live segments toward the ad duration', () => {
    const r = parseSsai(SSAI_MANIFEST);
    // The two 6s live segments outside the break must be excluded.
    expect(r?.duration).toBeLessThan(36);
  });

  it('falls back to CUE-OUT DURATION when no in-break EXTINF lines exist', () => {
    const cueOut = `#EXTM3U
#EXT-X-DATERANGE:CLASS="stitched-ad-break-start",AD-ROLL-TYPE="preroll",AD-BREAK-ID="abc"
#EXT-X-CUE-OUT:DURATION=15.0
#EXT-X-CUE-IN
`;
    const r = parseSsai(cueOut);
    expect(r?.duration).toBe(15);
    expect(r?.rollType).toBe('preroll');
  });

  it('clamps absurd durations to the 1..180s range', () => {
    const huge = `#EXTM3U
#EXT-X-DATERANGE:CLASS="stitched-ad-break-start",AD-BREAK-ID="x",PLANNED-DURATION=99999
`;
    const r = parseSsai(huge);
    expect(r?.duration).toBe(180);
  });
});
