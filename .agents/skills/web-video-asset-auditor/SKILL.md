---
name: web-video-asset-auditor
description: "Use before encoding or integrating any web video. Audits MP4/WebM/MOV/GIF/image-sequence assets with ffprobe for codec, dimensions, duration, alpha risk, keyframes, frame count, bitrate, metadata, and suitability for mobile, scroll scrub, hover playback, or transparent overlays."
---

# Web Video Asset Auditor

Run this before changing frontend code. The output decides the pipeline.

## Required Command

```bash
node .agents/skills/web-video-asset-auditor/scripts/audit-video.mjs path/to/input.mp4
```

## Read The Result

- `allKeyframes: true`: safe for precise `currentTime` scrub.
- `allKeyframes: false`: OK for normal playback, risky for scrub.
- `alphaLikely: true`: preserve transparency; do not add background boxes.
- `durationSeconds > 12`: consider trimming, loop segmentation, or lazy loading.
- `sizeBytes > 3000000`: do not auto-load on mobile unless it is first-viewport critical.

## Decision

- Scroll scrub: send to `ffmpeg-mobile-codec-ladder` with scrub variant.
- Transparent overlay: send to `transparent-video-compositor`.
- 3D hero with text interactions: send to `scroll-scrub-video-choreographer`.
- QA blocker: if audit fails, return `INSUFFICIENT_EVIDENCE` with `RC_TOOL_FAILURE`.

## Reference

Read `references/audit-fields.md` for field definitions.
