# Video Motion Pipeline

## Order

1. Audit source.
2. Decide interaction mode: scroll scrub, hover/mouse, autoplay loop, or canvas frames.
3. Encode only the variants required by that mode.
4. Integrate with semantic `<video>` or canvas.
5. Validate route, media paths, build, and visual composition.

## Mode Matrix

- Scroll scrub: all-intra HEVC/H.264 or canvas frames. Bigger files are acceptable only when the scrub must be exact.
- Hover/mouse activation: interframe HEVC/AV1/H.264. Do not use all-intra by default.
- Transparent overlay: WebM VP9 alpha for Chromium/Firefox, HEVC alpha for Safari when available, fallback image/sequence if support is uncertain.
- Hero LCP: poster required, explicit dimensions/aspect ratio required, preload depends on first viewport visibility.

## Failure Rule

If evidence is missing, report `INSUFFICIENT_EVIDENCE` and list the missing check.
