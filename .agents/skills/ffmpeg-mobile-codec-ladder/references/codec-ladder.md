# Codec Ladder

## Mobile Hero

- AV1: best compression for modern Chromium/Android and newer Safari.
- HEVC `hvc1`: strong Safari/iOS path.
- H.264: universal fallback.
- Poster: required for LCP and initial paint.

## Scrub

All-intra improves `currentTime` precision but increases bytes. Use it only when the user scrolls/mouse-drags through exact frames.

## Transparency

Transparent video is not a normal MP4 ladder problem. Use `transparent-video-compositor` before encoding alpha assets.
