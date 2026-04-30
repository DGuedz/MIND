---
name: ffmpeg-mobile-codec-ladder
description: "Use to encode web/mobile video ladders from source assets with FFmpeg: poster, AV1, HEVC, H.264 fallback, scrub/all-intra variants, metadata stripping, faststart, and size reports for responsive hero/video integrations."
---

# FFmpeg Mobile Codec Ladder

Source-grounded toolchain: use local `ffmpeg` and `ffprobe`. The GitHub `FFmpeg/FFmpeg` repo is a mirror of the official FFmpeg project; operational evidence should come from installed binaries and generated outputs.

## Fast Path

```bash
.agents/skills/ffmpeg-mobile-codec-ladder/scripts/encode-mobile-hero.sh input.mp4 apps/landingpage/public hero
```

Outputs:

- `hero-poster.jpg`
- `hero-mobile-av1.mp4`
- `hero-mobile-hevc.mp4`
- `hero-fallback-h264.mp4`
- `hero-scrub-hevc.mp4`

## Rules

- Always use `-map_metadata -1` for production derivatives.
- Always use `-movflags +faststart` for MP4.
- Use all-intra only for scrub; do not waste mobile bytes on normal hover/autoplay.
- Keep original source untouched.
- Report byte sizes after encode.
- If `libsvtav1` or `libx265` is missing, degrade explicitly and report `INSUFFICIENT_EVIDENCE` for that variant.

## Frontend Source Order

```html
<video muted playsInline preload="auto" poster="/hero-poster.jpg">
  <source src="/hero-mobile-av1.mp4" type='video/mp4; codecs="av01.0.08M.08"' />
  <source src="/hero-mobile-hevc.mp4" type='video/mp4; codecs="hvc1"' />
  <source src="/hero-fallback-h264.mp4" type='video/mp4; codecs="avc1.42E01E"' />
</video>
```

For scrub by `currentTime`, prefer selecting the scrub variant in code after browser support checks.

## Reference

Read `references/codec-ladder.md` for command variants and tradeoffs.
